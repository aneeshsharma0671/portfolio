'use client';

import { type FormEvent, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import {
  FaBolt,
  FaCheck,
  FaCopy,
  FaGamepad,
  FaMicrophoneSlash,
  FaPlay,
  FaPlug,
  FaPlus,
  FaSignOutAlt,
  FaUsers,
} from 'react-icons/fa';

import GameScreen from './components/GameScreen';
import styles from './PlayWithFriends.module.css';
import {
  PLAY_WITH_FRIENDS_GAMES,
  canPlayerToggleReady,
  createInitialPlayWithFriendsState,
  getGameById,
  getGameSeating,
  getPlayerPermissions,
  getStartGate,
  lobbyReducer,
  type GameDefinition,
} from './state';

function createPlayerId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
}

function createRoomCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

function createSessionId() {
  return `session-${Math.random().toString(36).slice(2, 10)}`;
}

function getPlayerRange(game: GameDefinition) {
  if (game.minPlayers === game.maxPlayers) {
    return `${game.minPlayers} players`;
  }

  return `${game.minPlayers}-${game.maxPlayers} players`;
}

function getGameStatusLabel(game: GameDefinition) {
  return game.status === 'playable' ? 'ready' : 'planned';
}

export default function PlayWithFriendsExperience() {
  const [state, dispatch] = useReducer(
    lobbyReducer,
    createInitialPlayWithFriendsState(),
  );
  const [copied, setCopied] = useState(false);
  const [announcement, setAnnouncement] = useState('Play With Friends loaded.');
  const screenTitleRef = useRef<HTMLHeadingElement>(null);

  const selectedGame = useMemo(
    () => getGameById(state.selectedGameId) ?? PLAY_WITH_FRIENDS_GAMES[0],
    [state.selectedGameId],
  );
  const activeGame = useMemo(
    () => (state.activeGameId ? getGameById(state.activeGameId) : null) ?? selectedGame,
    [selectedGame, state.activeGameId],
  );
  const screenModel = useMemo(
    () => ({
      activeGame,
      permissions: getPlayerPermissions(state),
      seating: getGameSeating(state.players, selectedGame),
      selectedGame,
      startGate: getStartGate(state),
    }),
    [activeGame, selectedGame, state],
  );
  const readyCount = state.players.filter((player) => player.ready).length;
  const startReasonId = 'play-with-friends-start-reason';

  useEffect(() => {
    if (state.phase !== 'game') {
      screenTitleRef.current?.focus();
    }
  }, [state.phase]);

  function handleHostRoom(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    dispatch({
      type: 'host-room',
      hostPlayerId: createPlayerId('host'),
      roomCode: createRoomCode(),
    });
  }

  function handleJoinPreview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    dispatch({
      type: 'join-preview',
      fallbackRoomCode: createRoomCode(),
      guestPlayerId: createPlayerId('guest'),
      hostPlayerId: createPlayerId('host'),
    });
  }

  async function handleCopyRoomCode() {
    if (!state.roomCode || !navigator.clipboard) {
      return;
    }

    await navigator.clipboard.writeText(state.roomCode);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  }

  function handleAddMockPlayer() {
    dispatch({
      type: 'add-mock-player',
      actorPlayerId: state.localPlayerId ?? undefined,
      playerId: createPlayerId('mock'),
    });
  }

  function handleStartGame() {
    dispatch({
      type: 'start-game',
      actorPlayerId: state.localPlayerId ?? undefined,
      sessionId: createSessionId(),
      startedAt: Date.now(),
    });
    setAnnouncement(
      screenModel.startGate.canStart ? 'Game screen opened.' : screenModel.startGate.reason,
    );
  }

  function handleReturnToLobby() {
    dispatch({
      type: 'return-to-lobby',
      actorPlayerId: state.localPlayerId ?? undefined,
    });
    setAnnouncement('Returned to lobby.');
  }

  function handleLeaveLobby() {
    dispatch({ type: 'leave' });
    setAnnouncement('Lobby closed.');
  }

  function handleAnnouncement(message: string) {
    setAnnouncement(message);
  }

  return (
    <main className={styles.screen}>
      <section className={styles.shell} aria-labelledby="play-with-friends-title">
        <header className={styles.header}>
          <div>
            <p className={styles.eyebrow}>Experiment</p>
            <h1 id="play-with-friends-title" ref={screenTitleRef} tabIndex={-1}>
              Play With Friends
            </h1>
          </div>
          <div className={styles.statusStrip} aria-label="Lobby status">
            <span className={styles.statusPill}>
              <FaPlug aria-hidden="true" />
              Local adapter
            </span>
            <span className={styles.statusPill}>
              <FaGamepad aria-hidden="true" />
              {state.phase}
            </span>
            <span className={styles.statusPill}>
              <FaMicrophoneSlash aria-hidden="true" />
              Voice later
            </span>
          </div>
        </header>

        <p className={styles.visuallyHidden} aria-live="polite">
          {announcement || state.lastError || screenModel.startGate.reason}
        </p>

        {state.phase === 'game' && state.activeGameSession ? (
          <GameScreen
            game={activeGame}
            session={state.activeGameSession}
            players={state.players}
            localPlayerId={state.localPlayerId}
            hostPlayerId={state.hostPlayerId}
            roomCode={state.roomCode}
            canReturnToLobby={screenModel.permissions.canReturnToLobby}
            onReturnToLobby={handleReturnToLobby}
            onLeaveLobby={handleLeaveLobby}
            onAnnounce={handleAnnouncement}
          />
        ) : (
          <div className={styles.workspace}>
          <section className={styles.panel} aria-labelledby="lobby-heading">
            <div className={styles.panelHeader}>
              <div>
                <p className={styles.panelKicker}>Lobby</p>
                <h2 id="lobby-heading">
                  {state.phase === 'entry' ? 'Room setup' : 'Room'}
                </h2>
              </div>
              {state.roomCode ? (
                <button
                  className={styles.iconButton}
                  type="button"
                  onClick={handleCopyRoomCode}
                  aria-label="Copy room code"
                >
                  {copied ? <FaCheck aria-hidden="true" /> : <FaCopy aria-hidden="true" />}
                </button>
              ) : null}
            </div>

            <div className={styles.roomCodeBox}>
              <span>Room code</span>
              <strong>{state.roomCode || '------'}</strong>
            </div>

            {state.phase === 'entry' ? (
              <form className={styles.form} onSubmit={handleHostRoom}>
                <label className={styles.field}>
                  <span>Your name</span>
                  <input
                    value={state.playerName}
                    maxLength={24}
                    placeholder="Aneesh"
                    onChange={(event) =>
                      dispatch({
                        type: 'set-player-name',
                        name: event.target.value,
                      })
                    }
                  />
                </label>
                <div className={styles.actions}>
                  <button className={styles.primaryButton} type="submit">
                    <FaUsers aria-hidden="true" />
                    Host lobby
                  </button>
                  <button
                    className={styles.secondaryButton}
                    type="button"
                    onClick={() => dispatch({ type: 'show-join' })}
                  >
                    Join lobby
                  </button>
                </div>
              </form>
            ) : null}

            {state.phase === 'joining' ? (
              <form className={styles.form} onSubmit={handleJoinPreview}>
                <label className={styles.field}>
                  <span>Your name</span>
                  <input
                    value={state.playerName}
                    maxLength={24}
                    placeholder="Aneesh"
                    onChange={(event) =>
                      dispatch({
                        type: 'set-player-name',
                        name: event.target.value,
                      })
                    }
                  />
                </label>
                <label className={styles.field}>
                  <span>Invite code</span>
                  <input
                    value={state.joinCode}
                    maxLength={8}
                    placeholder="AB12CD"
                    onChange={(event) =>
                      dispatch({
                        type: 'set-join-code',
                        code: event.target.value,
                      })
                    }
                  />
                </label>
                <div className={styles.actions}>
                  <button className={styles.primaryButton} type="submit">
                    <FaPlug aria-hidden="true" />
                    Join preview
                  </button>
                  <button
                    className={styles.secondaryButton}
                    type="button"
                    onClick={handleLeaveLobby}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : null}

            {state.phase === 'lobby' || state.phase === 'game' ? (
              <div className={styles.lobbyControls}>
                <div className={styles.metricRow}>
                  <div>
                    <span>Players</span>
                    <strong>{state.players.length}</strong>
                  </div>
                  <div>
                    <span>Ready</span>
                    <strong>
                      {readyCount}/{state.players.length}
                    </strong>
                  </div>
                </div>
                <div className={styles.actions}>
                  {screenModel.permissions.canAddMockPlayer ? (
                    <button
                      className={styles.secondaryButton}
                      type="button"
                      onClick={handleAddMockPlayer}
                    >
                      <FaPlus aria-hidden="true" />
                      Add friend
                    </button>
                  ) : null}
                  <button
                    className={styles.dangerButton}
                    type="button"
                    onClick={handleLeaveLobby}
                  >
                    <FaSignOutAlt aria-hidden="true" />
                    Leave
                  </button>
                </div>
              </div>
            ) : null}
          </section>

          <section className={styles.panel} aria-labelledby="players-heading">
            <div className={styles.panelHeader}>
              <div>
                <p className={styles.panelKicker}>People</p>
                <h2 id="players-heading">Players</h2>
              </div>
              <FaUsers className={styles.panelIcon} aria-hidden="true" />
            </div>

            <div className={styles.playerList}>
              {state.players.length ? (
                state.players.map((player) => {
                  const canToggleReady = canPlayerToggleReady(
                    state,
                    state.localPlayerId,
                    player.id,
                  );
                  const isSeated =
                    state.activeGameSession?.activePlayerIds.includes(player.id) ??
                    screenModel.seating.activePlayerIds.includes(player.id);

                  return (
                    <button
                      key={player.id}
                      className={styles.playerRow}
                      type="button"
                      disabled={!canToggleReady}
                      onClick={() =>
                        dispatch({
                          type: 'toggle-ready',
                          actorPlayerId: state.localPlayerId ?? undefined,
                          playerId: player.id,
                        })
                      }
                    >
                      <span className={styles.avatar}>
                        {player.name.slice(0, 1).toUpperCase()}
                      </span>
                      <span>
                        <strong>{player.name}</strong>
                        <small>
                          {player.role} - {player.connection} -{' '}
                          {isSeated ? 'seated' : 'spectator'}
                        </small>
                      </span>
                      <em className={player.ready ? styles.ready : styles.notReady}>
                        {player.ready ? 'Ready' : 'Idle'}
                      </em>
                    </button>
                  );
                })
              ) : (
                <p className={styles.emptyState}>No players yet</p>
              )}
            </div>
          </section>

          <section className={styles.panelWide} aria-labelledby="games-heading">
            <div className={styles.panelHeader}>
              <div>
                <p className={styles.panelKicker}>Games</p>
                <h2 id="games-heading">
                  {state.phase === 'game' ? 'Active game' : 'Game table'}
                </h2>
              </div>
              {state.phase === 'game' ? (
                <button
                  className={styles.secondaryButton}
                  type="button"
                  disabled={!screenModel.permissions.canReturnToLobby}
                  onClick={handleReturnToLobby}
                >
                  Return to lobby
                </button>
              ) : (
                <button
                  className={styles.primaryButton}
                  type="button"
                  aria-describedby={startReasonId}
                  disabled={!screenModel.startGate.canStart}
                  onClick={handleStartGame}
                >
                  <FaPlay aria-hidden="true" />
                  Start
                </button>
              )}
            </div>

            {state.phase !== 'game' ? (
              <>
                <div className={styles.gameGrid}>
                  {PLAY_WITH_FRIENDS_GAMES.map((game) => (
                    <button
                      key={game.id}
                      className={`${styles.gameTile} ${
                        state.selectedGameId === game.id ? styles.gameTileSelected : ''
                      }`}
                      type="button"
                      disabled={!screenModel.permissions.canSelectGame}
                      onClick={() =>
                        dispatch({
                          type: 'select-game',
                          actorPlayerId: state.localPlayerId ?? undefined,
                          gameId: game.id,
                        })
                      }
                    >
                      <span className={styles.gameIcon}>
                        <FaGamepad aria-hidden="true" />
                      </span>
                      <span>
                        <strong>{game.name}</strong>
                        <small>{getPlayerRange(game)}</small>
                      </span>
                      <em>{getGameStatusLabel(game)}</em>
                    </button>
                  ))}
                </div>
                <p
                  id={startReasonId}
                  className={styles.startReason}
                  aria-live="polite"
                >
                  {screenModel.startGate.reason}
                </p>
              </>
            ) : null}

            <div className={styles.gameSurface}>
              <div>
                <p className={styles.panelKicker}>
                  {state.phase === 'game' ? 'Active' : 'Selected'}
                </p>
                <h3>{state.phase === 'game' ? activeGame.name : selectedGame.name}</h3>
                <p>
                  {state.phase === 'game'
                    ? 'Local game shell is running for the seated players.'
                    : selectedGame.description}
                </p>
              </div>
              <div className={styles.boardPreview} aria-label="Board preview">
                {Array.from({ length: 9 }, (_, index) => (
                  <span key={index}>
                    {state.phase === 'game' && index % 2 === 0 ? 'X' : ''}
                  </span>
                ))}
              </div>
            </div>
          </section>

          <section className={styles.panelWide} aria-labelledby="bridge-heading">
            <div className={styles.panelHeader}>
              <div>
                <p className={styles.panelKicker}>Bridge</p>
                <h2 id="bridge-heading">Network boundary</h2>
              </div>
              <FaBolt className={styles.panelIcon} aria-hidden="true" />
            </div>

            <div className={styles.bridgeGrid}>
              <div>
                <span>Transport</span>
                <strong>Local mock</strong>
              </div>
              <div>
                <span>Game authority</span>
                <strong>Host</strong>
              </div>
              <div>
                <span>Active seats</span>
                <strong>{screenModel.startGate.activePlayerIds.length}</strong>
              </div>
            </div>

            {state.lastError ? (
              <p className={styles.startReason} aria-live="polite">
                {state.lastError}
              </p>
            ) : null}

            <ol className={styles.eventLog} aria-label="Lobby events">
              {state.eventLog.map((event) => (
                <li key={event}>{event}</li>
              ))}
            </ol>
          </section>
          </div>
        )}
      </section>
    </main>
  );
}
