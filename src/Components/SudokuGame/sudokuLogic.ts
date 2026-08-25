export type CellValue = number | null;
export type Board = CellValue[][];
export type Difficulty = 'easy' | 'medium' | 'hard';

const CLUES_BY_DIFFICULTY: Record<Difficulty, number> = {
  easy: 36,
  medium: 28,
  hard: 22,
};

function shuffleArray<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function isValid(board: Board, row: number, col: number, num: number): boolean {
  for (let i = 0; i < 9; i++) {
    if (board[row][i] === num) return false;
    if (board[i][col] === num) return false;
  }
  const boxRow = Math.floor(row / 3) * 3;
  const boxCol = Math.floor(col / 3) * 3;
  for (let r = boxRow; r < boxRow + 3; r++) {
    for (let c = boxCol; c < boxCol + 3; c++) {
      if (board[r][c] === num) return false;
    }
  }
  return true;
}

function fillBoard(board: Board): boolean {
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (board[row][col] === null) {
        const nums = shuffleArray([1, 2, 3, 4, 5, 6, 7, 8, 9]);
        for (const num of nums) {
          if (isValid(board, row, col, num)) {
            board[row][col] = num;
            if (fillBoard(board)) return true;
            board[row][col] = null;
          }
        }
        return false;
      }
    }
  }
  return true;
}

function countSolutions(board: Board, limit: number): number {
  let count = 0;
  const clone = board.map((row) => [...row]);

  function solve(): boolean {
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (clone[row][col] === null) {
          for (let num = 1; num <= 9; num++) {
            if (isValid(clone, row, col, num)) {
              clone[row][col] = num;
              if (solve()) {
                count++;
                if (count >= limit) return true;
              }
              clone[row][col] = null;
            }
          }
          return false;
        }
      }
    }
    return true;
  }

  solve();
  return count;
}

export function generatePuzzle(difficulty: Difficulty): { puzzle: Board; solution: Board } {
  const solution: Board = Array.from({ length: 9 }, () => Array(9).fill(null));
  fillBoard(solution);

  const puzzle: Board = solution.map((row) => [...row]);
  const clues = CLUES_BY_DIFFICULTY[difficulty];
  const cellsToRemove = 81 - clues;

  const cells = shuffleArray(
    Array.from({ length: 81 }, (_, i) => ({ row: Math.floor(i / 9), col: i % 9 }))
  );

  let removed = 0;
  for (const { row, col } of cells) {
    if (removed >= cellsToRemove) break;
    const backup = puzzle[row][col];
    puzzle[row][col] = null;
    if (countSolutions(puzzle, 2) === 1) {
      removed++;
    } else {
      puzzle[row][col] = backup;
    }
  }

  return { puzzle, solution };
}

export function isBoardComplete(board: Board): boolean {
  return board.every((row) => row.every((cell) => cell !== null));
}

export function isBoardCorrect(board: Board, solution: Board): boolean {
  return board.every((row, r) =>
    row.every((cell, c) => cell === solution[r][c])
  );
}

export function getConflicts(board: Board): Set<string> {
  const conflicts = new Set<string>();

  for (let row = 0; row < 9; row++) {
    const seen = new Map<number, number>();
    for (let col = 0; col < 9; col++) {
      const val = board[row][col];
      if (val === null) continue;
      if (seen.has(val)) {
        conflicts.add(`${row}-${seen.get(val)}`);
        conflicts.add(`${row}-${col}`);
      } else {
        seen.set(val, col);
      }
    }
  }

  for (let col = 0; col < 9; col++) {
    const seen = new Map<number, number>();
    for (let row = 0; row < 9; row++) {
      const val = board[row][col];
      if (val === null) continue;
      if (seen.has(val)) {
        conflicts.add(`${seen.get(val)}-${col}`);
        conflicts.add(`${row}-${col}`);
      } else {
        seen.set(val, row);
      }
    }
  }

  for (let boxRow = 0; boxRow < 3; boxRow++) {
    for (let boxCol = 0; boxCol < 3; boxCol++) {
      const seen = new Map<number, string>();
      for (let r = boxRow * 3; r < boxRow * 3 + 3; r++) {
        for (let c = boxCol * 3; c < boxCol * 3 + 3; c++) {
          const val = board[r][c];
          if (val === null) continue;
          if (seen.has(val)) {
            conflicts.add(seen.get(val)!);
            conflicts.add(`${r}-${c}`);
          } else {
            seen.set(val, `${r}-${c}`);
          }
        }
      }
    }
  }

  return conflicts;
}
