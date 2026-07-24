import type {
  GameDefinition,
  GameSession,
  Player,
  PlayWithFriendsGameId,
} from '../state';

export type GameResult =
  | { status: 'playing' }
  | { status: 'won'; winnerPlayerId: string; winningLine: number[] }
  | { status: 'draw' }
  | { status: 'cancelled' };

export type GameContext = {
  players: Player[];
  session: GameSession;
  localPlayerId: string | null;
  hostPlayerId: string | null;
};

export type GameActionResult<TState> =
  | { accepted: true; state: TState; message: string }
  | { accepted: false; state: TState; reason: string };

export type GameModule<TState, TAction> = {
  metadata: GameDefinition;
  createInitialState: (context: GameContext) => TState;
  reduceAction: (state: TState, action: TAction, context: GameContext) => GameActionResult<TState>;
  getResult: (state: TState) => GameResult;
};

export type RegisteredGameModule = GameModule<unknown, unknown>;

export type GameRegistry = Partial<Record<PlayWithFriendsGameId, RegisteredGameModule>>;
