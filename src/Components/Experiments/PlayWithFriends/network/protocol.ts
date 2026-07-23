export const PEER_MESSAGE_MAX_BYTES = 16 * 1024;
export const PEER_MESSAGE_ID_MAX_LENGTH = 64;

export const ALLOWED_PEER_MESSAGE_TYPES = [
  'lobby/snapshot',
  'lobby/player-joined',
  'lobby/player-left',
  'game/start',
  'game/action',
  'game/state',
  'system/ping',
  'system/pong',
] as const;

export type PeerMessageType = (typeof ALLOWED_PEER_MESSAGE_TYPES)[number];

export type PeerMessageEnvelope = {
  id: string;
  type: PeerMessageType;
  senderId: string;
  roomCode: string;
  version: number;
  sentAt: number;
  payload: unknown;
};

export type ProtocolParseResult =
  | { ok: true; message: PeerMessageEnvelope }
  | { ok: false; reason: string };

const allowedMessageTypes = new Set<string>(ALLOWED_PEER_MESSAGE_TYPES);
const roomCodePattern = /^[A-Z0-9]{4,8}$/;

export function sanitizeProtocolRoomCode(roomCode: string) {
  return roomCode
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 8);
}

export function createMessageDeduper() {
  const seenIds = new Set<string>();

  return {
    has(messageId: string) {
      return seenIds.has(messageId);
    },
    remember(messageId: string) {
      if (!messageId) {
        return false;
      }

      if (seenIds.has(messageId)) {
        return false;
      }

      seenIds.add(messageId);
      return true;
    },
  };
}

export function serializePeerMessage(message: PeerMessageEnvelope) {
  return JSON.stringify(message);
}

export function parsePeerMessage(input: string, seenMessageIds?: Set<string>): ProtocolParseResult {
  if (new Blob([input]).size > PEER_MESSAGE_MAX_BYTES) {
    return { ok: false, reason: 'Message is too large.' };
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(input);
  } catch {
    return { ok: false, reason: 'Message is not valid JSON.' };
  }

  return validatePeerMessage(parsed, seenMessageIds);
}

export function validatePeerMessage(
  input: unknown,
  seenMessageIds?: Set<string>,
): ProtocolParseResult {
  if (!input || typeof input !== 'object') {
    return { ok: false, reason: 'Message must be an object.' };
  }

  const candidate = input as Partial<PeerMessageEnvelope>;

  if (typeof candidate.id !== 'string' || !candidate.id.trim()) {
    return { ok: false, reason: 'Message id is required.' };
  }

  if (candidate.id.length > PEER_MESSAGE_ID_MAX_LENGTH) {
    return { ok: false, reason: 'Message id is too long.' };
  }

  if (seenMessageIds?.has(candidate.id)) {
    return { ok: false, reason: 'Duplicate message ignored.' };
  }

  if (typeof candidate.type !== 'string' || !allowedMessageTypes.has(candidate.type)) {
    return { ok: false, reason: 'Unknown message type.' };
  }

  if (typeof candidate.senderId !== 'string' || !candidate.senderId.trim()) {
    return { ok: false, reason: 'Sender id is required.' };
  }

  if (
    typeof candidate.roomCode !== 'string' ||
    !roomCodePattern.test(candidate.roomCode)
  ) {
    return { ok: false, reason: 'Room code is invalid.' };
  }

  if (
    typeof candidate.version !== 'number' ||
    !Number.isInteger(candidate.version) ||
    candidate.version < 0
  ) {
    return { ok: false, reason: 'Version must be a non-negative integer.' };
  }

  if (
    typeof candidate.sentAt !== 'number' ||
    !Number.isFinite(candidate.sentAt) ||
    candidate.sentAt <= 0
  ) {
    return { ok: false, reason: 'sentAt must be a timestamp.' };
  }

  return {
    ok: true,
    message: {
      id: candidate.id,
      type: candidate.type as PeerMessageType,
      senderId: candidate.senderId,
      roomCode: candidate.roomCode,
      version: candidate.version,
      sentAt: candidate.sentAt,
      payload: candidate.payload,
    },
  };
}
