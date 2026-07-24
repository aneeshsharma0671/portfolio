export type PlayWithFriendsPhase = 'entry' | 'joining' | 'lobby' | 'game';

export type PlayerRole = 'host' | 'guest';

export type PlayerConnection = 'local' | 'mock' | 'offline';

export type Player = {
  id: string;
  name: string;
  role: PlayerRole;
  ready: boolean;
  connection: PlayerConnection;
};

export type PlayWithFriendsGameId = 'tic-tac-toe' | 'connect-four' | 'card-table';

export type GameStatus = 'playable' | 'planned';

export type GameDefinition = {
  id: PlayWithFriendsGameId;
  name: string;
  minPlayers: number;
  maxPlayers: number;
  status: GameStatus;
  description: string;
};

export type GameSessionStatus = 'active' | 'complete' | 'cancelled';

export type GameSession = {
  id: string;
  gameId: PlayWithFriendsGameId;
  activePlayerIds: string[];
  spectatorPlayerIds: string[];
  startedAt: number;
  status: GameSessionStatus;
};

export type GameSeating = {
  activePlayerIds: string[];
  spectatorPlayerIds: string[];
  seatedPlayers: Player[];
  spectatorPlayers: Player[];
  missingSeatCount: number;
};

export type StartGate = {
  canStart: boolean;
  reason: string;
  game: GameDefinition | null;
  activePlayerIds: string[];
  spectatorPlayerIds: string[];
};

export type PlayerPermissions = {
  canCreateRoom: boolean;
  canJoinRoom: boolean;
  canAddMockPlayer: boolean;
  canSelectGame: boolean;
  canStartGame: boolean;
  canReturnToLobby: boolean;
  canLeaveLobby: boolean;
};

export type PlayWithFriendsState = {
  phase: PlayWithFriendsPhase;
  roomCode: string;
  playerName: string;
  joinCode: string;
  selectedGameId: PlayWithFriendsGameId;
  activeGameId: PlayWithFriendsGameId | null;
  activeGameSession: GameSession | null;
  localPlayerId: string | null;
  hostPlayerId: string | null;
  players: Player[];
  eventLog: string[];
  connectionMode: 'local-mock';
  lastError: string | null;
};

export type LobbyAction =
  | { type: 'set-player-name'; name: string }
  | { type: 'set-join-code'; code: string }
  | { type: 'show-join' }
  | { type: 'host-room'; hostPlayerId: string; roomCode: string }
  | {
      type: 'join-preview';
      fallbackRoomCode: string;
      guestPlayerId: string;
      hostPlayerId: string;
    }
  | {
      type: 'add-mock-player';
      playerId: string;
      actorPlayerId?: string;
      name?: string;
      ready?: boolean;
    }
  | { type: 'toggle-ready'; playerId: string; actorPlayerId?: string }
  | {
      type: 'select-game';
      gameId: PlayWithFriendsGameId;
      actorPlayerId?: string;
    }
  | {
      type: 'start-game';
      sessionId: string;
      startedAt: number;
      actorPlayerId?: string;
    }
  | { type: 'return-to-lobby'; actorPlayerId?: string }
  | { type: 'leave' };
