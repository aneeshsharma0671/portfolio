'use client';

import { type FormEvent, useMemo, useReducer, useState } from 'react';
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

import styles from './PlayWithFriends.module.css';

type LobbyStatus = 'idle' | 'joining' | 'lobby' | 'game';

type Player = {
  id: string;
  name: string;
  role: 'host' | 'guest';
  ready: boolean;
  connection: 'local' | 'mock' | 'offline';
};

type GameOption = {
  id: string;
  name: string;
  players: string;
  status: 'ready' | 'planned';
  description: string;
};

type LobbyState = {
  status: LobbyStatus;
  roomCode: string;
  playerName: string;
  joinCode: string;
  selectedGameId: string;
  activeGameId: string | null;
  players: Player[];
  eventLog: string[];
};

type LobbyAction =
  | { type: 'set-player-name'; name: string }
  | { type: 'set-join-code'; code: string }
  | { type: 'host-room'; roomCode: string }
  | { type: 'show-join' }
  | { type: 'join-preview' }
  | { type: 'add-mock-player' }
  | { type: 'toggle-ready'; playerId: string }
  | { type: 'select-game'; gameId: string }
  | { type: 'start-game' }
  | { type: 'leave' };

const gameOptions: GameOption[] = [
  {
    id: 'tic-tac-toe',
    name: 'Tic Tac Toe',
    players: '2 players',
    status: 'ready',
    description: 'Turn based board game bridge target.',
  },
  {
    id: 'connect-four',
    name: 'Connect Four',
    players: '2 players',
    status: 'planned',
    description: 'Next deterministic board game candidate.',
  },
  {
    id: 'card-table',
    name: 'Card Table',
    players: '2-6 players',
    status: 'planned',
    description: 'Shared table shell for future card games.',
  },
];

const initialState: LobbyState = {
  status: 'idle',
  roomCode: '',
  playerName: '',
  joinCode: '',
  selectedGameId: gameOptions[0].id,
  activeGameId: null,
  players: [],
  eventLog: ['Lobby shell loaded'],
};

function createPlayerId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
}

function createRoomCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

function getDisplayName(name: string) {
  const trimmed = name.trim();

  if (!trimmed) {
    return 'Player';
  }

  return trimmed.slice(0, 24);
}

function pushLog(state: LobbyState, message: string): string[] {
  return [message, ...state.eventLog].slice(0, 5);
}

function lobbyReducer(state: LobbyState, action: LobbyAction): LobbyState {
  switch (action.type) {
    case 'set-player-name':
      return {
        ...state,
        playerName: action.name,
      };

    case 'set-join-code':
      return {
        ...state,
        joinCode: action.code
          .toUpperCase()
          .replace(/[^A-Z0-9]/g, '')
          .slice(0, 8),
      };

    case 'host-room': {
      const hostName = getDisplayName(state.playerName);

      return {
        ...state,
        status: 'lobby',
        roomCode: action.roomCode,
        players: [
          {
            id: createPlayerId('host'),
            name: hostName,
            role: 'host',
            ready: true,
            connection: 'local',
          },
        ],
        eventLog: pushLog(state, `${hostName} created room ${action.roomCode}`),
      };
    }

    case 'show-join':
      return {
        ...state,
        status: 'joining',
        eventLog: pushLog(state, 'Join panel opened'),
      };

    case 'join-preview': {
      const guestName = getDisplayName(state.playerName);
      const roomCode = state.joinCode || createRoomCode();

      return {
        ...state,
        status: 'lobby',
        roomCode,
        players: [
          {
            id: createPlayerId('host'),
            name: 'Remote host',
            role: 'host',
            ready: true,
            connection: 'mock',
          },
          {
            id: createPlayerId('guest'),
            name: guestName,
            role: 'guest',
            ready: false,
            connection: 'local',
          },
        ],
        eventLog: pushLog(state, `${guestName} joined preview room ${roomCode}`),
      };
    }

    case 'add-mock-player': {
      const mockPlayerNumber =
        state.players.filter((player) => player.connection === 'mock').length + 1;
      const mockPlayer: Player = {
        id: createPlayerId('mock'),
        name: `Friend ${mockPlayerNumber}`,
        role: 'guest',
        ready: mockPlayerNumber % 2 === 0,
        connection: 'mock',
      };

      return {
        ...state,
        players: [...state.players, mockPlayer],
        eventLog: pushLog(state, `${mockPlayer.name} joined locally`),
      };
    }

    case 'toggle-ready':
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
      };

    case 'select-game':
      return {
        ...state,
        selectedGameId: action.gameId,
        eventLog: pushLog(
          state,
          `Selected ${
            gameOptions.find((game) => game.id === action.gameId)?.name ?? 'game'
          }`,
        ),
      };

    case 'start-game':
      return {
        ...state,
        status: 'game',
        activeGameId: state.selectedGameId,
        eventLog: pushLog(state, 'Started local game preview'),
      };

    case 'leave':
      return {
        ...initialState,
        playerName: state.playerName,
        eventLog: pushLog(initialState, 'Lobby closed'),
      };

    default:
      return state;
  }
}

export default function PlayWithFriendsExperience() {
  const [state, dispatch] = useReducer(lobbyReducer, initialState);
  const [copied, setCopied] = useState(false);

  const selectedGame = useMemo(
    () => gameOptions.find((game) => game.id === state.selectedGameId) ?? gameOptions[0],
    [state.selectedGameId],
  );
  const activeGame = useMemo(
    () => gameOptions.find((game) => game.id === state.activeGameId) ?? selectedGame,
    [selectedGame, state.activeGameId],
  );
  const readyCount = state.players.filter((player) => player.ready).length;
  const canStartGame = state.players.length >= 1 && selectedGame.status === 'ready';

  function handleHostRoom(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    dispatch({ type: 'host-room', roomCode: createRoomCode() });
  }

  function handleJoinPreview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    dispatch({ type: 'join-preview' });
  }

  async function handleCopyRoomCode() {
    if (!state.roomCode || !navigator.clipboard) {
      return;
    }

    await navigator.clipboard.writeText(state.roomCode);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  }

  return (
    <main className={styles.screen}>
      <section className={styles.shell} aria-labelledby="play-with-friends-title">
        <header className={styles.header}>
          <div>
            <p className={styles.eyebrow}>Experiment</p>
            <h1 id="play-with-friends-title">Play With Friends</h1>
          </div>
          <div className={styles.statusStrip} aria-label="Lobby status">
            <span className={styles.statusPill}>
              <FaPlug aria-hidden="true" />
              Local adapter
            </span>
            <span className={styles.statusPill}>
              <FaMicrophoneSlash aria-hidden="true" />
              Voice later
            </span>
          </div>
        </header>

        <div className={styles.workspace}>
          <section className={styles.panel} aria-labelledby="lobby-heading">
            <div className={styles.panelHeader}>
              <div>
                <p className={styles.panelKicker}>Lobby</p>
                <h2 id="lobby-heading">Room setup</h2>
              </div>
              {state.roomCode ? (
                <button className={styles.iconButton} type="button" onClick={handleCopyRoomCode} aria-label="Copy room code">
                  {copied ? <FaCheck aria-hidden="true" /> : <FaCopy aria-hidden="true" />}
                </button>
              ) : null}
            </div>

            <div className={styles.roomCodeBox}>
              <span>Room code</span>
              <strong>{state.roomCode || '------'}</strong>
            </div>

            {state.status === 'idle' ? (
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

            {state.status === 'joining' ? (
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
                    onClick={() => dispatch({ type: 'leave' })}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : null}

            {state.status === 'lobby' || state.status === 'game' ? (
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
                  <button
                    className={styles.secondaryButton}
                    type="button"
                    onClick={() => dispatch({ type: 'add-mock-player' })}
                  >
                    <FaPlus aria-hidden="true" />
                    Add friend
                  </button>
                  <button
                    className={styles.dangerButton}
                    type="button"
                    onClick={() => dispatch({ type: 'leave' })}
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
                state.players.map((player) => (
                  <button
                    key={player.id}
                    className={styles.playerRow}
                    type="button"
                    onClick={() => dispatch({ type: 'toggle-ready', playerId: player.id })}
                  >
                    <span className={styles.avatar}>{player.name.slice(0, 1).toUpperCase()}</span>
                    <span>
                      <strong>{player.name}</strong>
                      <small>
                        {player.role} - {player.connection}
                      </small>
                    </span>
                    <em className={player.ready ? styles.ready : styles.notReady}>{player.ready ? 'Ready' : 'Idle'}</em>
                  </button>
                ))
              ) : (
                <p className={styles.emptyState}>No players yet</p>
              )}
            </div>
          </section>

          <section className={styles.panelWide} aria-labelledby="games-heading">
            <div className={styles.panelHeader}>
              <div>
                <p className={styles.panelKicker}>Games</p>
                <h2 id="games-heading">Game table</h2>
              </div>
              <button
                className={styles.primaryButton}
                type="button"
                disabled={!canStartGame}
                onClick={() => dispatch({ type: 'start-game' })}
              >
                <FaPlay aria-hidden="true" />
                Start
              </button>
            </div>

            <div className={styles.gameGrid}>
              {gameOptions.map((game) => (
                <button
                  key={game.id}
                  className={`${styles.gameTile} ${
                    state.selectedGameId === game.id ? styles.gameTileSelected : ''
                  }`}
                  type="button"
                  onClick={() => dispatch({ type: 'select-game', gameId: game.id })}
                >
                  <span className={styles.gameIcon}>
                    <FaGamepad aria-hidden="true" />
                  </span>
                  <span>
                    <strong>{game.name}</strong>
                    <small>{game.players}</small>
                  </span>
                  <em>{game.status}</em>
                </button>
              ))}
            </div>

            <div className={styles.gameSurface}>
              <div>
                <p className={styles.panelKicker}>{state.status === 'game' ? 'Active' : 'Selected'}</p>
                <h3>{state.status === 'game' ? activeGame.name : selectedGame.name}</h3>
                <p>{state.status === 'game' ? 'Local game shell is running.' : selectedGame.description}</p>
              </div>
              <div className={styles.boardPreview} aria-label="Board preview">
                {Array.from({ length: 9 }, (_, index) => (
                  <span key={index}>{state.status === 'game' && index % 2 === 0 ? 'X' : ''}</span>
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
                <span>Next adapter</span>
                <strong>Trystero</strong>
              </div>
            </div>

            <ol className={styles.eventLog} aria-label="Lobby events">
              {state.eventLog.map((event) => (
                <li key={event}>{event}</li>
              ))}
            </ol>
          </section>
        </div>
      </section>
    </main>
  );
}
