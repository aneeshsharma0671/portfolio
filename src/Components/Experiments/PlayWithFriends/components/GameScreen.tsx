'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { FaRedo, FaSignOutAlt, FaUndo } from 'react-icons/fa';

import {
  applyTicTacToeAction,
  createInitialTicTacToeState,
  getPlayerMark,
  type TicTacToeState,
} from '../games/ticTacToe';
import type { GameDefinition, GameSession, Player } from '../state';
import styles from './GameScreen.module.css';

type GameScreenProps = {
  game: GameDefinition;
  session: GameSession;
  players: Player[];
  localPlayerId: string | null;
  hostPlayerId: string | null;
  roomCode: string;
  canReturnToLobby: boolean;
  onReturnToLobby: () => void;
  onLeaveLobby: () => void;
  onAnnounce: (message: string) => void;
};

function getPlayerName(players: Player[], playerId: string | null) {
  if (!playerId) {
    return 'Player';
  }

  return players.find((player) => player.id === playerId)?.name ?? 'Player';
}

function describeResult(state: TicTacToeState, players: Player[]) {
  if (state.result.status === 'won') {
    return `${getPlayerName(players, state.result.winnerPlayerId)} wins.`;
  }

  if (state.result.status === 'draw') {
    return 'Game ended in a draw.';
  }

  return `${getPlayerName(players, state.turnPlayerId)} to move.`;
}

export default function GameScreen({
  game,
  session,
  players,
  localPlayerId,
  hostPlayerId,
  roomCode,
  canReturnToLobby,
  onReturnToLobby,
  onLeaveLobby,
  onAnnounce,
}: GameScreenProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [ticTacToeState, setTicTacToeState] = useState(() =>
    createInitialTicTacToeState(session.activePlayerIds),
  );

  useEffect(() => {
    setTicTacToeState(createInitialTicTacToeState(session.activePlayerIds));
    headingRef.current?.focus();
  }, [session.id, session.activePlayerIds]);

  const seatedPlayers = useMemo(
    () =>
      session.activePlayerIds
        .map((playerId) => players.find((player) => player.id === playerId))
        .filter((player): player is Player => Boolean(player)),
    [players, session.activePlayerIds],
  );
  const spectatorPlayers = useMemo(
    () =>
      session.spectatorPlayerIds
        .map((playerId) => players.find((player) => player.id === playerId))
        .filter((player): player is Player => Boolean(player)),
    [players, session.spectatorPlayerIds],
  );
  const statusText = describeResult(ticTacToeState, players);
  const localPlayerIsHost = Boolean(localPlayerId && localPlayerId === hostPlayerId);
  const simulatedPlayerId = ticTacToeState.turnPlayerId;
  const simulatedMark = getPlayerMark(ticTacToeState, simulatedPlayerId);

  function handleCellClick(cellIndex: number) {
    const result = applyTicTacToeAction(ticTacToeState, {
      type: 'place-mark',
      playerId: simulatedPlayerId,
      cellIndex,
    });

    if (!result.accepted) {
      onAnnounce(result.reason);
      return;
    }

    setTicTacToeState(result.state);
    onAnnounce(result.message);
  }

  function handleReset() {
    const result = applyTicTacToeAction(ticTacToeState, {
      type: 'reset',
      activePlayerIds: session.activePlayerIds,
    });

    if (!result.accepted) {
      onAnnounce(result.reason);
      return;
    }

    setTicTacToeState(result.state);
    onAnnounce(result.message);
  }

  return (
    <div className={styles.gameLayout}>
      <section className={styles.gameBoardPanel} aria-labelledby="active-game-title">
        <div className={styles.gameHeader}>
          <div>
            <p className={styles.kicker}>Room {roomCode}</p>
            <h2 id="active-game-title" ref={headingRef} tabIndex={-1}>
              {game.name}
            </h2>
          </div>
          <div className={styles.actions}>
            <button
              className={styles.secondaryButton}
              type="button"
              disabled={!canReturnToLobby}
              onClick={onReturnToLobby}
            >
              <FaUndo aria-hidden="true" />
              Lobby
            </button>
            <button className={styles.dangerButton} type="button" onClick={onLeaveLobby}>
              <FaSignOutAlt aria-hidden="true" />
              Leave
            </button>
          </div>
        </div>

        <p className={styles.status} aria-live="polite">
          {statusText}
        </p>
        <p className={styles.simulationNote}>
          Local mock is simulating {getPlayerName(players, simulatedPlayerId)}
          {simulatedMark ? ` (${simulatedMark})` : ''}.
        </p>

        <div className={styles.board} aria-label="Tic Tac Toe board">
          {ticTacToeState.board.map((cell, cellIndex) => {
            const isWinningCell =
              ticTacToeState.result.status === 'won' &&
              ticTacToeState.result.winningLine.includes(cellIndex);

            return (
              <button
                key={cellIndex}
                className={`${styles.cell} ${isWinningCell ? styles.cellWin : ''}`}
                type="button"
                disabled={Boolean(cell) || ticTacToeState.result.status !== 'playing'}
                aria-label={`Cell ${cellIndex + 1}${cell ? `, ${cell}` : ', empty'}`}
                onClick={() => handleCellClick(cellIndex)}
              >
                {cell}
              </button>
            );
          })}
        </div>

        {localPlayerIsHost || ticTacToeState.result.status !== 'playing' ? (
          <button className={styles.primaryButton} type="button" onClick={handleReset}>
            <FaRedo aria-hidden="true" />
            Rematch
          </button>
        ) : null}
      </section>

      <aside className={styles.sidePanel} aria-labelledby="game-players-title">
        <div>
          <p className={styles.kicker}>Seated</p>
          <h3 id="game-players-title">Players</h3>
        </div>
        <div className={styles.playerRail}>
          {seatedPlayers.map((player) => (
            <div key={player.id} className={styles.playerRow}>
              <span className={styles.avatar}>{player.name.slice(0, 1).toUpperCase()}</span>
              <span>
                <strong>{player.name}</strong>
                <small>
                  {player.role} - {getPlayerMark(ticTacToeState, player.id)}
                </small>
              </span>
            </div>
          ))}
        </div>

        <div>
          <p className={styles.kicker}>Spectators</p>
          {spectatorPlayers.length ? (
            <div className={styles.playerRail}>
              {spectatorPlayers.map((player) => (
                <div key={player.id} className={styles.playerRow}>
                  <span className={styles.avatar}>
                    {player.name.slice(0, 1).toUpperCase()}
                  </span>
                  <span>
                    <strong>{player.name}</strong>
                    <small>{player.connection}</small>
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className={styles.emptyText}>No spectators</p>
          )}
        </div>
      </aside>
    </div>
  );
}
