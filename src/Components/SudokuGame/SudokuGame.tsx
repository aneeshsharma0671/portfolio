"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Board,
  Difficulty,
  generatePuzzle,
  getConflicts,
  isBoardComplete,
  isBoardCorrect,
} from "./sudokuLogic";
import styles from "./SudokuGame.module.css";

type GameState = "playing" | "won";
type Theme = "light" | "dark";

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export default function SudokuGame() {
  const [theme, setTheme] = useState<Theme>("light");
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [puzzle, setPuzzle] = useState<Board | null>(null);
  const [solution, setSolution] = useState<Board | null>(null);
  const [userBoard, setUserBoard] = useState<Board | null>(null);
  const [selectedCell, setSelectedCell] = useState<[number, number] | null>(
    null,
  );
  const [gameState, setGameState] = useState<GameState>("playing");
  const [seconds, setSeconds] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const winSeconds = useRef(0);

  const containerClass = `${styles.container}${theme === "dark" ? ` ${styles.dark}` : ""}`;

  const startNewGame = useCallback((diff: Difficulty) => {
    setIsLoading(true);
    setGameState("playing");
    setSelectedCell(null);
    setSeconds(0);

    setTimeout(() => {
      const { puzzle: p, solution: s } = generatePuzzle(diff);
      setPuzzle(p);
      setSolution(s);
      setUserBoard(p.map((row) => [...row]));
      setIsLoading(false);
    }, 50);
  }, []);

  useEffect(() => {
    startNewGame(difficulty);
  }, []);

  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (gameState === "playing" && !isLoading && puzzle) {
      timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameState, isLoading, puzzle]);

  const handleCellSelect = useCallback((row: number, col: number) => {
    setSelectedCell([row, col]);
  }, []);

  const handleInput = useCallback(
    (num: number | null) => {
      if (!selectedCell || !userBoard || !puzzle || !solution) return;
      const [row, col] = selectedCell;
      if (puzzle[row][col] !== null) return;

      const newBoard = userBoard.map((r) => [...r]);
      newBoard[row][col] = num;
      setUserBoard(newBoard);

      if (isBoardComplete(newBoard) && isBoardCorrect(newBoard, solution)) {
        winSeconds.current = seconds;
        setGameState("won");
      }
    },
    [selectedCell, userBoard, puzzle, solution, seconds],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!selectedCell || !puzzle) return;
      const [row, col] = selectedCell;

      if (e.key >= "1" && e.key <= "9") {
        handleInput(parseInt(e.key));
      } else if (e.key === "Backspace" || e.key === "Delete" || e.key === "0") {
        handleInput(null);
      } else if (e.key === "ArrowUp" && row > 0) {
        setSelectedCell([row - 1, col]);
      } else if (e.key === "ArrowDown" && row < 8) {
        setSelectedCell([row + 1, col]);
      } else if (e.key === "ArrowLeft" && col > 0) {
        setSelectedCell([row, col - 1]);
      } else if (e.key === "ArrowRight" && col < 8) {
        setSelectedCell([row, col + 1]);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedCell, puzzle, handleInput]);

  const conflicts = userBoard ? getConflicts(userBoard) : new Set<string>();
  const selectedValue =
    selectedCell && userBoard
      ? userBoard[selectedCell[0]][selectedCell[1]]
      : null;

  if (isLoading || !userBoard || !puzzle) {
    return (
      <div className={containerClass}>
        <header className={styles.header}>
          <h1 className={styles.title}>Sudoku</h1>
          <p className={styles.subtitle}>classified puzzle archive</p>
        </header>
        <div className={styles.loading}>
          <div className={styles.spinner} />
          generating puzzle
        </div>
      </div>
    );
  }

  return (
    <div className={containerClass}>
      <header className={styles.header}>
        <h1 className={styles.title}>Sudoku</h1>
        {/* <p className={styles.subtitle}>classified puzzle archive</p> */}
      </header>

      <div className={styles.controls}>
        <div className={styles.difficultyGroup}>
          {(["easy", "medium", "hard"] as Difficulty[]).map((d) => (
            <button
              key={d}
              className={`${styles.diffBtn} ${difficulty === d ? styles.diffBtnActive : ""}`}
              onClick={() => {
                setDifficulty(d);
                startNewGame(d);
              }}
            >
              {d}
            </button>
          ))}
        </div>
        <button
          className={styles.newGameBtn}
          onClick={() => startNewGame(difficulty)}
        >
          new game
        </button>
        <button
          className={styles.themeBtn}
          onClick={() => setTheme((t) => (t === "light" ? "dark" : "light"))}
          aria-label="Toggle theme"
        >
          {theme === "light" ? "◑ dark" : "◐ light"}
        </button>
      </div>

      <div className={styles.timerRow}>
        <span className={styles.timer}>{formatTime(seconds)}</span>
      </div>

      <div className={styles.boardWrapper}>
        <div className={styles.board} role="grid" aria-label="Sudoku board">
          {userBoard.map((row, r) => (
            <div key={r} className={styles.row} role="row">
              {row.map((cell, c) => {
                const isGiven = puzzle[r][c] !== null;
                const isSelected =
                  selectedCell?.[0] === r && selectedCell?.[1] === c;
                const isConflict = conflicts.has(`${r}-${c}`);
                const isSameValue =
                  !isSelected &&
                  selectedValue !== null &&
                  cell === selectedValue;
                const isHighlighted =
                  !isSelected &&
                  selectedCell !== null &&
                  (selectedCell[0] === r ||
                    selectedCell[1] === c ||
                    (Math.floor(r / 3) === Math.floor(selectedCell[0] / 3) &&
                      Math.floor(c / 3) === Math.floor(selectedCell[1] / 3)));

                let cellClass = styles.cell;
                if (isGiven) cellClass += ` ${styles.cellGiven}`;
                else cellClass += ` ${styles.cellUserInput}`;
                if (isSelected) cellClass += ` ${styles.cellSelected}`;
                else if (isSameValue) cellClass += ` ${styles.cellSameValue}`;
                else if (isHighlighted)
                  cellClass += ` ${styles.cellHighlighted}`;
                if (isConflict) cellClass += ` ${styles.cellConflict}`;

                return (
                  <div
                    key={c}
                    className={cellClass}
                    data-row={r}
                    data-col={c}
                    role="gridcell"
                    tabIndex={0}
                    aria-label={`Row ${r + 1} Column ${c + 1}${cell ? ` value ${cell}` : " empty"}`}
                    onClick={() => handleCellSelect(r, c)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ")
                        handleCellSelect(r, c);
                    }}
                  >
                    {cell ?? ""}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {gameState === "won" && (
          <div className={styles.winOverlay}>
            <p className={styles.winTitle}>Solved</p>
            <p className={styles.winTime}>{formatTime(winSeconds.current)}</p>
            <button
              className={styles.winPlayAgain}
              onClick={() => startNewGame(difficulty)}
            >
              play again
            </button>
          </div>
        )}
      </div>

      <div className={styles.numpad} aria-label="Number input pad">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
          <button
            key={n}
            className={styles.numKey}
            onClick={() => handleInput(n)}
            aria-label={`Input ${n}`}
          >
            {n}
          </button>
        ))}
        <button
          className={`${styles.numKey} ${styles.eraseKey}`}
          style={{ gridColumn: "span 9" }}
          onClick={() => handleInput(null)}
          aria-label="Erase"
        >
          erase
        </button>
      </div>
    </div>
  );
}
