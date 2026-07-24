import { PLAY_WITH_FRIENDS_GAMES, getGameById } from './games';
import type {
  GameDefinition,
  GameSeating,
  LobbyAction,
  Player,
  PlayerPermissions,
  PlayWithFriendsState,
  StartGate,
} from './types';

export { PLAY_WITH_FRIENDS_GAMES, getGameById };
export type {
  GameDefinition,
  GameSeating,
  GameSession,
  LobbyAction,
  Player,
  PlayerPermissions,
  PlayWithFriendsGameId,
  PlayWithFriendsPhase,
  PlayWithFriendsState,
  StartGate,
} from './types';

const DEFAULT_PLAYER_NAME = 'Player';
const EVENT_LOG_LIMIT = 5;
const MAX_DISPLAY_NAME_LENGTH = 24;
const MAX_ROOM_CODE_LENGTH = 8;

function capVisibleCharacters(value: string, limit: number) {
  return Array.from(value).slice(0, limit).join('');
}

export function sanitizeDisplayName(name: string) {
  const trimmedName = name.trim();

  if (!trimmedName) {
    return DEFAULT_PLAYER_NAME;
  }

  return capVisibleCharacters(trimmedName, MAX_DISPLAY_NAME_LENGTH);
}

export function sanitizeRoomCode(code: string) {
  return code
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, MAX_ROOM_CODE_LENGTH);
}

export function createInitialPlayWithFriendsState(): PlayWithFriendsState {
  return {
    phase: 'entry',
    roomCode: '',
    playerName: '',
    joinCode: '',
    selectedGameId: 'tic-tac-toe',
    activeGameId: null,
    activeGameSession: null,
    localPlayerId: null,
    hostPlayerId: null,
    players: [],
    eventLog: ['Lobby shell loaded'],
    connectionMode: 'local-mock',
    lastError: null,
  };
}

export const initialPlayWithFriendsState = createInitialPlayWithFriendsState();

export function pushLog(state: PlayWithFriendsState, message: string) {
  return [message, ...state.eventLog].slice(0, EVENT_LOG_LIMIT);
}

export function getHostPlayer(state: PlayWithFriendsState) {
  return state.players.find((player) => player.id === state.hostPlayerId) ?? null;
}

export function getLocalPlayer(state: PlayWithFriendsState) {
  return state.players.find((player) => player.id === state.localPlayerId) ?? null;
}

export function isHostPlayer(state: PlayWithFriendsState, playerId: string | null) {
  return Boolean(playerId && state.hostPlayerId === playerId);
}

export function getGameSeating(players: Player[], game: GameDefinition): GameSeating {
  const host = players.find((player) => player.role === 'host') ?? null;
  const seatedPlayers: Player[] = host ? [host] : [];
  const remainingSeatCount = Math.max(game.maxPlayers - seatedPlayers.length, 0);
  const readyNonHosts = players.filter(
    (player) => player.id !== host?.id && player.role !== 'host' && player.ready,
  );

  seatedPlayers.push(...readyNonHosts.slice(0, remainingSeatCount));

  const activePlayerIds = seatedPlayers.map((player) => player.id);
  const spectatorPlayers = players.filter(
    (player) => !activePlayerIds.includes(player.id),
  );

  return {
    activePlayerIds,
    spectatorPlayerIds: spectatorPlayers.map((player) => player.id),
    seatedPlayers,
    spectatorPlayers,
    missingSeatCount: Math.max(game.minPlayers - seatedPlayers.length, 0),
  };
}

export function getStartGate(
  state: PlayWithFriendsState,
  games: GameDefinition[] = PLAY_WITH_FRIENDS_GAMES,
): StartGate {
  const game = getGameById(state.selectedGameId, games) ?? null;

  if (!game) {
    return createStartGate(false, 'Select a supported game.', null, [], []);
  }

  const seating = getGameSeating(state.players, game);

  if (state.phase !== 'lobby') {
    return createStartGate(
      false,
      'Start is available from the lobby.',
      game,
      seating.activePlayerIds,
      seating.spectatorPlayerIds,
    );
  }

  if (!isHostPlayer(state, state.localPlayerId)) {
    return createStartGate(
      false,
      'Only the host can start the game.',
      game,
      seating.activePlayerIds,
      seating.spectatorPlayerIds,
    );
  }

  if (game.status !== 'playable') {
    return createStartGate(
      false,
      `${game.name} is planned and cannot be started yet.`,
      game,
      seating.activePlayerIds,
      seating.spectatorPlayerIds,
    );
  }

  if (seating.missingSeatCount > 0) {
    return createStartGate(
      false,
      `Need ${game.minPlayers} seated players, including a ready non-host for ${game.name}.`,
      game,
      seating.activePlayerIds,
      seating.spectatorPlayerIds,
    );
  }

  const unreadySeatedNonHosts = seating.seatedPlayers.filter(
    (player) => player.id !== state.hostPlayerId && !player.ready,
  );

  if (unreadySeatedNonHosts.length > 0) {
    return createStartGate(
      false,
      'Seated non-host players must be ready.',
      game,
      seating.activePlayerIds,
      seating.spectatorPlayerIds,
    );
  }

  return createStartGate(
    true,
    `Ready to start ${game.name}.`,
    game,
    seating.activePlayerIds,
    seating.spectatorPlayerIds,
  );
}

export function getPlayerPermissions(
  state: PlayWithFriendsState,
  playerId: string | null = state.localPlayerId,
): PlayerPermissions {
  const isKnownPlayer = state.players.some((player) => player.id === playerId);
  const isHost = isHostPlayer(state, playerId);
  const startGate = getStartGate({
    ...state,
    localPlayerId: playerId,
  });

  return {
    canCreateRoom: state.phase === 'entry',
    canJoinRoom: state.phase === 'entry' || state.phase === 'joining',
    canAddMockPlayer: isHost && state.phase === 'lobby',
    canSelectGame: isHost && state.phase === 'lobby',
    canStartGame: isHost && startGate.canStart,
    canReturnToLobby: isHost && state.phase === 'game',
    canLeaveLobby: isKnownPlayer && (state.phase === 'lobby' || state.phase === 'game'),
  };
}

export function canPlayerToggleReady(
  state: PlayWithFriendsState,
  actorPlayerId: string | null,
  targetPlayerId: string,
) {
  if (state.phase !== 'lobby') {
    return false;
  }

  const actor = state.players.find((player) => player.id === actorPlayerId);
  const target = state.players.find((player) => player.id === targetPlayerId);

  if (!actor || !target) {
    return false;
  }

  if (actor.id === target.id) {
    return true;
  }

  return actor.role === 'host' && target.connection === 'mock';
}

function createStartGate(
  canStart: boolean,
  reason: string,
  game: GameDefinition | null,
  activePlayerIds: string[],
  spectatorPlayerIds: string[],
): StartGate {
  return {
    canStart,
    reason,
    game,
    activePlayerIds,
    spectatorPlayerIds,
  };
}

function withError(state: PlayWithFriendsState, message: string): PlayWithFriendsState {
  return {
    ...state,
    lastError: message,
    eventLog: pushLog(state, message),
  };
}

function clearError(state: PlayWithFriendsState): PlayWithFriendsState {
  if (!state.lastError) {
    return state;
  }

  return {
    ...state,
    lastError: null,
  };
}

function createMockPlayer(state: PlayWithFriendsState, action: LobbyAction) {
  if (action.type !== 'add-mock-player') {
    return null;
  }

  const mockGuestNumber =
    state.players.filter(
      (player) => player.role === 'guest' && player.connection === 'mock',
    ).length + 1;

  return {
    id: action.playerId,
    name: sanitizeDisplayName(action.name ?? `Friend ${mockGuestNumber}`),
    role: 'guest',
    ready: action.ready ?? false,
    connection: 'mock',
  } satisfies Player;
}

export function lobbyReducer(
  state: PlayWithFriendsState,
  action: LobbyAction,
): PlayWithFriendsState {
  switch (action.type) {
    case 'set-player-name':
      return {
        ...clearError(state),
        playerName: capVisibleCharacters(action.name, MAX_DISPLAY_NAME_LENGTH),
      };

    case 'set-join-code':
      return {
        ...clearError(state),
        joinCode: sanitizeRoomCode(action.code),
      };

    case 'show-join':
      return {
        ...clearError(state),
        phase: 'joining',
        eventLog: pushLog(state, 'Join panel opened'),
      };

    case 'host-room': {
      const hostName = sanitizeDisplayName(state.playerName);
      const roomCode = sanitizeRoomCode(action.roomCode) || 'LOCAL1';
      const hostPlayer: Player = {
        id: action.hostPlayerId,
        name: hostName,
        role: 'host',
        ready: true,
        connection: 'local',
      };

      return {
        ...state,
        phase: 'lobby',
        roomCode,
        joinCode: '',
        activeGameId: null,
        activeGameSession: null,
        localPlayerId: hostPlayer.id,
        hostPlayerId: hostPlayer.id,
        players: [hostPlayer],
        eventLog: pushLog(state, `${hostName} created room ${roomCode}`),
        lastError: null,
      };
    }

    case 'join-preview': {
      const guestName = sanitizeDisplayName(state.playerName);
      const roomCode =
        sanitizeRoomCode(state.joinCode) ||
        sanitizeRoomCode(action.fallbackRoomCode) ||
        'LOCAL1';

      return {
        ...state,
        phase: 'lobby',
        roomCode,
        activeGameId: null,
        activeGameSession: null,
        localPlayerId: action.guestPlayerId,
        hostPlayerId: action.hostPlayerId,
        players: [
          {
            id: action.hostPlayerId,
            name: 'Remote host',
            role: 'host',
            ready: true,
            connection: 'mock',
          },
          {
            id: action.guestPlayerId,
            name: guestName,
            role: 'guest',
            ready: false,
            connection: 'local',
          },
        ],
        eventLog: pushLog(state, `${guestName} joined preview room ${roomCode}`),
        lastError: null,
      };
    }

    case 'add-mock-player': {
      const actorPlayerId = action.actorPlayerId ?? state.localPlayerId;

      if (!getPlayerPermissions(state, actorPlayerId).canAddMockPlayer) {
        return withError(state, 'Only the host can add local mock friends.');
      }

      const mockPlayer = createMockPlayer(state, action);

      if (!mockPlayer) {
        return state;
      }

      return {
        ...state,
        players: [...state.players, mockPlayer],
        eventLog: pushLog(state, `${mockPlayer.name} joined locally`),
        lastError: null,
      };
    }

    case 'toggle-ready': {
      const actorPlayerId = action.actorPlayerId ?? state.localPlayerId;

      if (!canPlayerToggleReady(state, actorPlayerId, action.playerId)) {
        return withError(state, 'You can only change ready state for yourself or host-controlled mock players.');
      }

      return {
        ...state,
        players: state.players.map((player) =>
          player.id === action.playerId
            ? {
                ...player,
                ready: !player.ready,
              }
            : player,
        ),
        lastError: null,
      };
    }

    case 'select-game': {
      const actorPlayerId = action.actorPlayerId ?? state.localPlayerId;
      const game = getGameById(action.gameId);

      if (!getPlayerPermissions(state, actorPlayerId).canSelectGame) {
        return withError(state, 'Only the host can select games.');
      }

      if (!game) {
        return withError(state, 'Select a supported game.');
      }

      return {
        ...state,
        selectedGameId: game.id,
        eventLog: pushLog(state, `Selected ${game.name}`),
        lastError: null,
      };
    }

    case 'start-game': {
      const actorPlayerId = action.actorPlayerId ?? state.localPlayerId;
      const gate = getStartGate({
        ...state,
        localPlayerId: actorPlayerId,
      });

      if (!gate.canStart || !gate.game) {
        return withError(state, gate.reason);
      }

      return {
        ...state,
        phase: 'game',
        activeGameId: gate.game.id,
        activeGameSession: {
          id: action.sessionId,
          gameId: gate.game.id,
          activePlayerIds: gate.activePlayerIds,
          spectatorPlayerIds: gate.spectatorPlayerIds,
          startedAt: action.startedAt,
          status: 'active',
        },
        eventLog: pushLog(state, `Started ${gate.game.name}`),
        lastError: null,
      };
    }

    case 'return-to-lobby': {
      const actorPlayerId = action.actorPlayerId ?? state.localPlayerId;

      if (!getPlayerPermissions(state, actorPlayerId).canReturnToLobby) {
        return withError(state, 'Only the host can return the room to lobby.');
      }

      return {
        ...state,
        phase: 'lobby',
        activeGameId: null,
        activeGameSession: null,
        eventLog: pushLog(state, 'Returned to lobby'),
        lastError: null,
      };
    }

    case 'leave': {
      const nextState = createInitialPlayWithFriendsState();

      return {
        ...nextState,
        playerName: state.playerName,
        eventLog: pushLog(nextState, 'Lobby closed'),
      };
    }

    default:
      return state;
  }
}
