import { describe, expect, it } from 'vitest';

import {
  NAKAMA_MATCH_STATE_OP_CODES,
  createNakamaClientConfig,
  decodeNakamaPeerMessagePayload,
  decodeNakamaPeerMessage,
  encodeNakamaPeerMessagePayload,
  encodeNakamaPeerMessage,
} from './nakama';
import type { PeerMessageEnvelope } from './protocol';

const baseMessage: PeerMessageEnvelope = {
  id: 'nakama-message-1',
  type: 'game/action',
  senderId: 'player-1',
  roomCode: 'AB12CD',
  version: 2,
  sentAt: 2000,
  payload: { action: 'mark-cell', cell: 4 },
};

describe('Nakama network bridge helpers', () => {
  it('uses local development client defaults', () => {
    expect(createNakamaClientConfig({})).toEqual({
      serverKey: 'local-nakama-server-key',
      host: '127.0.0.1',
      port: '7350',
      useSSL: false,
    });
  });

  it('reads public client configuration from the supplied environment', () => {
    expect(
      createNakamaClientConfig({
        NEXT_PUBLIC_NAKAMA_SERVER_KEY: 'public-client-key',
        NEXT_PUBLIC_NAKAMA_HOST: 'games.example.com',
        NEXT_PUBLIC_NAKAMA_PORT: '443',
        NEXT_PUBLIC_NAKAMA_USE_SSL: 'true',
      }),
    ).toEqual({
      serverKey: 'public-client-key',
      host: 'games.example.com',
      port: '443',
      useSSL: true,
    });
  });

  it('wraps the existing peer protocol as a Nakama match-state payload', () => {
    expect(NAKAMA_MATCH_STATE_OP_CODES.peerMessage).toBe(1);

    const encoded = encodeNakamaPeerMessage(baseMessage);
    const decoded = decodeNakamaPeerMessage(encoded);

    expect(decoded).toEqual({
      ok: true,
      message: baseMessage,
    });
  });

  it('encodes and decodes byte payloads for Nakama match state', () => {
    const encoded = encodeNakamaPeerMessagePayload(baseMessage);

    expect(encoded).toBeInstanceOf(Uint8Array);
    expect(decodeNakamaPeerMessagePayload(encoded)).toEqual({
      ok: true,
      message: baseMessage,
    });
  });
});
