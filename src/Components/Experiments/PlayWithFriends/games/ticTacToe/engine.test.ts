import { describe, expect, it } from 'vitest';

import {
  applyTicTacToeAction,
  createInitialTicTacToeState,
  getWinner,
  validateTicTacToeMove,
} from './engine';

describe('Tic Tac Toe engine', () => {
  it('creates a two-player initial state with X starting', () => {
    const state = createInitialTicTacToeState(['host', 'guest']);

    expect(state.players).toEqual([
      { playerId: 'host', mark: 'X' },
      { playerId: 'guest', mark: 'O' },
    ]);
    expect(state.turnPlayerId).toBe('host');
    expect(state.board.every((cell) => cell === null)).toBe(true);
  });

  it('rejects out-of-turn moves and occupied cells', () => {
    let state = createInitialTicTacToeState(['host', 'guest']);

    expect(
      validateTicTacToeMove(state, {
        type: 'place-mark',
        playerId: 'guest',
        cellIndex: 0,
      }),
    ).toMatchObject({ valid: false });

    const firstMove = applyTicTacToeAction(state, {
      type: 'place-mark',
      playerId: 'host',
      cellIndex: 0,
    });
    expect(firstMove.accepted).toBe(true);

    if (firstMove.accepted) {
      state = firstMove.state;
    }

    expect(
      validateTicTacToeMove(state, {
        type: 'place-mark',
        playerId: 'guest',
        cellIndex: 0,
      }),
    ).toMatchObject({ valid: false, reason: expect.stringMatching(/taken/i) });
  });

  it('detects wins', () => {
    const winner = getWinner(['X', 'X', 'X', null, 'O', null, null, null, 'O']);

    expect(winner).toEqual({ mark: 'X', line: [0, 1, 2] });
  });

  it('applies moves through a win state', () => {
    let state = createInitialTicTacToeState(['host', 'guest']);

    for (const action of [
      { type: 'place-mark' as const, playerId: 'host', cellIndex: 0 },
      { type: 'place-mark' as const, playerId: 'guest', cellIndex: 3 },
      { type: 'place-mark' as const, playerId: 'host', cellIndex: 1 },
      { type: 'place-mark' as const, playerId: 'guest', cellIndex: 4 },
      { type: 'place-mark' as const, playerId: 'host', cellIndex: 2 },
    ]) {
      const result = applyTicTacToeAction(state, action);
      expect(result.accepted).toBe(true);

      if (result.accepted) {
        state = result.state;
      }
    }

    expect(state.result).toEqual({
      status: 'won',
      winnerPlayerId: 'host',
      winningLine: [0, 1, 2],
    });
  });

  it('detects draw states and can reset', () => {
    let state = createInitialTicTacToeState(['host', 'guest']);

    for (const action of [
      { type: 'place-mark' as const, playerId: 'host', cellIndex: 0 },
      { type: 'place-mark' as const, playerId: 'guest', cellIndex: 1 },
      { type: 'place-mark' as const, playerId: 'host', cellIndex: 2 },
      { type: 'place-mark' as const, playerId: 'guest', cellIndex: 4 },
      { type: 'place-mark' as const, playerId: 'host', cellIndex: 3 },
      { type: 'place-mark' as const, playerId: 'guest', cellIndex: 5 },
      { type: 'place-mark' as const, playerId: 'host', cellIndex: 7 },
      { type: 'place-mark' as const, playerId: 'guest', cellIndex: 6 },
      { type: 'place-mark' as const, playerId: 'host', cellIndex: 8 },
    ]) {
      const result = applyTicTacToeAction(state, action);

      if (result.accepted) {
        state = result.state;
      }
    }

    expect(state.result).toEqual({ status: 'draw' });

    const reset = applyTicTacToeAction(state, {
      type: 'reset',
      activePlayerIds: ['host', 'guest'],
    });

    expect(reset.accepted).toBe(true);
    expect(reset.accepted ? reset.state.result : null).toEqual({ status: 'playing' });
  });
});
