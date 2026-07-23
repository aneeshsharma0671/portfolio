import type { GameActionResult, GameContext, GameModule, GameResult } from '../../bridge';
import { getGameById } from '../../state';

export type TicTacToeMark = 'X' | 'O';

export type TicTacToeCell = TicTacToeMark | null;

export type TicTacToePlayer = {
  playerId: string;
  mark: TicTacToeMark;
};

export type TicTacToeState = {
  board: TicTacToeCell[];
  players: TicTacToePlayer[];
  turnPlayerId: string;
  result: GameResult;
  moveCount: number;
};

export type TicTacToeAction =
  | { type: 'place-mark'; playerId: string; cellIndex: number }
  | { type: 'reset'; activePlayerIds: string[] };

export const TIC_TAC_TOE_LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
] as const;

const EMPTY_BOARD: TicTacToeCell[] = Array.from({ length: 9 }, () => null);

export function createInitialTicTacToeState(activePlayerIds: string[]): TicTacToeState {
  const [firstPlayerId = '', secondPlayerId = ''] = activePlayerIds;
  const players = [
    { playerId: firstPlayerId, mark: 'X' },
    { playerId: secondPlayerId, mark: 'O' },
  ] satisfies TicTacToePlayer[];

  return {
    board: [...EMPTY_BOARD],
    players,
    turnPlayerId: firstPlayerId,
    result: { status: 'playing' },
    moveCount: 0,
  };
}

export function getPlayerMark(state: TicTacToeState, playerId: string) {
  return state.players.find((player) => player.playerId === playerId)?.mark ?? null;
}

export function getWinner(board: TicTacToeCell[]) {
  for (const line of TIC_TAC_TOE_LINES) {
    const [first, second, third] = line;
    const mark = board[first];

    if (mark && mark === board[second] && mark === board[third]) {
      return {
        mark,
        line: [...line],
      };
    }
  }

  return null;
}

export function validateTicTacToeMove(
  state: TicTacToeState,
  action: TicTacToeAction,
) {
  if (action.type === 'reset') {
    return { valid: action.activePlayerIds.length >= 2, reason: 'Need two seated players.' };
  }

  if (state.result.status !== 'playing') {
    return { valid: false, reason: 'This game is already complete.' };
  }

  if (!Number.isInteger(action.cellIndex) || action.cellIndex < 0 || action.cellIndex > 8) {
    return { valid: false, reason: 'Choose a board cell.' };
  }

  if (action.playerId !== state.turnPlayerId) {
    return { valid: false, reason: 'It is not this player turn.' };
  }

  if (!getPlayerMark(state, action.playerId)) {
    return { valid: false, reason: 'Only seated players can move.' };
  }

  if (state.board[action.cellIndex]) {
    return { valid: false, reason: 'That cell is already taken.' };
  }

  return { valid: true, reason: 'Move accepted.' };
}

export function applyTicTacToeAction(
  state: TicTacToeState,
  action: TicTacToeAction,
): GameActionResult<TicTacToeState> {
  if (action.type === 'reset') {
    if (action.activePlayerIds.length < 2) {
      return { accepted: false, state, reason: 'Need two seated players.' };
    }

    return {
      accepted: true,
      state: createInitialTicTacToeState(action.activePlayerIds),
      message: 'Board reset.',
    };
  }

  const validation = validateTicTacToeMove(state, action);

  if (!validation.valid) {
    return { accepted: false, state, reason: validation.reason };
  }

  const mark = getPlayerMark(state, action.playerId);

  if (!mark) {
    return { accepted: false, state, reason: 'Only seated players can move.' };
  }

  const board = [...state.board];
  board[action.cellIndex] = mark;

  const winner = getWinner(board);
  const moveCount = state.moveCount + 1;
  const result: GameResult = winner
    ? {
        status: 'won',
        winnerPlayerId:
          state.players.find((player) => player.mark === winner.mark)?.playerId ?? action.playerId,
        winningLine: winner.line,
      }
    : moveCount >= board.length
      ? { status: 'draw' }
      : { status: 'playing' };

  const nextPlayer =
    state.players.find((player) => player.playerId !== action.playerId)?.playerId ??
    action.playerId;

  return {
    accepted: true,
    state: {
      ...state,
      board,
      moveCount,
      result,
      turnPlayerId: result.status === 'playing' ? nextPlayer : action.playerId,
    },
    message: winner ? 'Winning move.' : result.status === 'draw' ? 'Game ended in a draw.' : 'Move accepted.',
  };
}

const ticTacToeMetadata = getGameById('tic-tac-toe');

if (!ticTacToeMetadata) {
  throw new Error('Tic Tac Toe metadata is missing.');
}

export const ticTacToeModule: GameModule<TicTacToeState, TicTacToeAction> = {
  metadata: ticTacToeMetadata,
  createInitialState: (context: GameContext) =>
    createInitialTicTacToeState(context.session.activePlayerIds),
  reduceAction: (state, action) => applyTicTacToeAction(state, action),
  getResult: (state) => state.result,
};
