'use client';

import { type FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import {
  FaChevronDown,
  FaCopy,
  FaGamepad,
  FaMinus,
  FaPlug,
  FaPlus,
  FaRedo,
  FaSignInAlt,
  FaSignOutAlt,
  FaTerminal,
  FaTools,
  FaUsers,
  FaWifi,
} from 'react-icons/fa';

import {
  applyTicTacToeAction,
  createInitialTicTacToeState,
  getPlayerMark,
  type TicTacToeCell,
  type TicTacToeState,
} from './games/ticTacToe';
import {
  NakamaNetworkAdapter,
  createNakamaTerminalEntry,
  createNakamaDeveloperInfoGroups,
  createNakamaClientConfig,
  createNakamaPeerMessage,
  getNakamaErrorMessage,
  getOrCreateNakamaDeviceId,
  getSortedNakamaSeatPlayerIds,
  isNakamaDevelopmentMode,
  logNakamaDebugEvent,
  parseNakamaDeveloperCommand,
  resolveBrowserNakamaConfig,
  subscribeNakamaDebugEvents,
  type NakamaDeveloperInfoGroup,
  type NakamaAuthenticatedUser,
  type NakamaClientConfig,
  type NakamaMatchSnapshot,
  type NakamaPresenceSummary,
  type NakamaTerminalEntry,
  type CreateNakamaTerminalEntryInput,
  type PeerMessageEnvelope,
} from './network';
import styles from './NakamaLobbyTest.module.css';

type AdapterHandle = {
  adapter: NakamaNetworkAdapter;
  cleanup: () => void;
};

type ConnectionPhase = 'idle' | 'connecting' | 'online' | 'in-match';

type TicTacToeWirePayload = {
  game: 'tic-tac-toe';
  state: TicTacToeState;
  note: string;
};

type LogEntry = {
  id: string;
  text: string;
};

const defaultNakamaConfig = createNakamaClientConfig({
  NEXT_PUBLIC_NAKAMA_SERVER_KEY: process.env.NEXT_PUBLIC_NAKAMA_SERVER_KEY,
  NEXT_PUBLIC_NAKAMA_HOST: process.env.NEXT_PUBLIC_NAKAMA_HOST,
  NEXT_PUBLIC_NAKAMA_PORT: process.env.NEXT_PUBLIC_NAKAMA_PORT,
  NEXT_PUBLIC_NAKAMA_USE_SSL: process.env.NEXT_PUBLIC_NAKAMA_USE_SSL,
});
const isDeveloperToolsEnabled = isNakamaDevelopmentMode(process.env.NODE_ENV);
const MAX_TERMINAL_ENTRIES = 180;

function getShortId(value: string | null | undefined) {
  if (!value) {
    return '-';
  }

  return value.length > 12 ? `${value.slice(0, 8)}...${value.slice(-4)}` : value;
}

function samePlayerIds(first: string[], second: string[]) {
  return first.length === second.length && first.every((id, index) => id === second[index]);
}

function describeGameStatus(state: TicTacToeState, presences: NakamaPresenceSummary[]) {
  if (state.result.status === 'won') {
    return `${getPresenceName(presences, state.result.winnerPlayerId)} wins.`;
  }

  if (state.result.status === 'draw') {
    return 'Draw.';
  }

  const activePlayerIds = getSortedNakamaSeatPlayerIds(presences);

  if (activePlayerIds.length < 2) {
    return 'Waiting for a second player.';
  }

  return `${getPresenceName(presences, state.turnPlayerId)} to move.`;
}

function getPresenceName(presences: NakamaPresenceSummary[], userId: string) {
  return presences.find((presence) => presence.userId === userId)?.username ?? 'Player';
}

function parseTicTacToeWirePayload(payload: unknown): TicTacToeWirePayload | null {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  const candidate = payload as Partial<TicTacToeWirePayload>;

  if (candidate.game !== 'tic-tac-toe' || !isTicTacToeState(candidate.state)) {
    return null;
  }

  return {
    game: candidate.game,
    state: candidate.state,
    note: typeof candidate.note === 'string' ? candidate.note : 'State synced.',
  };
}

function isTicTacToeState(state: unknown): state is TicTacToeState {
  if (!state || typeof state !== 'object') {
    return false;
  }

  const candidate = state as Partial<TicTacToeState>;

  return (
    Array.isArray(candidate.board) &&
    candidate.board.length === 9 &&
    candidate.board.every(isTicTacToeCell) &&
    Array.isArray(candidate.players) &&
    candidate.players.every(
      (player) =>
        player &&
        typeof player.playerId === 'string' &&
        (player.mark === 'X' || player.mark === 'O'),
    ) &&
    typeof candidate.turnPlayerId === 'string' &&
    typeof candidate.moveCount === 'number' &&
    Boolean(candidate.result)
  );
}

function isTicTacToeCell(cell: unknown): cell is TicTacToeCell {
  return cell === null || cell === 'X' || cell === 'O';
}

function formatTerminalTimestamp(timestamp: number) {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function formatTerminalDetails(details: unknown) {
  if (!details) {
    return '';
  }

  if (typeof details === 'string') {
    return details;
  }

  try {
    return JSON.stringify(details);
  } catch {
    return String(details);
  }
}

export default function NakamaLobbyTest() {
  const [serverKey, setServerKey] = useState(defaultNakamaConfig.serverKey);
  const [host, setHost] = useState(defaultNakamaConfig.host);
  const [port, setPort] = useState(defaultNakamaConfig.port);
  const [useSSL, setUseSSL] = useState(defaultNakamaConfig.useSSL);
  const [username, setUsername] = useState('Player');
  const [matchName, setMatchName] = useState('');
  const [joinMatchId, setJoinMatchId] = useState('');
  const [phase, setPhase] = useState<ConnectionPhase>('idle');
  const [busy, setBusy] = useState(false);
  const [authUser, setAuthUser] = useState<NakamaAuthenticatedUser | null>(null);
  const [match, setMatch] = useState<NakamaMatchSnapshot | null>(null);
  const [presences, setPresences] = useState<NakamaPresenceSummary[]>([]);
  const [gameState, setGameState] = useState<TicTacToeState>(() =>
    createInitialTicTacToeState([]),
  );
  const [notice, setNotice] = useState('Disconnected.');
  const [eventLog, setEventLog] = useState<LogEntry[]>([]);
  const [pageProtocol, setPageProtocol] = useState('-');
  const [pageHost, setPageHost] = useState('-');
  const [developerGroupId, setDeveloperGroupId] =
    useState<NakamaDeveloperInfoGroup['id']>('connection');
  const [developerConsoleMinimized, setDeveloperConsoleMinimized] = useState(true);
  const [terminalInput, setTerminalInput] = useState('');
  const [terminalEntries, setTerminalEntries] = useState<NakamaTerminalEntry[]>([]);
  const adapterRef = useRef<AdapterHandle | null>(null);
  const terminalOutputRef = useRef<HTMLDivElement>(null);

  const config = useMemo<NakamaClientConfig>(
    () => ({
      serverKey: serverKey.trim(),
      host: host.trim(),
      port: port.trim(),
      useSSL,
    }),
    [host, port, serverKey, useSSL],
  );
  const activePlayerIds = useMemo(
    () => getSortedNakamaSeatPlayerIds(presences),
    [presences],
  );
  const localMark = authUser ? getPlayerMark(gameState, authUser.userId) : null;
  const statusText = describeGameStatus(gameState, presences);
  const endpoint = `${useSSL ? 'https/wss' : 'http/ws'}://${host}:${port}`;
  const canUseLobby = Boolean(authUser && adapterRef.current);
  const canUseBoard = Boolean(match && authUser && activePlayerIds.length >= 2);
  const developerInfoGroups = useMemo(
    () =>
      isDeveloperToolsEnabled
        ? createNakamaDeveloperInfoGroups({
            nodeEnv: process.env.NODE_ENV,
            endpoint,
            pageProtocol,
            pageHost,
            config,
            phase,
            busy,
            notice,
            authUser,
            match,
            presenceCount: presences.length,
            activePlayerIds,
            localMark,
            gameStatus: statusText,
            eventCount: terminalEntries.length,
          })
        : [],
    [
      activePlayerIds,
      authUser,
      busy,
      config,
      endpoint,
      localMark,
      match,
      notice,
      pageHost,
      pageProtocol,
      phase,
      presences.length,
      statusText,
      terminalEntries.length,
    ],
  );
  const activeDeveloperGroup =
    developerInfoGroups.find((group) => group.id === developerGroupId) ??
    developerInfoGroups[0];

  useEffect(() => {
    if (!isDeveloperToolsEnabled) {
      return undefined;
    }

    setTerminalEntries((current) =>
      [
        ...current,
        createNakamaTerminalEntry({
          level: 'info',
          source: 'terminal',
          message: 'Nakama developer console ready. Type help for commands.',
        }),
      ].slice(-MAX_TERMINAL_ENTRIES),
    );

    return subscribeNakamaDebugEvents((entry) => {
      setTerminalEntries((current) => [...current, entry].slice(-MAX_TERMINAL_ENTRIES));
    });
  }, []);

  useEffect(() => {
    if (developerConsoleMinimized) {
      return;
    }

    terminalOutputRef.current?.scrollTo({
      top: terminalOutputRef.current.scrollHeight,
    });
  }, [developerConsoleMinimized, terminalEntries.length]);

  useEffect(() => {
    const resolvedConfig = resolveBrowserNakamaConfig(
      defaultNakamaConfig,
      window.location.hostname,
    );

    setPageProtocol(window.location.protocol);
    setPageHost(window.location.host);
    setServerKey(resolvedConfig.serverKey);
    setHost(resolvedConfig.host);
    setPort(resolvedConfig.port);
    setUseSSL(resolvedConfig.useSSL);
    logNakamaDebugEvent('page:config-resolved', {
      browserHost: window.location.hostname,
      pageProtocol: window.location.protocol,
      resolvedConfig,
    });

    if (window.location.protocol === 'https:' && !resolvedConfig.useSSL) {
      setNotice('This page is HTTPS, so plain HTTP Nakama may be blocked by the browser.');
      logNakamaDebugEvent('page:mixed-content-risk', {
        pageProtocol: window.location.protocol,
        nakamaUseSSL: resolvedConfig.useSSL,
      });
    }

    return () => {
      logNakamaDebugEvent('page:unmount');
      adapterRef.current?.cleanup();
    };
  }, []);

  function appendLog(message: string) {
    const timestamp = new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    setEventLog((current) =>
      [
        {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          text: `${timestamp} ${message}`,
        },
        ...current,
      ].slice(0, 8),
    );
  }

  function appendTerminalEntry(input: CreateNakamaTerminalEntryInput) {
    if (!isDeveloperToolsEnabled) {
      return;
    }

    setTerminalEntries((current) =>
      [...current, createNakamaTerminalEntry(input)].slice(-MAX_TERMINAL_ENTRIES),
    );
  }

  function syncPresences(nextPresences: NakamaPresenceSummary[]) {
    setPresences(nextPresences);
    const nextActivePlayerIds = getSortedNakamaSeatPlayerIds(nextPresences);

    setGameState((currentState) => {
      const currentPlayerIds = currentState.players
        .map((player) => player.playerId)
        .filter(Boolean);

      if (samePlayerIds(currentPlayerIds, nextActivePlayerIds)) {
        return currentState;
      }

      return createInitialTicTacToeState(nextActivePlayerIds);
    });
  }

  function handleIncomingMessage(message: PeerMessageEnvelope) {
    appendLog(`${message.type} from ${getShortId(message.senderId)}`);

    if (message.type !== 'game/state') {
      return;
    }

    const payload = parseTicTacToeWirePayload(message.payload);

    if (!payload) {
      setNotice('Ignored invalid Tic Tac Toe state.');
      return;
    }

    setGameState(payload.state);
    setNotice(payload.note);
  }

  async function runNakamaAction(actionName: string, action: () => Promise<void>) {
    setBusy(true);
    logNakamaDebugEvent(`ui:${actionName}:start`, {
      phase,
      host,
      port,
      useSSL,
      matchId: match?.matchId,
      userId: authUser?.userId,
    });

    try {
      await action();
      logNakamaDebugEvent(`ui:${actionName}:success`, {
        phase,
        matchId: match?.matchId,
        userId: authUser?.userId,
      });
    } catch (error) {
      const message = getNakamaErrorMessage(error);
      setNotice(message);
      appendLog(message);
      setPhase((currentPhase) => (currentPhase === 'connecting' ? 'idle' : currentPhase));
      logNakamaDebugEvent(`ui:${actionName}:error`, {
        message,
        phase,
        matchId: match?.matchId,
        userId: authUser?.userId,
      });
    } finally {
      setBusy(false);
    }
  }

  function resetLobbyState() {
    setMatch(null);
    setPresences([]);
    setGameState(createInitialTicTacToeState([]));
    setJoinMatchId('');
  }

  async function authenticateWithCurrentConfig() {
    await runNakamaAction('auth', async () => {
      adapterRef.current?.cleanup();
      resetLobbyState();

      const adapter = new NakamaNetworkAdapter(config);
      const unsubscribeMessage = adapter.onMessage(handleIncomingMessage);
      const unsubscribePresence = adapter.onPresence(syncPresences);
      const unsubscribeError = adapter.onError((message) => {
        setNotice(message);
        appendLog(message);
      });

      adapterRef.current = {
        adapter,
        cleanup: () => {
          unsubscribeMessage();
          unsubscribePresence();
          unsubscribeError();
          adapter.disconnect();
        },
      };

      setPhase('connecting');

      const deviceId = getOrCreateNakamaDeviceId(window.localStorage);
      const user = await adapter.authenticate({
        deviceId,
        username,
      });

      setAuthUser(user);
      setPhase('online');
      setNotice(user.created ? 'User created.' : 'User logged in.');
      appendLog(`${user.created ? 'Created' : 'Logged in'} ${user.username}`);
    });
  }

  async function handleAuthenticate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    await authenticateWithCurrentConfig();
  }

  async function handleCreateMatch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!authUser || !adapterRef.current) {
      setNotice('Create or login a user first.');
      return;
    }

    await runNakamaAction('match-create', async () => {
      const snapshot = await adapterRef.current?.adapter.createMatch(matchName);

      if (!snapshot) {
        return;
      }

      setMatch(snapshot);
      setJoinMatchId(snapshot.matchId);
      syncPresences(snapshot.presences);
      setPhase('in-match');
      setNotice('Lobby created.');
      appendLog(`Lobby ${getShortId(snapshot.matchId)} created`);
    });
  }

  async function handleJoinMatch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!authUser || !adapterRef.current) {
      setNotice('Create or login a user first.');
      return;
    }

    if (!joinMatchId.trim()) {
      setNotice('Enter a match id.');
      return;
    }

    await runNakamaAction('match-join', async () => {
      const snapshot = await adapterRef.current?.adapter.joinMatch(joinMatchId);

      if (!snapshot) {
        return;
      }

      setMatch(snapshot);
      setJoinMatchId(snapshot.matchId);
      syncPresences(snapshot.presences);
      setPhase('in-match');
      setNotice('Lobby joined.');
      appendLog(`Joined ${getShortId(snapshot.matchId)}`);
    });
  }

  async function handleCopyMatchId() {
    if (!match || !navigator.clipboard) {
      return;
    }

    await navigator.clipboard.writeText(match.matchId);
    setNotice('Match id copied.');
    logNakamaDebugEvent('ui:match-copy', { matchId: match.matchId });
  }

  function handleLeaveMatch() {
    logNakamaDebugEvent('ui:match-leave', {
      matchId: match?.matchId,
      userId: authUser?.userId,
    });
    adapterRef.current?.adapter.leave();
    resetLobbyState();
    setPhase(authUser ? 'online' : 'idle');
    setNotice('Left lobby.');
    appendLog('Left lobby');
  }

  function handleDisconnect() {
    logNakamaDebugEvent('ui:disconnect', {
      matchId: match?.matchId,
      userId: authUser?.userId,
    });
    adapterRef.current?.cleanup();
    adapterRef.current = null;
    setAuthUser(null);
    resetLobbyState();
    setPhase('idle');
    setNotice('Disconnected.');
    appendLog('Disconnected');
  }

  async function broadcastGameState(nextState: TicTacToeState, note: string) {
    if (!authUser || !match || !adapterRef.current) {
      return;
    }

    await adapterRef.current.adapter.broadcastAsync(
      createNakamaPeerMessage({
        type: 'game/state',
        senderId: authUser.userId,
        matchId: match.matchId,
        payload: {
          game: 'tic-tac-toe',
          state: nextState,
          note,
        } satisfies TicTacToeWirePayload,
      }),
    );
    appendLog(`Broadcast ${note.toLowerCase()}`);
    logNakamaDebugEvent('ui:game-state-broadcast', {
      matchId: match.matchId,
      note,
      turnPlayerId: nextState.turnPlayerId,
      result: nextState.result.status,
    });
  }

  async function handleCellClick(cellIndex: number) {
    if (!authUser) {
      setNotice('Create or login a user first.');
      return;
    }

    if (!canUseBoard) {
      setNotice('Need two players in the lobby.');
      return;
    }

    const result = applyTicTacToeAction(gameState, {
      type: 'place-mark',
      playerId: authUser.userId,
      cellIndex,
    });

    if (!result.accepted) {
      setNotice(result.reason);
      return;
    }

    setGameState(result.state);
    setNotice(result.message);
    logNakamaDebugEvent('ui:cell-click', {
      cellIndex,
      playerId: authUser.userId,
      accepted: true,
    });
    await broadcastGameState(result.state, result.message);
  }

  async function handleResetGame() {
    if (!canUseBoard) {
      setNotice('Need two players in the lobby.');
      return;
    }

    const result = applyTicTacToeAction(gameState, {
      type: 'reset',
      activePlayerIds,
    });

    if (!result.accepted) {
      setNotice(result.reason);
      return;
    }

    setGameState(result.state);
    setNotice(result.message);
    logNakamaDebugEvent('ui:game-reset', {
      activePlayerIds,
    });
    await broadcastGameState(result.state, result.message);
  }

  async function handlePing() {
    if (!authUser || !match || !adapterRef.current) {
      setNotice('Join a lobby first.');
      return;
    }

    await adapterRef.current.adapter.broadcastAsync(
      createNakamaPeerMessage({
        type: 'system/ping',
        senderId: authUser.userId,
        matchId: match.matchId,
        payload: { at: Date.now() },
      }),
    );
    appendLog('Ping sent');
    setNotice('Ping sent.');
    logNakamaDebugEvent('ui:ping', {
      matchId: match.matchId,
      userId: authUser.userId,
    });
  }

  function handleDeveloperCommand(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const command = parseNakamaDeveloperCommand(terminalInput);

    if (!command) {
      return;
    }

    appendTerminalEntry({
      level: 'input',
      source: 'user',
      message: `] ${terminalInput.trim()}`,
    });
    setTerminalInput('');

    if (command.type === 'clear') {
      setTerminalEntries([]);
      return;
    }

    if (command.type === 'help') {
      appendTerminalEntry({
        level: 'info',
        source: 'terminal',
        message: 'Commands: connect, status, server-key, log <message>, clear, help.',
      });
      return;
    }

    if (command.type === 'server-key') {
      appendTerminalEntry({
        level: serverKey.trim() ? 'info' : 'error',
        source: 'config',
        message: serverKey.trim()
          ? `Server key: ${serverKey.trim()}`
          : 'Server key is empty.',
      });
      logNakamaDebugEvent('terminal:server-key', {
        serverKey,
        visible: 'explicit-command',
      });
      return;
    }

    if (command.type === 'status') {
      appendTerminalEntry({
        level: 'info',
        source: 'status',
        message: `${phase} ${endpoint}`,
        details: {
          user: authUser?.username ?? null,
          userId: authUser?.userId ? getShortId(authUser.userId) : null,
          matchId: match?.matchId ? getShortId(match.matchId) : null,
          presences: presences.length,
          notice,
        },
      });
      return;
    }

    if (command.type === 'log') {
      appendTerminalEntry({
        level: 'success',
        source: 'terminal',
        message: command.message,
      });
      logNakamaDebugEvent('terminal:log', { message: command.message });
      return;
    }

    if (command.type === 'connect') {
      appendTerminalEntry({
        level: 'info',
        source: 'terminal',
        message: 'connect requested',
      });
      void authenticateWithCurrentConfig();
      return;
    }

    appendTerminalEntry({
      level: 'error',
      source: 'terminal',
      message: command.message,
      details: { raw: command.raw },
    });
  }

  const terminalLineClassByLevel: Record<NakamaTerminalEntry['level'], string> = {
    debug: styles.terminalLineDebug,
    error: styles.terminalLineError,
    info: styles.terminalLineInfo,
    input: styles.terminalLineInput,
    success: styles.terminalLineSuccess,
  };

  return (
    <main
      className={`${styles.screen} ${
        isDeveloperToolsEnabled ? styles.screenWithDeveloperMenu : ''
      }`}
    >
      {isDeveloperToolsEnabled && activeDeveloperGroup ? (
        developerConsoleMinimized ? (
          <button
            className={styles.developerConsoleLauncher}
            type="button"
            onClick={() => setDeveloperConsoleMinimized(false)}
            aria-label="Open developer console"
          >
            <FaTerminal aria-hidden="true" />
            <span>console</span>
            <strong>{terminalEntries.length}</strong>
          </button>
        ) : (
          <aside className={styles.developerConsole} aria-label="Developer console">
            <div className={styles.developerConsoleHeader}>
              <span className={styles.developerConsoleTitle}>
                <FaTerminal aria-hidden="true" />
                Nakama console
              </span>
              <label className={styles.developerSelect}>
                <span>Info</span>
                <select
                  value={activeDeveloperGroup.id}
                  onChange={(event) =>
                    setDeveloperGroupId(event.target.value as NakamaDeveloperInfoGroup['id'])
                  }
                >
                  {developerInfoGroups.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.label}
                    </option>
                  ))}
                </select>
                <FaChevronDown aria-hidden="true" />
              </label>
              <button
                className={styles.developerConsoleButton}
                type="button"
                onClick={() => setDeveloperConsoleMinimized(true)}
                aria-label="Minimize developer console"
              >
                <FaMinus aria-hidden="true" />
              </button>
            </div>

            <div className={styles.developerConsoleBody}>
              <section className={styles.terminalPanel} aria-label="Nakama terminal output">
                <div className={styles.terminalOutput} ref={terminalOutputRef}>
                  {terminalEntries.length ? (
                    terminalEntries.map((entry) => {
                      const details = formatTerminalDetails(entry.details);

                      return (
                        <div
                          key={entry.id}
                          className={`${styles.terminalLine} ${
                            terminalLineClassByLevel[entry.level]
                          }`}
                        >
                          <span className={styles.terminalMeta}>
                            {formatTerminalTimestamp(entry.at)} {entry.source}
                          </span>
                          <span className={styles.terminalMessage}>{entry.message}</span>
                          {details ? (
                            <code className={styles.terminalDetails}>{details}</code>
                          ) : null}
                        </div>
                      );
                    })
                  ) : (
                    <div className={`${styles.terminalLine} ${styles.terminalLineInfo}`}>
                      <span className={styles.terminalMeta}>terminal</span>
                      <span className={styles.terminalMessage}>scrollback cleared</span>
                    </div>
                  )}
                </div>
                <form className={styles.terminalCommandLine} onSubmit={handleDeveloperCommand}>
                  <span>]</span>
                  <input
                    value={terminalInput}
                    autoCapitalize="off"
                    autoComplete="off"
                    autoCorrect="off"
                    spellCheck={false}
                    placeholder="help | connect | status | server-key"
                    aria-label="Developer console command"
                    onChange={(event) => setTerminalInput(event.target.value)}
                  />
                </form>
              </section>

              <section className={styles.developerInfoPanel} aria-label="Developer info">
                <div className={styles.developerInfoTitle}>
                  <FaTools aria-hidden="true" />
                  {activeDeveloperGroup.label}
                </div>
                <dl className={styles.developerInfoList}>
                  {activeDeveloperGroup.items.map((item) => (
                    <div key={item.label} className={styles.developerInfoRow}>
                      <dt>{item.label}</dt>
                      <dd>{item.value}</dd>
                    </div>
                  ))}
                </dl>
              </section>
            </div>
          </aside>
        )
      ) : null}
      <section className={styles.shell} aria-labelledby="nakama-lobby-title">
        <header className={styles.header}>
          <div>
            <p className={styles.eyebrow}>Play With Friends</p>
            <h1 id="nakama-lobby-title">Nakama Lobby Test</h1>
          </div>
          <div className={styles.statusStrip} aria-label="Nakama status">
            <span className={styles.statusPill}>
              <FaWifi aria-hidden="true" />
              {endpoint}
            </span>
            <span className={styles.statusPill}>
              <FaPlug aria-hidden="true" />
              {phase}
            </span>
            <span className={styles.statusPill}>
              <FaUsers aria-hidden="true" />
              {presences.length}
            </span>
          </div>
        </header>

        <p className={styles.liveStatus} aria-live="polite">
          {notice}
        </p>

        <div className={styles.workspace}>
          <section className={styles.panel} aria-labelledby="nakama-account-title">
            <div className={styles.panelHeader}>
              <div>
                <p className={styles.panelKicker}>Account</p>
                <h2 id="nakama-account-title">Client</h2>
              </div>
              <FaSignInAlt className={styles.panelIcon} aria-hidden="true" />
            </div>

            <form className={styles.form} onSubmit={handleAuthenticate}>
              <div className={styles.fieldRow}>
                <label className={styles.field}>
                  <span>Host</span>
                  <input
                    value={host}
                    autoComplete="off"
                    onChange={(event) => setHost(event.target.value)}
                  />
                </label>
                <label className={styles.field}>
                  <span>Port</span>
                  <input
                    value={port}
                    inputMode="numeric"
                    autoComplete="off"
                    onChange={(event) => setPort(event.target.value)}
                  />
                </label>
              </div>
              <label className={styles.checkbox}>
                <input
                  type="checkbox"
                  checked={useSSL}
                  onChange={(event) => setUseSSL(event.target.checked)}
                />
                <span>Use SSL</span>
              </label>
              <label className={styles.field}>
                <span>Username</span>
                <input
                  value={username}
                  maxLength={32}
                  autoComplete="nickname"
                  onChange={(event) => setUsername(event.target.value)}
                />
              </label>
              <div className={styles.actions}>
                <button className={styles.primaryButton} type="submit" disabled={busy}>
                  <FaSignInAlt aria-hidden="true" />
                  Create / login
                </button>
                <button
                  className={styles.secondaryButton}
                  type="button"
                  disabled={!authUser}
                  onClick={handleDisconnect}
                >
                  <FaSignOutAlt aria-hidden="true" />
                  Disconnect
                </button>
              </div>
            </form>

            <div className={styles.identity}>
              <span>User</span>
              <strong>{authUser?.username ?? '-'}</strong>
              <small>{getShortId(authUser?.userId)}</small>
            </div>
          </section>

          <section className={styles.panel} aria-labelledby="nakama-lobby-panel-title">
            <div className={styles.panelHeader}>
              <div>
                <p className={styles.panelKicker}>Lobby</p>
                <h2 id="nakama-lobby-panel-title">Match</h2>
              </div>
              <FaUsers className={styles.panelIcon} aria-hidden="true" />
            </div>

            <form className={styles.form} onSubmit={handleCreateMatch}>
              <label className={styles.field}>
                <span>Match name</span>
                <input
                  value={matchName}
                  maxLength={40}
                  placeholder="optional"
                  autoComplete="off"
                  onChange={(event) => setMatchName(event.target.value)}
                />
              </label>
              <button
                className={styles.primaryButton}
                type="submit"
                disabled={busy || !canUseLobby}
              >
                <FaPlus aria-hidden="true" />
                Create lobby
              </button>
            </form>

            <form className={styles.form} onSubmit={handleJoinMatch}>
              <label className={styles.field}>
                <span>Match id</span>
                <input
                  value={joinMatchId}
                  autoComplete="off"
                  onChange={(event) => setJoinMatchId(event.target.value)}
                />
              </label>
              <button
                className={styles.secondaryButton}
                type="submit"
                disabled={busy || !canUseLobby}
              >
                <FaPlug aria-hidden="true" />
                Join lobby
              </button>
            </form>

            <div className={styles.matchBox}>
              <span>Current match</span>
              <strong>{match ? getShortId(match.matchId) : '-'}</strong>
              <button
                className={styles.iconButton}
                type="button"
                disabled={!match}
                aria-label="Copy match id"
                onClick={handleCopyMatchId}
              >
                <FaCopy aria-hidden="true" />
              </button>
            </div>

            <div className={styles.playerList} aria-label="Lobby players">
              {presences.length ? (
                presences.map((presence) => {
                  const mark = getPlayerMark(gameState, presence.userId);

                  return (
                    <div key={presence.sessionId} className={styles.playerRow}>
                      <span className={styles.avatar}>
                        {presence.username.slice(0, 1).toUpperCase()}
                      </span>
                      <span>
                        <strong>{presence.username}</strong>
                        <small>{getShortId(presence.userId)}</small>
                      </span>
                      <em>{mark ?? 'Spec'}</em>
                    </div>
                  );
                })
              ) : (
                <p className={styles.emptyText}>No active presences</p>
              )}
            </div>
          </section>

          <section className={styles.gamePanel} aria-labelledby="nakama-game-title">
            <div className={styles.panelHeader}>
              <div>
                <p className={styles.panelKicker}>Game</p>
                <h2 id="nakama-game-title">Tic Tac Toe</h2>
              </div>
              <FaGamepad className={styles.panelIcon} aria-hidden="true" />
            </div>

            <div className={styles.gameStatus}>
              <strong>{statusText}</strong>
              <span>Your mark: {localMark ?? 'Spectator'}</span>
            </div>

            <div className={styles.board} aria-label="Tic Tac Toe board">
              {gameState.board.map((cell, cellIndex) => {
                const isWinningCell =
                  gameState.result.status === 'won' &&
                  gameState.result.winningLine.includes(cellIndex);

                return (
                  <button
                    key={cellIndex}
                    className={`${styles.cell} ${isWinningCell ? styles.cellWin : ''}`}
                    type="button"
                    disabled={
                      Boolean(cell) ||
                      !canUseBoard ||
                      gameState.result.status !== 'playing' ||
                      gameState.turnPlayerId !== authUser?.userId
                    }
                    aria-label={`Cell ${cellIndex + 1}${cell ? `, ${cell}` : ', empty'}`}
                    onClick={() => void handleCellClick(cellIndex)}
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
                disabled={!canUseBoard}
                onClick={() => void handleResetGame()}
              >
                <FaRedo aria-hidden="true" />
                Rematch
              </button>
              <button
                className={styles.secondaryButton}
                type="button"
                disabled={!match}
                onClick={() => void handlePing()}
              >
                <FaWifi aria-hidden="true" />
                Ping
              </button>
              <button
                className={styles.dangerButton}
                type="button"
                disabled={!match}
                onClick={handleLeaveMatch}
              >
                <FaSignOutAlt aria-hidden="true" />
                Leave
              </button>
            </div>

            <div className={styles.eventLog} aria-label="Match event log">
              {eventLog.length ? (
                eventLog.map((entry) => <span key={entry.id}>{entry.text}</span>)
              ) : (
                <span>No events yet</span>
              )}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
