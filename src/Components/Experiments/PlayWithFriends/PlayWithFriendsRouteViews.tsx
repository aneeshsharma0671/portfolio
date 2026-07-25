'use client';

import { type FormEvent } from 'react';
import Link from 'next/link';
import {
  FaCheck,
  FaCopy,
  FaGamepad,
  FaPlug,
  FaPlus,
  FaRedo,
  FaSignInAlt,
  FaSignOutAlt,
  FaUndo,
  FaUsers,
} from 'react-icons/fa';

import { getPlayerMark } from './games/ticTacToe';
import {
  PLAY_WITH_FRIENDS_GAMES,
  getPlayWithFriendsPath,
  parsePlayWithFriendsGameId,
} from './state';
import { usePlayWithFriends } from './PlayWithFriendsRouteShell';
import styles from './NakamaLobbyTest.module.css';

export function PlayWithFriendsEntryView() {
  const play = usePlayWithFriends();

  async function handleOnlineAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await play.authenticateOnline();
  }

  return (
    <div className={styles.workspace}>
      <section className={styles.panel} aria-labelledby="play-mode-title">
        <div className={styles.panelHeader}>
          <div>
            <p className={styles.panelKicker}>Mode</p>
            <h2 id="play-mode-title">Play mode</h2>
          </div>
          <FaGamepad className={styles.panelIcon} aria-hidden="true" />
        </div>

        <div className={styles.modeGrid}>
          <button
            className={`${styles.modeTile} ${
              play.mode === 'local' ? styles.modeTileSelected : ''
            }`}
            type="button"
            onClick={() => play.setMode('local')}
          >
            <strong>Local play</strong>
            <span>Same screen players using the local runtime.</span>
          </button>
          <button
            className={`${styles.modeTile} ${
              play.mode === 'online' ? styles.modeTileSelected : ''
            }`}
            type="button"
            onClick={() => play.setMode('online')}
          >
            <strong>Online play</strong>
            <span>Nakama lobby and match state sync.</span>
          </button>
        </div>

        {play.mode === 'local' ? (
          <div className={styles.actions}>
            <button
              className={styles.primaryButton}
              type="button"
              onClick={play.createLocalLobby}
            >
              <FaUsers aria-hidden="true" />
              Create local lobby
            </button>
          </div>
        ) : null}
      </section>

      <section className={styles.panel} aria-labelledby="account-title">
        <div className={styles.panelHeader}>
          <div>
            <p className={styles.panelKicker}>Online</p>
            <h2 id="account-title">Account</h2>
          </div>
          <FaSignInAlt className={styles.panelIcon} aria-hidden="true" />
        </div>

        <form className={styles.form} onSubmit={handleOnlineAuth}>
          <label className={styles.field}>
            <span>Server key</span>
            <input
              type="password"
              value={play.config.serverKey}
              autoComplete="off"
              onChange={(event) => play.setServerKey(event.target.value)}
            />
          </label>
          <div className={styles.fieldRow}>
            <label className={styles.field}>
              <span>Host</span>
              <input
                value={play.config.host}
                autoComplete="off"
                onChange={(event) => play.setHost(event.target.value)}
              />
            </label>
            <label className={styles.field}>
              <span>Port</span>
              <input
                value={play.config.port}
                inputMode="numeric"
                autoComplete="off"
                onChange={(event) => play.setPort(event.target.value)}
              />
            </label>
          </div>
          <label className={styles.checkbox}>
            <input
              type="checkbox"
              checked={play.config.useSSL}
              onChange={(event) => play.setUseSSL(event.target.checked)}
            />
            <span>Use SSL</span>
          </label>
          <label className={styles.field}>
            <span>Username</span>
            <input
              value={play.username}
              maxLength={32}
              autoComplete="nickname"
              onChange={(event) => play.setUsername(event.target.value)}
            />
          </label>
          <div className={styles.actions}>
            <button className={styles.primaryButton} type="submit" disabled={play.busy}>
              <FaSignInAlt aria-hidden="true" />
              Create / login
            </button>
            <button
              className={styles.secondaryButton}
              type="button"
              disabled={!play.authUser}
              onClick={play.disconnect}
            >
              <FaSignOutAlt aria-hidden="true" />
              Disconnect
            </button>
          </div>
        </form>

        <div className={styles.identity}>
          <span>User</span>
          <strong>{play.authUser?.username ?? '-'}</strong>
          <small>{play.authUser?.userId ?? '-'}</small>
        </div>
      </section>

      <section className={styles.panel} aria-labelledby="online-lobby-title">
        <div className={styles.panelHeader}>
          <div>
            <p className={styles.panelKicker}>Lobby</p>
            <h2 id="online-lobby-title">Online lobby</h2>
          </div>
          <FaUsers className={styles.panelIcon} aria-hidden="true" />
        </div>

        <form className={styles.form} onSubmit={play.createOnlineLobby}>
          <label className={styles.field}>
            <span>Match name</span>
            <input
              value={play.matchName}
              maxLength={40}
              placeholder="optional"
              autoComplete="off"
              onChange={(event) => play.setMatchName(event.target.value)}
            />
          </label>
          <button
            className={styles.primaryButton}
            type="submit"
            disabled={play.busy || !play.authUser}
          >
            <FaPlus aria-hidden="true" />
            Create lobby
          </button>
        </form>

        <form className={styles.form} onSubmit={play.joinOnlineLobby}>
          <label className={styles.field}>
            <span>Match id</span>
            <input
              value={play.joinMatchId}
              autoComplete="off"
              onChange={(event) => play.setJoinMatchId(event.target.value)}
            />
          </label>
          <button
            className={styles.secondaryButton}
            type="submit"
            disabled={play.busy || !play.authUser}
          >
            <FaPlug aria-hidden="true" />
            Join lobby
          </button>
        </form>
      </section>
    </div>
  );
}

export function PlayWithFriendsLobbyView() {
  const play = usePlayWithFriends();
  const localPlayerReady = Boolean(
    play.authUser && play.readyPlayerIds.includes(play.authUser.userId),
  );

  if (!play.match) {
    return <EmptyRouteState title="No lobby joined" />;
  }

  return (
    <div className={styles.workspace}>
      <section className={styles.panel} aria-labelledby="lobby-title">
        <div className={styles.panelHeader}>
          <div>
            <p className={styles.panelKicker}>{play.mode}</p>
            <h2 id="lobby-title">Lobby</h2>
          </div>
          <button
            className={styles.iconButton}
            type="button"
            aria-label="Copy lobby id"
            onClick={() => void play.copyMatchId()}
          >
            <FaCopy aria-hidden="true" />
          </button>
        </div>

        <div className={styles.matchBox}>
          <span>Lobby id</span>
          <strong>{play.match.matchId}</strong>
        </div>

        <div className={styles.actions}>
          {play.mode === 'local' ? (
            <button
              className={styles.secondaryButton}
              type="button"
              onClick={play.addLocalPlayer}
            >
              <FaPlus aria-hidden="true" />
              Add local player
            </button>
          ) : null}
          <button
            className={localPlayerReady ? styles.secondaryButton : styles.primaryButton}
            type="button"
            disabled={!play.authUser || !play.activePlayerIds.includes(play.authUser.userId)}
            onClick={() => void play.toggleReady()}
          >
            <FaCheck aria-hidden="true" />
            {localPlayerReady ? 'Ready' : 'Ready up'}
          </button>
          <button
            className={styles.dangerButton}
            type="button"
            onClick={() => void play.leaveLobby()}
          >
            <FaSignOutAlt aria-hidden="true" />
            Leave
          </button>
        </div>
      </section>

      <section className={styles.panel} aria-labelledby="players-title">
        <div className={styles.panelHeader}>
          <div>
            <p className={styles.panelKicker}>People</p>
            <h2 id="players-title">Players</h2>
          </div>
          <FaUsers className={styles.panelIcon} aria-hidden="true" />
        </div>

        <PlayerList />
      </section>

      <section className={styles.gamePanel} aria-labelledby="selected-game-title">
        <div className={styles.panelHeader}>
          <div>
            <p className={styles.panelKicker}>Games</p>
            <h2 id="selected-game-title">Game table</h2>
          </div>
          {play.isHost ? <FaCheck className={styles.panelIcon} aria-hidden="true" /> : null}
        </div>

        <div className={styles.gameGrid}>
          {PLAY_WITH_FRIENDS_GAMES.map((game) => (
            <button
              key={game.id}
              className={`${styles.gameTile} ${
                play.selectedGameId === game.id ? styles.gameTileSelected : ''
              }`}
              type="button"
              disabled={!play.isHost || play.countdownRemaining !== null}
              onClick={() => void play.selectGame(game.id)}
            >
              <span className={styles.gameIcon}>
                <FaGamepad aria-hidden="true" />
              </span>
              <span>
                <strong>{game.name}</strong>
                <small>
                  {game.minPlayers === game.maxPlayers
                    ? `${game.minPlayers} players`
                    : `${game.minPlayers}-${game.maxPlayers} players`}
                </small>
              </span>
              <em>{game.status === 'playable' ? 'ready' : 'planned'}</em>
            </button>
          ))}
        </div>

        <div className={styles.gameStatus}>
          <strong>
            {play.countdownRemaining !== null
              ? `Starting in ${play.countdownRemaining}`
              : play.startGate.reason}
          </strong>
          <span>
            {
              play.activePlayerIds.filter((playerId) =>
                play.readyPlayerIds.includes(playerId),
              ).length
            }
            /{play.activePlayerIds.length} ready
          </span>
        </div>
      </section>
    </div>
  );
}

export function PlayWithFriendsGamesView() {
  const play = usePlayWithFriends();

  if (!play.match) {
    return <EmptyRouteState title="Join a lobby before choosing a game" />;
  }

  return (
    <div className={styles.workspace}>
      <section className={styles.gamePanel} aria-labelledby="games-title">
        <div className={styles.panelHeader}>
          <div>
            <p className={styles.panelKicker}>Games</p>
            <h2 id="games-title">Choose game</h2>
          </div>
          <button
            className={styles.primaryButton}
            type="button"
            disabled={!play.startGate.canStart || play.busy}
            onClick={() => void play.startSelectedGame()}
          >
            <FaGamepad aria-hidden="true" />
            Start
          </button>
        </div>

        <div className={styles.gameGrid}>
          {PLAY_WITH_FRIENDS_GAMES.map((game) => (
            <button
              key={game.id}
              className={`${styles.gameTile} ${
                play.selectedGameId === game.id ? styles.gameTileSelected : ''
              }`}
              type="button"
              disabled={!play.isHost}
              onClick={() => void play.selectGame(game.id)}
            >
              <span className={styles.gameIcon}>
                <FaGamepad aria-hidden="true" />
              </span>
              <span>
                <strong>{game.name}</strong>
                <small>
                  {game.minPlayers === game.maxPlayers
                    ? `${game.minPlayers} players`
                    : `${game.minPlayers}-${game.maxPlayers} players`}
                </small>
              </span>
              <em>{game.status === 'playable' ? 'ready' : 'planned'}</em>
            </button>
          ))}
        </div>

        <div className={styles.gameStatus}>
          <strong>{play.startGate.reason}</strong>
          <span>{play.isHost ? 'Ready when seats are filled' : 'Host selects the game'}</span>
        </div>
      </section>

      <section className={styles.panel} aria-labelledby="game-players-title">
        <div className={styles.panelHeader}>
          <div>
            <p className={styles.panelKicker}>Seats</p>
            <h2 id="game-players-title">Lobby players</h2>
          </div>
          <FaUsers className={styles.panelIcon} aria-hidden="true" />
        </div>
        <PlayerList />
      </section>
    </div>
  );
}

export function PlayWithFriendsGameView({
  gameId,
}: {
  gameId?: string | null;
}) {
  const play = usePlayWithFriends();
  const routeGameId = parsePlayWithFriendsGameId(gameId);
  const activeGameId = play.activeGameSession?.gameId ?? null;
  const gameMatchesRoute = routeGameId ? activeGameId === routeGameId : Boolean(activeGameId);

  if (!play.match || !play.activeGameSession || !gameMatchesRoute) {
    return <EmptyRouteState title="No active game on this route" />;
  }

  return (
    <div className={styles.workspace}>
      <section className={styles.gamePanel} aria-labelledby="active-game-title">
        <div className={styles.panelHeader}>
          <div>
            <p className={styles.panelKicker}>Active</p>
            <h2 id="active-game-title">{play.selectedGame.name}</h2>
          </div>
          <div className={styles.actions}>
            <button
              className={styles.secondaryButton}
              type="button"
              onClick={() => void play.returnToLobby()}
            >
              <FaUndo aria-hidden="true" />
              Lobby
            </button>
            <button
              className={styles.dangerButton}
              type="button"
              onClick={() => void play.leaveLobby()}
            >
              <FaSignOutAlt aria-hidden="true" />
              Leave
            </button>
          </div>
        </div>

        <div className={styles.gameStatus}>
          <strong>{play.statusText}</strong>
          <span>Your mark: {play.localMark ?? 'Spectator'}</span>
        </div>

        <div className={styles.board} aria-label="Tic Tac Toe board">
          {play.gameState.board.map((cell, cellIndex) => {
            const isWinningCell =
              play.gameState.result.status === 'won' &&
              play.gameState.result.winningLine.includes(cellIndex);
            const canMove =
              play.mode === 'local'
                ? play.gameState.result.status === 'playing'
                : play.gameState.turnPlayerId === play.authUser?.userId;

            return (
              <button
                key={cellIndex}
                className={`${styles.cell} ${isWinningCell ? styles.cellWin : ''}`}
                type="button"
                disabled={Boolean(cell) || !play.canUseBoard || !canMove}
                aria-label={`Cell ${cellIndex + 1}${cell ? `, ${cell}` : ', empty'}`}
                onClick={() => void play.playCell(cellIndex)}
              >
                {cell}
              </button>
            );
          })}
        </div>

        <div className={styles.actions}>
          <button
            className={styles.primaryButton}
            type="button"
            onClick={() => void play.resetGame()}
          >
            <FaRedo aria-hidden="true" />
            Rematch
          </button>
        </div>
      </section>

      <section className={styles.panel} aria-labelledby="active-players-title">
        <div className={styles.panelHeader}>
          <div>
            <p className={styles.panelKicker}>Players</p>
            <h2 id="active-players-title">Table</h2>
          </div>
          <FaUsers className={styles.panelIcon} aria-hidden="true" />
        </div>
        <PlayerList showMarks />
      </section>
    </div>
  );
}

function PlayerList({ showMarks = false }: { showMarks?: boolean }) {
  const play = usePlayWithFriends();

  if (!play.players.length) {
    return <p className={styles.emptyText}>No active players</p>;
  }

  return (
    <div className={styles.playerList} aria-label="Players">
      {play.players.map((player) => {
        const mark = showMarks ? getPlayerMark(play.gameState, player.id) : null;
        const isHost = player.id === play.hostUserId;
        const badge = showMarks
          ? mark ?? (play.activePlayerIds.includes(player.id) ? 'Seat' : 'Spec')
          : player.ready
            ? 'Ready'
            : 'Idle';

        return (
          <div key={player.id} className={styles.playerRow}>
            <span className={styles.avatar}>{player.name.slice(0, 1).toUpperCase()}</span>
            <span>
              <strong>{player.name}</strong>
              <small>
                {isHost ? 'host' : player.role} - {player.connection}
              </small>
            </span>
            <em>{badge}</em>
          </div>
        );
      })}
    </div>
  );
}

function EmptyRouteState({ title }: { title: string }) {
  return (
    <section className={styles.panel} aria-labelledby="empty-route-title">
      <div className={styles.panelHeader}>
        <div>
          <p className={styles.panelKicker}>Route</p>
          <h2 id="empty-route-title">{title}</h2>
        </div>
      </div>
      <div className={styles.actions}>
        <Link className={styles.primaryButton} href={getPlayWithFriendsPath('entry')}>
          Entry
        </Link>
        <Link className={styles.secondaryButton} href={getPlayWithFriendsPath('lobby')}>
          Lobby
        </Link>
      </div>
    </section>
  );
}
