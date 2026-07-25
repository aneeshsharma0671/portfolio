import { describe, expect, it } from 'vitest';

import {
  createNakamaPeerMessage,
  createNakamaRoomCode,
  getNakamaMatchId,
  getNakamaMatchPresences,
  getOrCreateNakamaDeviceId,
  getSortedNakamaSeatPlayerIds,
  mergeNakamaPresenceEvent,
  normalizeNakamaPresence,
  resolveBrowserNakamaConfig,
} from './nakamaLobby';

describe('Nakama lobby helpers', () => {
  it('normalizes snake_case and camelCase presence shapes', () => {
    expect(
      normalizeNakamaPresence({
        user_id: 'user-a',
        session_id: 'session-a',
        username: 'Aneesh',
      }),
    ).toEqual({
      userId: 'user-a',
      sessionId: 'session-a',
      username: 'Aneesh',
    });

    expect(
      normalizeNakamaPresence({
        userId: 'user-b',
        sessionId: 'session-b',
        username: 'Guest',
      }),
    ).toEqual({
      userId: 'user-b',
      sessionId: 'session-b',
      username: 'Guest',
    });
  });

  it('processes leave events before joins and deduplicates presences', () => {
    const presences = mergeNakamaPresenceEvent(
      [
        { userId: 'user-a', sessionId: 'old-a', username: 'Old A' },
        { userId: 'user-b', sessionId: 'session-b', username: 'B' },
      ],
      {
        leaves: [{ user_id: 'user-a', session_id: 'old-a', username: 'Old A' }],
        joins: [
          { user_id: 'user-a', session_id: 'new-a', username: 'New A' },
          { user_id: 'user-a', session_id: 'new-a', username: 'New A' },
        ],
      },
    );

    expect(presences).toEqual([
      { userId: 'user-b', sessionId: 'session-b', username: 'B' },
      { userId: 'user-a', sessionId: 'new-a', username: 'New A' },
    ]);
  });

  it('handles missing Nakama presence lists from create-match responses', () => {
    expect(getNakamaMatchPresences(undefined, undefined)).toEqual([]);
    expect(
      getNakamaMatchPresences(
        { user_id: 'self', session_id: 'session-self', username: 'Self' },
        undefined,
      ),
    ).toEqual([{ userId: 'self', sessionId: 'session-self', username: 'Self' }]);
  });

  it('extracts match ids from Nakama response variants', () => {
    expect(getNakamaMatchId({ match: { match_id: 'match-from-wrapper' } })).toBe(
      'match-from-wrapper',
    );
    expect(getNakamaMatchId({ match_id: 'match-from-snake' })).toBe('match-from-snake');
    expect(getNakamaMatchId({ id: 'match-from-id' })).toBe('match-from-id');
  });

  it('creates protocol-safe room codes from match ids', () => {
    expect(createNakamaRoomCode('e351f480-9db1-46fd.nakama')).toBe('E351F480');
    expect(createNakamaRoomCode('...')).toBe('NAKAMA');
  });

  it('assigns deterministic seats from presence user ids', () => {
    expect(
      getSortedNakamaSeatPlayerIds([
        { userId: 'user-z', sessionId: 'session-z', username: 'Zed' },
        { userId: 'user-a', sessionId: 'session-a', username: 'A' },
        { userId: 'user-m', sessionId: 'session-m', username: 'M' },
      ]),
    ).toEqual(['user-a', 'user-m']);
  });

  it('reuses a stored device id and creates one when missing', () => {
    const store = new Map<string, string>();
    const storage = {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => store.set(key, value),
    };

    expect(getOrCreateNakamaDeviceId(storage, () => 'device-created')).toBe(
      'device-created',
    );
    expect(getOrCreateNakamaDeviceId(storage, () => 'device-new')).toBe(
      'device-created',
    );
  });

  it('creates valid peer envelopes for match state broadcasts', () => {
    expect(
      createNakamaPeerMessage({
        type: 'game/action',
        senderId: 'user-a',
        matchId: 'e351f480-9db1-46fd.nakama',
        payload: { cellIndex: 4 },
        now: () => 1000,
        createId: () => 'message-id',
      }),
    ).toEqual({
      id: 'message-id',
      type: 'game/action',
      senderId: 'user-a',
      roomCode: 'E351F480',
      version: 1,
      sentAt: 1000,
      payload: { cellIndex: 4 },
    });
  });

  it('uses the browser host when a production page still has local Nakama defaults', () => {
    expect(
      resolveBrowserNakamaConfig(
        {
          serverKey: 'local-nakama-server-key',
          host: '127.0.0.1',
          port: '7350',
          useSSL: false,
        },
        '3.108.212.210',
      ),
    ).toEqual({
      serverKey: 'local-nakama-server-key',
      host: '3.108.212.210',
      port: '7350',
      useSSL: false,
    });
  });

  it('keeps configured and local-development Nakama hosts unchanged', () => {
    expect(
      resolveBrowserNakamaConfig(
        {
          serverKey: 'public-client-key',
          host: 'games.example.com',
          port: '443',
          useSSL: true,
        },
        'portfolio.example.com',
      ).host,
    ).toBe('games.example.com');

    expect(
      resolveBrowserNakamaConfig(
        {
          serverKey: 'local-nakama-server-key',
          host: '127.0.0.1',
          port: '7350',
          useSSL: false,
        },
        'localhost',
      ).host,
    ).toBe('127.0.0.1');
  });
});
