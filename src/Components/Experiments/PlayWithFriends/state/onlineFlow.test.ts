import { describe, expect, it } from 'vitest';

import {
  createOnlineGameSession,
  createOnlinePlayersFromPresences,
  getOnlineStartGate,
  getPlayWithFriendsPath,
  parsePlayWithFriendsGameId,
  parseOnlineGameReturnPayload,
  parseOnlineGameStartPayload,
  parseOnlineLobbySnapshotPayload,
} from './onlineFlow';

const presences = [
  { userId: 'guest-1', sessionId: 'session-guest', username: 'Guest' },
  { userId: 'host-1', sessionId: 'session-host', username: 'Host' },
  { userId: 'spectator-1', sessionId: 'session-spectator', username: 'Spec' },
];

describe('Play With Friends online flow', () => {
  it('builds stable route paths for entry, lobby, game list, and active games', () => {
    expect(getPlayWithFriendsPath('entry')).toBe('/experiments/playwithfriends');
    expect(getPlayWithFriendsPath('lobby')).toBe('/experiments/playwithfriends/lobby');
    expect(getPlayWithFriendsPath('games')).toBe('/experiments/playwithfriends/games');
    expect(getPlayWithFriendsPath('game', 'tic-tac-toe')).toBe(
      '/experiments/playwithfriends/games/tic-tac-toe',
    );
  });

  it('accepts only supported game ids from route and network payloads', () => {
    expect(parsePlayWithFriendsGameId('tic-tac-toe')).toBe('tic-tac-toe');
    expect(parsePlayWithFriendsGameId('unknown-game')).toBeNull();
    expect(parsePlayWithFriendsGameId(undefined)).toBeNull();
  });

  it('maps Nakama presences into lobby players with host and local markers', () => {
    expect(createOnlinePlayersFromPresences(presences, 'host-1', 'guest-1')).toEqual([
      {
        id: 'guest-1',
        name: 'Guest',
        role: 'guest',
        ready: true,
        connection: 'local',
      },
      {
        id: 'host-1',
        name: 'Host',
        role: 'host',
        ready: true,
        connection: 'remote',
      },
      {
        id: 'spectator-1',
        name: 'Spec',
        role: 'guest',
        ready: true,
        connection: 'remote',
      },
    ]);
  });

  it('only lets the host start a playable game with enough active players', () => {
    expect(
      getOnlineStartGate({
        localUserId: 'host-1',
        hostUserId: 'host-1',
        selectedGameId: 'tic-tac-toe',
        activePlayerIds: ['host-1', 'guest-1'],
        spectatorPlayerIds: [],
      }),
    ).toMatchObject({ canStart: true, reason: expect.stringMatching(/ready/i) });

    expect(
      getOnlineStartGate({
        localUserId: 'guest-1',
        hostUserId: 'host-1',
        selectedGameId: 'tic-tac-toe',
        activePlayerIds: ['host-1', 'guest-1'],
        spectatorPlayerIds: [],
      }),
    ).toMatchObject({ canStart: false, reason: expect.stringMatching(/host/i) });

    expect(
      getOnlineStartGate({
        localUserId: 'host-1',
        hostUserId: 'host-1',
        selectedGameId: 'connect-four',
        activePlayerIds: ['host-1', 'guest-1'],
        spectatorPlayerIds: [],
      }),
    ).toMatchObject({ canStart: false, reason: expect.stringMatching(/planned/i) });
  });

  it('creates active game sessions from online start decisions', () => {
    expect(
      createOnlineGameSession({
        sessionId: 'session-1',
        gameId: 'tic-tac-toe',
        activePlayerIds: ['host-1', 'guest-1'],
        spectatorPlayerIds: ['spectator-1'],
        startedAt: 1000,
      }),
    ).toEqual({
      id: 'session-1',
      gameId: 'tic-tac-toe',
      activePlayerIds: ['host-1', 'guest-1'],
      spectatorPlayerIds: ['spectator-1'],
      startedAt: 1000,
      status: 'active',
    });
  });

  it('validates lobby snapshot, game start, and game return payloads', () => {
    expect(
      parseOnlineLobbySnapshotPayload({
        hostUserId: 'host-1',
        selectedGameId: 'tic-tac-toe',
        activeGameId: null,
        activePlayerIds: ['host-1', 'guest-1'],
        spectatorPlayerIds: ['spectator-1'],
        readyPlayerIds: ['guest-1'],
        countdownStartedAt: 1000,
      }),
    ).toEqual({
      hostUserId: 'host-1',
      selectedGameId: 'tic-tac-toe',
      activeGameId: null,
      activePlayerIds: ['host-1', 'guest-1'],
      spectatorPlayerIds: ['spectator-1'],
      readyPlayerIds: ['guest-1'],
      countdownStartedAt: 1000,
    });

    expect(
      parseOnlineGameStartPayload({
        sessionId: 'session-1',
        gameId: 'tic-tac-toe',
        hostUserId: 'host-1',
        activePlayerIds: ['host-1', 'guest-1'],
        spectatorPlayerIds: [],
        state: { board: [] },
      }),
    ).toMatchObject({
      sessionId: 'session-1',
      gameId: 'tic-tac-toe',
      hostUserId: 'host-1',
    });

    expect(parseOnlineGameReturnPayload({ selectedGameId: 'tic-tac-toe' })).toEqual({
      selectedGameId: 'tic-tac-toe',
    });
    expect(parseOnlineGameStartPayload({ gameId: 'connect-four' })).toBeNull();
    expect(parseOnlineLobbySnapshotPayload({ selectedGameId: 'unknown' })).toBeNull();
  });
});
