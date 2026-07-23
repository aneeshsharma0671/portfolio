import { describe, expect, it } from 'vitest';

import {
  PEER_MESSAGE_MAX_BYTES,
  createMessageDeduper,
  parsePeerMessage,
  sanitizeProtocolRoomCode,
  serializePeerMessage,
  validatePeerMessage,
  type PeerMessageEnvelope,
} from './protocol';

const baseMessage: PeerMessageEnvelope = {
  id: 'message-1',
  type: 'system/ping',
  senderId: 'host-1',
  roomCode: 'AB12CD',
  version: 1,
  sentAt: 1000,
  payload: { ok: true },
};

describe('Play With Friends protocol validation', () => {
  it('sanitizes room codes', () => {
    expect(sanitizeProtocolRoomCode('ab-12 cd!!')).toBe('AB12CD');
  });

  it('accepts a valid serialized peer message', () => {
    expect(parsePeerMessage(serializePeerMessage(baseMessage))).toEqual({
      ok: true,
      message: baseMessage,
    });
  });

  it('rejects malformed, oversized, and unknown messages', () => {
    expect(parsePeerMessage('{nope')).toMatchObject({
      ok: false,
      reason: expect.stringMatching(/json/i),
    });

    expect(parsePeerMessage('x'.repeat(PEER_MESSAGE_MAX_BYTES + 1))).toMatchObject({
      ok: false,
      reason: expect.stringMatching(/large/i),
    });

    expect(
      validatePeerMessage({
        ...baseMessage,
        type: 'unknown/message',
      }),
    ).toMatchObject({
      ok: false,
      reason: expect.stringMatching(/unknown/i),
    });
  });

  it('rejects invalid room code, timestamp, version, and message id', () => {
    expect(validatePeerMessage({ ...baseMessage, roomCode: 'bad-code' })).toMatchObject({
      ok: false,
      reason: expect.stringMatching(/room/i),
    });
    expect(validatePeerMessage({ ...baseMessage, sentAt: 0 })).toMatchObject({
      ok: false,
      reason: expect.stringMatching(/timestamp/i),
    });
    expect(validatePeerMessage({ ...baseMessage, version: -1 })).toMatchObject({
      ok: false,
      reason: expect.stringMatching(/version/i),
    });
    expect(validatePeerMessage({ ...baseMessage, id: 'x'.repeat(65) })).toMatchObject({
      ok: false,
      reason: expect.stringMatching(/too long/i),
    });
  });

  it('tracks duplicate message ids', () => {
    const deduper = createMessageDeduper();

    expect(deduper.remember('message-1')).toBe(true);
    expect(deduper.remember('message-1')).toBe(false);
    expect(validatePeerMessage(baseMessage, new Set(['message-1']))).toMatchObject({
      ok: false,
      reason: expect.stringMatching(/duplicate/i),
    });
  });
});
