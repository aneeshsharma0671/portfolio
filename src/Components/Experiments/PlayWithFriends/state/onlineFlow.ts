import type { NakamaPresenceSummary } from '../network/nakamaLobby';
import { createOnlinePlayerFromPresence } from '../runtime';
import { PLAY_WITH_FRIENDS_GAMES, getGameById } from './games';
import type {
  GameSession,
  Player,
  PlayWithFriendsGameId,
  StartGate,
} from './types';

export type PlayWithFriendsRouteTarget = 'entry' | 'lobby' | 'games' | 'game';

export type OnlineStartGateInput = {
  localUserId: string | null;
  hostUserId: string | null;
  selectedGameId: PlayWithFriendsGameId;
  activePlayerIds: string[];
  spectatorPlayerIds: string[];
};

export type CreateOnlineGameSessionInput = {
  sessionId: string;
  gameId: PlayWithFriendsGameId;
  activePlayerIds: string[];
  spectatorPlayerIds: string[];
  startedAt: number;
};

export type OnlineLobbySnapshotPayload = {
  hostUserId: string;
  selectedGameId: PlayWithFriendsGameId;
  activeGameId: PlayWithFriendsGameId | null;
  activePlayerIds: string[];
  spectatorPlayerIds: string[];
  readyPlayerIds: string[];
  countdownStartedAt: number | null;
};

export type OnlineGameStartPayload = {
  sessionId: string;
  gameId: PlayWithFriendsGameId;
  hostUserId: string;
  activePlayerIds: string[];
  spectatorPlayerIds: string[];
  state: unknown;
};

export type OnlineGameReturnPayload = {
  selectedGameId: PlayWithFriendsGameId;
};

const PLAY_WITH_FRIENDS_BASE_PATH = '/experiments/playwithfriends';

export function getPlayWithFriendsPath(
  target: PlayWithFriendsRouteTarget,
  gameId?: PlayWithFriendsGameId,
) {
  if (target === 'entry') {
    return PLAY_WITH_FRIENDS_BASE_PATH;
  }

  if (target === 'lobby') {
    return `${PLAY_WITH_FRIENDS_BASE_PATH}/lobby`;
  }

  if (target === 'games') {
    return `${PLAY_WITH_FRIENDS_BASE_PATH}/games`;
  }

  return `${PLAY_WITH_FRIENDS_BASE_PATH}/games/${gameId ?? 'tic-tac-toe'}`;
}

export function createOnlinePlayersFromPresences(
  presences: NakamaPresenceSummary[],
  hostUserId: string | null,
  localUserId: string | null,
): Player[] {
  return presences.map((presence) =>
    createOnlinePlayerFromPresence(presence, {
      hostUserId,
      localUserId,
    }).toSnapshot(),
  );
}

export function getOnlineStartGate({
  localUserId,
  hostUserId,
  selectedGameId,
  activePlayerIds,
  spectatorPlayerIds,
}: OnlineStartGateInput): StartGate {
  const game = getGameById(selectedGameId) ?? null;

  if (!game) {
    return createStartGate(false, 'Select a supported game.', null, [], []);
  }

  if (!hostUserId || localUserId !== hostUserId) {
    return createStartGate(
      false,
      'Only the host can start the game.',
      game,
      activePlayerIds,
      spectatorPlayerIds,
    );
  }

  if (game.status !== 'playable') {
    return createStartGate(
      false,
      `${game.name} is planned and cannot be started yet.`,
      game,
      activePlayerIds,
      spectatorPlayerIds,
    );
  }

  if (activePlayerIds.length < game.minPlayers) {
    return createStartGate(
      false,
      `Need ${game.minPlayers} connected players for ${game.name}.`,
      game,
      activePlayerIds,
      spectatorPlayerIds,
    );
  }

  return createStartGate(
    true,
    `Ready to start ${game.name}.`,
    game,
    activePlayerIds.slice(0, game.maxPlayers),
    spectatorPlayerIds,
  );
}

export function createOnlineGameSession({
  sessionId,
  gameId,
  activePlayerIds,
  spectatorPlayerIds,
  startedAt,
}: CreateOnlineGameSessionInput): GameSession {
  return {
    id: sessionId,
    gameId,
    activePlayerIds,
    spectatorPlayerIds,
    startedAt,
    status: 'active',
  };
}

export function parseOnlineLobbySnapshotPayload(
  payload: unknown,
): OnlineLobbySnapshotPayload | null {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  const candidate = payload as Partial<OnlineLobbySnapshotPayload>;
  const selectedGameId = parsePlayWithFriendsGameId(candidate.selectedGameId);
  const activeGameId =
    candidate.activeGameId === null || candidate.activeGameId === undefined
      ? null
      : parsePlayWithFriendsGameId(candidate.activeGameId);

  if (
    typeof candidate.hostUserId !== 'string' ||
    !candidate.hostUserId.trim() ||
    !selectedGameId ||
    (candidate.activeGameId && !activeGameId)
  ) {
    return null;
  }

  return {
    hostUserId: candidate.hostUserId,
    selectedGameId,
    activeGameId,
    activePlayerIds: parseStringList(candidate.activePlayerIds),
    spectatorPlayerIds: parseStringList(candidate.spectatorPlayerIds),
    readyPlayerIds: parseStringList(candidate.readyPlayerIds),
    countdownStartedAt:
      typeof candidate.countdownStartedAt === 'number' &&
      Number.isFinite(candidate.countdownStartedAt)
        ? candidate.countdownStartedAt
        : null,
  };
}

export function parseOnlineGameStartPayload(
  payload: unknown,
): OnlineGameStartPayload | null {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  const candidate = payload as Partial<OnlineGameStartPayload>;
  const gameId = parsePlayWithFriendsGameId(candidate.gameId);
  const game = gameId ? getGameById(gameId) : null;
  const activePlayerIds = parseStringList(candidate.activePlayerIds);

  if (
    typeof candidate.sessionId !== 'string' ||
    !candidate.sessionId.trim() ||
    typeof candidate.hostUserId !== 'string' ||
    !candidate.hostUserId.trim() ||
    !game ||
    game.status !== 'playable' ||
    activePlayerIds.length < game.minPlayers
  ) {
    return null;
  }

  return {
    sessionId: candidate.sessionId,
    gameId: game.id,
    hostUserId: candidate.hostUserId,
    activePlayerIds,
    spectatorPlayerIds: parseStringList(candidate.spectatorPlayerIds),
    state: candidate.state,
  };
}

export function parseOnlineGameReturnPayload(
  payload: unknown,
): OnlineGameReturnPayload | null {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  const candidate = payload as Partial<OnlineGameReturnPayload>;
  const selectedGameId = parsePlayWithFriendsGameId(candidate.selectedGameId);

  return selectedGameId ? { selectedGameId } : null;
}

function createStartGate(
  canStart: boolean,
  reason: string,
  game: StartGate['game'],
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

export function parsePlayWithFriendsGameId(value: unknown): PlayWithFriendsGameId | null {
  if (typeof value !== 'string') {
    return null;
  }

  return PLAY_WITH_FRIENDS_GAMES.some((game) => game.id === value)
    ? (value as PlayWithFriendsGameId)
    : null;
}

function parseStringList(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === 'string' && Boolean(item));
}
