import { describe, expect, it } from 'vitest';

import {
  PLAY_WITH_FRIENDS_GAMES,
  canPlayerToggleReady,
  createInitialPlayWithFriendsState,
  getGameSeating,
  getPlayerPermissions,
  getStartGate,
  lobbyReducer,
  type Player,
  type PlayWithFriendsState,
} from './lobbyState';

const ticTacToe = PLAY_WITH_FRIENDS_GAMES.find((game) => game.id === 'tic-tac-toe');

function player(overrides: Partial<Player> & Pick<Player, 'id' | 'name'>): Player {
  return {
    role: 'guest',
    ready: false,
    connection: 'mock',
    ...overrides,
  };
}

function lobbyState(
  players: Player[],
  overrides: Partial<PlayWithFriendsState> = {},
): PlayWithFriendsState {
  const host = players.find((candidate) => candidate.role === 'host');

  return {
    ...createInitialPlayWithFriendsState(),
    phase: 'lobby',
    roomCode: 'ROOM1',
    hostPlayerId: host?.id ?? null,
    localPlayerId: host?.id ?? null,
    players,
    eventLog: [],
    ...overrides,
  };
}

describe('Play With Friends lobby state', () => {
  it('seats the host first, then the earliest ready non-host, and spectates extras', () => {
    expect(ticTacToe).toBeDefined();

    const host = player({
      id: 'host-1',
      name: 'Host',
      role: 'host',
      ready: true,
      connection: 'local',
    });
    const idleGuest = player({ id: 'guest-idle', name: 'Idle Guest' });
    const readyGuest = player({ id: 'guest-ready', name: 'Ready Guest', ready: true });
    const extraReadyGuest = player({
      id: 'guest-extra',
      name: 'Extra Ready Guest',
      ready: true,
    });

    const seating = getGameSeating(
      [host, idleGuest, readyGuest, extraReadyGuest],
      ticTacToe!,
    );

    expect(seating.activePlayerIds).toEqual(['host-1', 'guest-ready']);
    expect(seating.spectatorPlayerIds).toEqual(['guest-idle', 'guest-extra']);
  });

  it('allows the host to start when the seated guest is ready and spectators are idle', () => {
    const host = player({
      id: 'host-1',
      name: 'Host',
      role: 'host',
      ready: true,
      connection: 'local',
    });
    const readyGuest = player({ id: 'guest-ready', name: 'Ready Guest', ready: true });
    const idleSpectator = player({ id: 'guest-spectator', name: 'Spectator' });
    const state = lobbyState([host, readyGuest, idleSpectator]);

    const gate = getStartGate(state);

    expect(gate.canStart).toBe(true);
    expect(gate.activePlayerIds).toEqual(['host-1', 'guest-ready']);
    expect(gate.spectatorPlayerIds).toEqual(['guest-spectator']);
  });

  it('blocks start for missing seated players, planned games, and non-host actors', () => {
    const host = player({
      id: 'host-1',
      name: 'Host',
      role: 'host',
      ready: true,
      connection: 'local',
    });
    const guest = player({ id: 'guest-1', name: 'Guest', ready: true });

    expect(getStartGate(lobbyState([host])).canStart).toBe(false);
    expect(getStartGate(lobbyState([host])).reason).toMatch(/2 seated players/i);

    const plannedGate = getStartGate(
      lobbyState([host, guest], { selectedGameId: 'connect-four' }),
    );
    expect(plannedGate.canStart).toBe(false);
    expect(plannedGate.reason).toMatch(/planned/i);

    const guestGate = getStartGate(lobbyState([host, guest], { localPlayerId: guest.id }));
    expect(guestGate.canStart).toBe(false);
    expect(guestGate.reason).toMatch(/host/i);
  });

  it('reports host and guest permissions without letting guests control the lobby', () => {
    const host = player({
      id: 'host-1',
      name: 'Host',
      role: 'host',
      ready: true,
      connection: 'local',
    });
    const guest = player({
      id: 'guest-1',
      name: 'Guest',
      ready: true,
      connection: 'local',
    });
    const mockGuest = player({ id: 'mock-1', name: 'Mock Guest' });
    const state = lobbyState([host, guest, mockGuest]);

    expect(getPlayerPermissions(state, host.id)).toMatchObject({
      canAddMockPlayer: true,
      canSelectGame: true,
      canReturnToLobby: false,
    });
    expect(getPlayerPermissions(state, guest.id)).toMatchObject({
      canAddMockPlayer: false,
      canSelectGame: false,
      canStartGame: false,
    });
    expect(canPlayerToggleReady(state, guest.id, guest.id)).toBe(true);
    expect(canPlayerToggleReady(state, guest.id, mockGuest.id)).toBe(false);
    expect(canPlayerToggleReady(state, host.id, mockGuest.id)).toBe(true);
  });

  it('runs reducer phases, start gating, and active game session creation', () => {
    let state = createInitialPlayWithFriendsState();

    state = lobbyReducer(state, { type: 'set-player-name', name: '  Captain  ' });
    state = lobbyReducer(state, {
      type: 'host-room',
      hostPlayerId: 'host-1',
      roomCode: 'abc123',
    });

    expect(state.phase).toBe('lobby');
    expect(state.roomCode).toBe('ABC123');
    expect(state.players[0]).toMatchObject({
      id: 'host-1',
      name: 'Captain',
      role: 'host',
      ready: true,
    });

    state = lobbyReducer(state, { type: 'add-mock-player', playerId: 'mock-1' });
    state = lobbyReducer(state, { type: 'add-mock-player', playerId: 'mock-2' });

    const blocked = lobbyReducer(state, {
      type: 'start-game',
      sessionId: 'session-1',
      startedAt: 100,
    });

    expect(blocked.phase).toBe('lobby');
    expect(blocked.activeGameSession).toBeNull();
    expect(blocked.lastError).toMatch(/ready non-host/i);

    state = lobbyReducer(state, { type: 'toggle-ready', playerId: 'mock-1' });
    state = lobbyReducer(state, {
      type: 'start-game',
      sessionId: 'session-1',
      startedAt: 100,
    });

    expect(state.phase).toBe('game');
    expect(state.activeGameId).toBe('tic-tac-toe');
    expect(state.activeGameSession).toMatchObject({
      id: 'session-1',
      gameId: 'tic-tac-toe',
      activePlayerIds: ['host-1', 'mock-1'],
      spectatorPlayerIds: ['mock-2'],
      status: 'active',
    });
  });

  it('creates a joining preview with a remote host and local guest', () => {
    let state = createInitialPlayWithFriendsState();

    state = lobbyReducer(state, { type: 'show-join' });
    state = lobbyReducer(state, { type: 'set-player-name', name: ' Guest ' });
    state = lobbyReducer(state, { type: 'set-join-code', code: 'ab-12 cd' });
    state = lobbyReducer(state, {
      type: 'join-preview',
      fallbackRoomCode: 'zz999',
      guestPlayerId: 'guest-1',
      hostPlayerId: 'remote-host-1',
    });

    expect(state.phase).toBe('lobby');
    expect(state.roomCode).toBe('AB12CD');
    expect(state.hostPlayerId).toBe('remote-host-1');
    expect(state.localPlayerId).toBe('guest-1');
    expect(state.players).toEqual([
      expect.objectContaining({
        id: 'remote-host-1',
        role: 'host',
        connection: 'mock',
        ready: true,
      }),
      expect.objectContaining({
        id: 'guest-1',
        name: 'Guest',
        role: 'guest',
        connection: 'local',
        ready: false,
      }),
    ]);
  });
});
