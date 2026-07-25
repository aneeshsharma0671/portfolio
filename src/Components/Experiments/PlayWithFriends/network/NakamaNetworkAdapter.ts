import {
  Client,
  type Match,
  type MatchData,
  type MatchPresenceEvent,
  type Session,
  type Socket,
} from '@heroiclabs/nakama-js';

import type { NetworkAdapter } from './LocalNetworkAdapter';
import { logNakamaDebugEvent } from './nakamaDevTools';
import {
  NAKAMA_MATCH_STATE_OP_CODES,
  createNakamaClientConfig,
  decodeNakamaPeerMessagePayload,
  encodeNakamaPeerMessagePayload,
  type NakamaClientConfig,
} from './nakama';
import {
  createNakamaRoomCode,
  getNakamaMatchPresences,
  getNakamaMatchId,
  mergeNakamaPresenceEvent,
  normalizeNakamaPresence,
  type NakamaPresenceSummary,
} from './nakamaLobby';
import type { PeerMessageEnvelope } from './protocol';

export type NakamaAuthenticatedUser = {
  userId: string;
  username: string;
  created: boolean;
};

export type NakamaMatchSnapshot = {
  matchId: string;
  roomCode: string;
  self: NakamaPresenceSummary | null;
  presences: NakamaPresenceSummary[];
};

export type NakamaAuthenticationInput = {
  deviceId: string;
  username: string;
  create?: boolean;
};

type MessageHandler = (message: PeerMessageEnvelope) => void;
type ErrorHandler = (message: string) => void;
type PresenceHandler = (presences: NakamaPresenceSummary[]) => void;

export class NakamaNetworkAdapter implements NetworkAdapter {
  private readonly client: Client;
  private socket: Socket | null = null;
  private session: Session | null = null;
  private matchId = '';
  private roomCode = '';
  private selfPresence: NakamaPresenceSummary | null = null;
  private presences: NakamaPresenceSummary[] = [];
  private seenMessageIds = new Set<string>();
  private messageHandlers = new Set<MessageHandler>();
  private errorHandlers = new Set<ErrorHandler>();
  private presenceHandlers = new Set<PresenceHandler>();

  constructor(private readonly config: NakamaClientConfig = createNakamaClientConfig({})) {
    this.client = new Client(
      config.serverKey,
      config.host,
      config.port,
      config.useSSL,
    );
  }

  async authenticate({
    deviceId,
    username,
    create = true,
  }: NakamaAuthenticationInput): Promise<NakamaAuthenticatedUser> {
    logNakamaDebugEvent('auth:start', {
      host: this.config.host,
      port: this.config.port,
      useSSL: this.config.useSSL,
      deviceId,
      username,
      create,
    });

    this.session = await this.client.authenticateDevice(
      deviceId,
      create,
      sanitizeNakamaUsername(username),
    );

    const socket = this.client.createSocket(this.config.useSSL, false);
    this.socket = socket;
    this.registerSocketHandlers(socket);
    await socket.connect(this.session, true);

    logNakamaDebugEvent('auth:connected', {
      userId: this.session.user_id,
      username: this.session.username,
      created: this.session.created,
    });

    return {
      userId: this.session.user_id ?? '',
      username: this.session.username ?? username,
      created: this.session.created,
    };
  }

  async createRoom(roomCode: string) {
    const socket = this.getSocketOrThrow();
    logNakamaDebugEvent('match:create-room', { roomCode });
    const match = await socket.createMatch(roomCode || undefined);

    this.setCurrentMatch(match);
  }

  async joinRoom(roomCode: string) {
    const socket = this.getSocketOrThrow();
    logNakamaDebugEvent('match:join-room', { roomCode });
    const match = await socket.joinMatch(roomCode.trim());

    this.setCurrentMatch(match);
  }

  async createMatch(matchName?: string) {
    const socket = this.getSocketOrThrow();
    logNakamaDebugEvent('match:create', { matchName });
    const match = await socket.createMatch(matchName?.trim() || undefined);

    return this.setCurrentMatch(match);
  }

  async joinMatch(matchId: string) {
    const socket = this.getSocketOrThrow();
    logNakamaDebugEvent('match:join', { matchId });
    const match = await socket.joinMatch(matchId.trim());

    return this.setCurrentMatch(match);
  }

  leave() {
    if (!this.socket || !this.matchId) {
      logNakamaDebugEvent('match:leave-empty');
      this.clearMatch();
      return;
    }

    const matchId = this.matchId;
    logNakamaDebugEvent('match:leave', { matchId });
    this.clearMatch();
    void this.socket.leaveMatch(matchId).catch((error: unknown) => {
      this.emitError(getNakamaErrorMessage(error));
    });
  }

  disconnect() {
    logNakamaDebugEvent('socket:disconnect', {
      matchId: this.matchId,
      userId: this.session?.user_id,
    });
    this.clearMatch();

    if (this.socket) {
      this.socket.disconnect(false);
    }

    this.socket = null;
    this.session = null;
  }

  broadcast(message: PeerMessageEnvelope) {
    void this.broadcastAsync(message);
  }

  async broadcastAsync(message: PeerMessageEnvelope) {
    if (!this.socket || !this.matchId) {
      this.emitError('Join a Nakama match before sending match state.');
      return;
    }

    const normalizedMessage = {
      ...message,
      roomCode: this.roomCode,
    };

    logNakamaDebugEvent('match:send-state', {
      matchId: this.matchId,
      type: normalizedMessage.type,
      messageId: normalizedMessage.id,
      senderId: normalizedMessage.senderId,
    });

    await this.socket.sendMatchState(
      this.matchId,
      NAKAMA_MATCH_STATE_OP_CODES.peerMessage,
      encodeNakamaPeerMessagePayload(normalizedMessage),
    );
  }

  onMessage(handler: MessageHandler) {
    this.messageHandlers.add(handler);
    return () => this.messageHandlers.delete(handler);
  }

  onError(handler: ErrorHandler) {
    this.errorHandlers.add(handler);
    return () => this.errorHandlers.delete(handler);
  }

  onPresence(handler: PresenceHandler) {
    this.presenceHandlers.add(handler);
    return () => this.presenceHandlers.delete(handler);
  }

  getCurrentMatch() {
    if (!this.matchId) {
      return null;
    }

    return this.createSnapshot();
  }

  private registerSocketHandlers(socket: Socket) {
    socket.onerror = () => {
      logNakamaDebugEvent('socket:error');
      this.emitError('Nakama socket error.');
    };
    socket.ondisconnect = () => {
      logNakamaDebugEvent('socket:disconnected');
      this.emitError('Nakama socket disconnected.');
    };

    socket.onmatchdata = (matchData: MatchData) => {
      if (matchData.op_code !== NAKAMA_MATCH_STATE_OP_CODES.peerMessage) {
        logNakamaDebugEvent('match:data-ignored', {
          matchId: matchData.match_id,
          opCode: matchData.op_code,
        });
        return;
      }

      const parsed = decodeNakamaPeerMessagePayload(
        matchData.data,
        this.seenMessageIds,
      );

      if (!parsed.ok) {
        logNakamaDebugEvent('match:data-invalid', {
          matchId: matchData.match_id,
          reason: parsed.reason,
        });
        this.emitError(parsed.reason);
        return;
      }

      this.seenMessageIds.add(parsed.message.id);
      logNakamaDebugEvent('match:data-received', {
        matchId: matchData.match_id,
        type: parsed.message.type,
        messageId: parsed.message.id,
        senderId: parsed.message.senderId,
      });
      this.messageHandlers.forEach((handler) => handler(parsed.message));
    };

    socket.onmatchpresence = (presenceEvent: MatchPresenceEvent) => {
      this.presences = mergeNakamaPresenceEvent(this.presences, presenceEvent);
      logNakamaDebugEvent('match:presence', {
        matchId: presenceEvent.match_id,
        joins: presenceEvent.joins.length,
        leaves: presenceEvent.leaves.length,
        presences: this.presences.length,
      });
      this.presenceHandlers.forEach((handler) => handler(this.presences));
    };
  }

  private setCurrentMatch(match: Match): NakamaMatchSnapshot {
    const matchId = getNakamaMatchId(match);

    if (!matchId) {
      throw new Error('Nakama did not return a match id.');
    }

    this.matchId = matchId;
    this.roomCode = createNakamaRoomCode(matchId);
    this.selfPresence = normalizeNakamaPresence(match.self);
    this.presences = getNakamaMatchPresences(match.self, match.presences);
    this.seenMessageIds = new Set<string>();
    this.presenceHandlers.forEach((handler) => handler(this.presences));

    logNakamaDebugEvent('match:current', {
      matchId: this.matchId,
      roomCode: this.roomCode,
      presences: this.presences.length,
      selfUserId: this.selfPresence?.userId,
    });

    return this.createSnapshot();
  }

  private clearMatch() {
    this.matchId = '';
    this.roomCode = '';
    this.selfPresence = null;
    this.presences = [];
    this.seenMessageIds = new Set<string>();
    this.presenceHandlers.forEach((handler) => handler(this.presences));
  }

  private createSnapshot(): NakamaMatchSnapshot {
    return {
      matchId: this.matchId,
      roomCode: this.roomCode,
      self: this.selfPresence,
      presences: this.presences,
    };
  }

  private getSocketOrThrow() {
    if (!this.socket || !this.session) {
      throw new Error('Create or login a Nakama user first.');
    }

    return this.socket;
  }

  private emitError(message: string) {
    logNakamaDebugEvent('adapter:error', { message });
    this.errorHandlers.forEach((handler) => handler(message));
  }
}

export function getNakamaErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  return 'Nakama request failed.';
}

function sanitizeNakamaUsername(username: string) {
  const sanitized = username
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^A-Za-z0-9_.-]/g, '')
    .slice(0, 32);

  return sanitized || 'player';
}
