import {
  sanitizeProtocolRoomCode,
  type PeerMessageEnvelope,
  type PeerMessageType,
} from './protocol';
import type { NakamaClientConfig } from './nakama';

export const NAKAMA_DEVICE_ID_STORAGE_KEY = 'play-with-friends:nakama-device-id';
export const NAKAMA_FALLBACK_ROOM_CODE = 'NAKAMA';

export type NakamaPresenceSummary = {
  userId: string;
  sessionId: string;
  username: string;
};

type NakamaPresenceLike = {
  user_id?: unknown;
  userId?: unknown;
  session_id?: unknown;
  sessionId?: unknown;
  username?: unknown;
};

type NakamaPresenceEventLike = {
  joins?: unknown;
  leaves?: unknown;
};

type NakamaMatchLike = {
  id?: unknown;
  match_id?: unknown;
  matchId?: unknown;
  match?: unknown;
};

type BrowserStorage = Pick<Storage, 'getItem' | 'setItem'>;

type CreateNakamaPeerMessageInput = {
  type: PeerMessageType;
  senderId: string;
  matchId: string;
  payload: unknown;
  version?: number;
  now?: () => number;
  createId?: () => string;
};

export function normalizeNakamaPresence(
  presence: unknown,
): NakamaPresenceSummary | null {
  if (!presence || typeof presence !== 'object') {
    return null;
  }

  const candidate = presence as NakamaPresenceLike;
  const userId = getString(candidate.user_id) ?? getString(candidate.userId);
  const sessionId = getString(candidate.session_id) ?? getString(candidate.sessionId);

  if (!userId || !sessionId) {
    return null;
  }

  return {
    userId,
    sessionId,
    username: getString(candidate.username) ?? 'Player',
  };
}

export function mergeNakamaPresenceEvent(
  currentPresences: NakamaPresenceSummary[],
  event: NakamaPresenceEventLike,
) {
  const bySessionId = new Map(
    currentPresences.map((presence) => [presence.sessionId, presence]),
  );

  for (const presence of normalizePresenceList(event.leaves)) {
    bySessionId.delete(presence.sessionId);
  }

  for (const presence of normalizePresenceList(event.joins)) {
    bySessionId.set(presence.sessionId, presence);
  }

  return Array.from(bySessionId.values());
}

export function getNakamaMatchPresences(self: unknown, presences: unknown) {
  const selfPresence = normalizeNakamaPresence(self);
  const joinedPresences = normalizePresenceList(presences);

  return selfPresence ? [selfPresence, ...joinedPresences] : joinedPresences;
}

export function getSortedNakamaSeatPlayerIds(
  presences: NakamaPresenceSummary[],
  maxPlayers = 2,
) {
  return [...presences]
    .sort((first, second) => first.userId.localeCompare(second.userId))
    .slice(0, maxPlayers)
    .map((presence) => presence.userId);
}

export function getNakamaMatchId(matchResponse: unknown): string {
  if (typeof matchResponse === 'string') {
    return matchResponse.trim();
  }

  if (!matchResponse || typeof matchResponse !== 'object') {
    return '';
  }

  const candidate = matchResponse as NakamaMatchLike;
  const directId =
    getString(candidate.match_id) ??
    getString(candidate.matchId) ??
    getString(candidate.id);

  if (directId) {
    return directId;
  }

  return getNakamaMatchId(candidate.match);
}

export function createNakamaRoomCode(matchId: string) {
  const roomCode = sanitizeProtocolRoomCode(matchId);

  return roomCode.length >= 4 ? roomCode : NAKAMA_FALLBACK_ROOM_CODE;
}

export function getOrCreateNakamaDeviceId(
  storage: BrowserStorage,
  createId = createNakamaDeviceId,
) {
  const existingDeviceId = storage.getItem(NAKAMA_DEVICE_ID_STORAGE_KEY);

  if (existingDeviceId) {
    return existingDeviceId;
  }

  const deviceId = createId();
  storage.setItem(NAKAMA_DEVICE_ID_STORAGE_KEY, deviceId);

  return deviceId;
}

export function createNakamaDeviceId() {
  const randomId =
    typeof globalThis.crypto?.randomUUID === 'function'
      ? globalThis.crypto.randomUUID()
      : Math.random().toString(36).slice(2, 14);

  return `pwf-${randomId}`;
}

export function createNakamaPeerMessage({
  type,
  senderId,
  matchId,
  payload,
  version = 1,
  now = Date.now,
  createId = createBrowserMessageId,
}: CreateNakamaPeerMessageInput): PeerMessageEnvelope {
  return {
    id: createId(),
    type,
    senderId,
    roomCode: createNakamaRoomCode(matchId),
    version,
    sentAt: now(),
    payload,
  };
}

export function resolveBrowserNakamaConfig(
  config: NakamaClientConfig,
  browserHostname: string,
): NakamaClientConfig {
  if (!browserHostname || isLocalHost(browserHostname) || !isLocalHost(config.host)) {
    return config;
  }

  return {
    ...config,
    host: browserHostname,
  };
}

function normalizePresenceList(input: unknown) {
  if (!Array.isArray(input)) {
    return [];
  }

  return input
    .map((presence) => normalizeNakamaPresence(presence))
    .filter((presence): presence is NakamaPresenceSummary => Boolean(presence));
}

function createBrowserMessageId() {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID();
  }

  return `message-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function isLocalHost(host: string) {
  return ['127.0.0.1', 'localhost', '0.0.0.0', '::1'].includes(host);
}

function getString(value: unknown) {
  return typeof value === 'string' && value.trim() ? value : null;
}
