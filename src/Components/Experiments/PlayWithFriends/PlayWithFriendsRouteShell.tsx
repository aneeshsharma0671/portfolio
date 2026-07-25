'use client';

import {
  createContext,
  type FormEvent,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useRouter } from 'next/navigation';
import {
  FaChevronDown,
  FaMinus,
  FaPlug,
  FaTerminal,
  FaTools,
  FaUsers,
  FaWifi,
} from 'react-icons/fa';

import {
  applyTicTacToeAction,
  createInitialTicTacToeState,
  getPlayerMark,
  type TicTacToeAction,
  type TicTacToeCell,
  type TicTacToeState,
} from './games/ticTacToe';
import {
  LocalPlayer,
  MockPlayer,
  LocalMultiplayerRuntime,
  OnlineMultiplayerRuntime,
  type MultiplayerRuntime,
  type MultiplayerRuntimeMessage,
} from './runtime';
import {
  PLAY_WITH_FRIENDS_GAMES,
  createOnlineGameSession,
  createOnlinePlayersFromPresences,
  getGameById,
  getOnlineStartGate,
  getPlayWithFriendsPath,
  parseOnlineGameStartPayload,
  parseOnlineLobbySnapshotPayload,
  type GameDefinition,
  type GameSession,
  type Player,
  type PlayWithFriendsGameId,
} from './state';
import {
  NakamaNetworkAdapter,
  createNakamaClientConfig,
  createNakamaDeveloperInfoGroups,
  createNakamaPeerMessage,
  createNakamaTerminalEntry,
  getNakamaErrorMessage,
  getOrCreateNakamaDeviceId,
  getSortedNakamaSeatPlayerIds,
  isNakamaDevelopmentMode,
  logNakamaDebugEvent,
  parseNakamaDeveloperCommand,
  resolveBrowserNakamaConfig,
  subscribeNakamaDebugEvents,
  type CreateNakamaTerminalEntryInput,
  type NakamaAuthenticatedUser,
  type NakamaClientConfig,
  type NakamaDeveloperInfoGroup,
  type NakamaMatchSnapshot,
  type NakamaPresenceSummary,
  type NakamaTerminalEntry,
  type PeerMessageEnvelope,
} from './network';
import styles from './NakamaLobbyTest.module.css';

type PlayMode = 'local' | 'online';
type ConnectionPhase = 'idle' | 'connecting' | 'online' | 'in-lobby' | 'in-game';
type AdapterHandle = {
  adapter: NakamaNetworkAdapter;
  cleanup: () => void;
};
type RuntimeHandle = {
  runtime: MultiplayerRuntime<TicTacToeAction, TicTacToeState>;
  cleanup: () => void;
};

type TicTacToeWirePayload = {
  game: 'tic-tac-toe';
  state: TicTacToeState;
  note: string;
};

type PlayWithFriendsContextValue = {
  mode: PlayMode;
  setMode: (mode: PlayMode) => void;
  phase: ConnectionPhase;
  busy: boolean;
  notice: string;
  username: string;
  setUsername: (username: string) => void;
  matchName: string;
  setMatchName: (matchName: string) => void;
  joinMatchId: string;
  setJoinMatchId: (joinMatchId: string) => void;
  config: NakamaClientConfig;
  setServerKey: (serverKey: string) => void;
  setHost: (host: string) => void;
  setPort: (port: string) => void;
  setUseSSL: (useSSL: boolean) => void;
  endpoint: string;
  authUser: NakamaAuthenticatedUser | null;
  match: NakamaMatchSnapshot | null;
  presences: NakamaPresenceSummary[];
  players: Player[];
  hostUserId: string | null;
  selectedGameId: PlayWithFriendsGameId;
  selectedGame: GameDefinition;
  activeGameSession: GameSession | null;
  gameState: TicTacToeState;
  activePlayerIds: string[];
  spectatorPlayerIds: string[];
  readyPlayerIds: string[];
  countdownRemaining: number | null;
  allActivePlayersReady: boolean;
  localMark: string | null;
  statusText: string;
  startGate: ReturnType<typeof getOnlineStartGate>;
  eventLog: string[];
  isHost: boolean;
  canUseBoard: boolean;
  authenticateOnline: () => Promise<void>;
  createOnlineLobby: (event?: FormEvent<HTMLFormElement>) => Promise<void>;
  joinOnlineLobby: (event?: FormEvent<HTMLFormElement>) => Promise<void>;
  createLocalLobby: () => void;
  addLocalPlayer: () => void;
  selectGame: (gameId: PlayWithFriendsGameId) => Promise<void>;
  toggleReady: () => Promise<void>;
  startSelectedGame: () => Promise<void>;
  playCell: (cellIndex: number) => Promise<void>;
  resetGame: () => Promise<void>;
  returnToLobby: () => Promise<void>;
  leaveLobby: () => Promise<void>;
  disconnect: () => void;
  copyMatchId: () => Promise<void>;
};

const defaultNakamaConfig = createNakamaClientConfig({
  NEXT_PUBLIC_NAKAMA_SERVER_KEY: process.env.NEXT_PUBLIC_NAKAMA_SERVER_KEY,
  NEXT_PUBLIC_NAKAMA_HOST: process.env.NEXT_PUBLIC_NAKAMA_HOST,
  NEXT_PUBLIC_NAKAMA_PORT: process.env.NEXT_PUBLIC_NAKAMA_PORT,
  NEXT_PUBLIC_NAKAMA_USE_SSL: process.env.NEXT_PUBLIC_NAKAMA_USE_SSL,
});
const isDeveloperToolsEnabled = isNakamaDevelopmentMode(process.env.NODE_ENV);
const MAX_TERMINAL_ENTRIES = 180;
const PlayWithFriendsContext = createContext<PlayWithFriendsContextValue | null>(null);

export function usePlayWithFriends() {
  const context = useContext(PlayWithFriendsContext);

  if (!context) {
    throw new Error('usePlayWithFriends must be used inside PlayWithFriendsRouteShell.');
  }

  return context;
}

export default function PlayWithFriendsRouteShell({
  children,
}: {
  children: ReactNode;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<PlayMode>('online');
  const [serverKey, setServerKey] = useState(defaultNakamaConfig.serverKey);
  const [host, setHost] = useState(defaultNakamaConfig.host);
  const [port, setPort] = useState(defaultNakamaConfig.port);
  const [useSSL, setUseSSL] = useState(defaultNakamaConfig.useSSL);
  const [username, setUsername] = useState('Player');
  const [matchName, setMatchName] = useState('');
  const [joinMatchId, setJoinMatchId] = useState('');
  const [phase, setPhase] = useState<ConnectionPhase>('idle');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('Choose local or online play.');
  const [authUser, setAuthUser] = useState<NakamaAuthenticatedUser | null>(null);
  const [match, setMatch] = useState<NakamaMatchSnapshot | null>(null);
  const [presences, setPresences] = useState<NakamaPresenceSummary[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [hostUserId, setHostUserId] = useState<string | null>(null);
  const [readyPlayerIds, setReadyPlayerIds] = useState<string[]>([]);
  const [countdownStartedAt, setCountdownStartedAt] = useState<number | null>(null);
  const [countdownNow, setCountdownNow] = useState(Date.now());
  const [selectedGameId, setSelectedGameId] =
    useState<PlayWithFriendsGameId>('tic-tac-toe');
  const [activeGameSession, setActiveGameSession] = useState<GameSession | null>(null);
  const [gameState, setGameState] = useState<TicTacToeState>(() =>
    createInitialTicTacToeState([]),
  );
  const [eventLog, setEventLog] = useState<string[]>([]);
  const [pageProtocol, setPageProtocol] = useState('-');
  const [pageHost, setPageHost] = useState('-');
  const [developerGroupId, setDeveloperGroupId] =
    useState<NakamaDeveloperInfoGroup['id']>('connection');
  const [developerConsoleMinimized, setDeveloperConsoleMinimized] = useState(true);
  const [terminalInput, setTerminalInput] = useState('');
  const [terminalEntries, setTerminalEntries] = useState<NakamaTerminalEntry[]>([]);
  const terminalOutputRef = useRef<HTMLDivElement>(null);
  const adapterRef = useRef<AdapterHandle | null>(null);
  const runtimeRef = useRef<RuntimeHandle | null>(null);
  const authUserRef = useRef<NakamaAuthenticatedUser | null>(null);
  const hostUserIdRef = useRef<string | null>(null);
  const presencesRef = useRef<NakamaPresenceSummary[]>([]);
  const readyPlayerIdsRef = useRef<string[]>([]);
  const countdownStartedAtRef = useRef<number | null>(null);
  const selectedGameIdRef = useRef<PlayWithFriendsGameId>('tic-tac-toe');
  const countdownStartRequestedRef = useRef(false);

  const config = useMemo<NakamaClientConfig>(
    () => ({
      serverKey: serverKey.trim(),
      host: host.trim(),
      port: port.trim(),
      useSSL,
    }),
    [host, port, serverKey, useSSL],
  );
  const endpoint = `${useSSL ? 'https/wss' : 'http/ws'}://${host}:${port}`;
  const selectedGame = getGameById(selectedGameId) ?? PLAY_WITH_FRIENDS_GAMES[0];
  const activePlayerIds = useMemo(
    () => getSeatPlayerIds(presences, selectedGame, hostUserId),
    [hostUserId, presences, selectedGame],
  );
  const spectatorPlayerIds = useMemo(
    () =>
      presences
        .map((presence) => presence.userId)
        .filter((userId) => !activePlayerIds.includes(userId)),
    [activePlayerIds, presences],
  );
  const localMark = authUser ? getPlayerMark(gameState, authUser.userId) : null;
  const statusText = describeGameStatus(gameState, presences);
  const isHost = Boolean(authUser?.userId && authUser.userId === hostUserId);
  const canUseBoard = Boolean(match && authUser && activeGameSession);
  const allActivePlayersReady =
    activePlayerIds.length >= selectedGame.minPlayers &&
    activePlayerIds.every((playerId) => readyPlayerIds.includes(playerId));
  const countdownRemaining =
    countdownStartedAt === null
      ? null
      : Math.max(0, 3 - Math.floor((countdownNow - countdownStartedAt) / 1000));
  const startGate = getOnlineStartGate({
    localUserId: authUser?.userId ?? null,
    hostUserId,
    selectedGameId,
    activePlayerIds,
    spectatorPlayerIds,
  });
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

  const appendEvent = useCallback((message: string) => {
    const timestamp = new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    setEventLog((current) => [`${timestamp} ${message}`, ...current].slice(0, 10));
  }, []);

  useEffect(() => {
    authUserRef.current = authUser;
  }, [authUser]);

  useEffect(() => {
    hostUserIdRef.current = hostUserId;
  }, [hostUserId]);

  useEffect(() => {
    presencesRef.current = presences;
  }, [presences]);

  useEffect(() => {
    readyPlayerIdsRef.current = readyPlayerIds;
  }, [readyPlayerIds]);

  useEffect(() => {
    countdownStartedAtRef.current = countdownStartedAt;
  }, [countdownStartedAt]);

  useEffect(() => {
    selectedGameIdRef.current = selectedGameId;
  }, [selectedGameId]);

  const syncPresenceSnapshots = useCallback(
    (
      nextPresences: NakamaPresenceSummary[],
      nextHostUserId = hostUserIdRef.current,
      localUserId = authUserRef.current?.userId ?? null,
      nextReadyPlayerIds = readyPlayerIdsRef.current,
    ) => {
      const fallbackHostUserId =
        nextHostUserId ??
        nextPresences.find((presence) => presence.userId === localUserId)?.userId ??
        nextPresences[0]?.userId ??
        null;

      setPresences(nextPresences);
      setHostUserId(fallbackHostUserId);
      setPlayers(
        applyReadyState(
          createOnlinePlayersFromPresences(nextPresences, fallbackHostUserId, localUserId),
          nextReadyPlayerIds,
        ),
      );
    },
    [],
  );

  const cleanupRuntime = useCallback(() => {
    runtimeRef.current?.cleanup();
    runtimeRef.current = null;
  }, []);

  const configureRuntime = useCallback(
    (
      runtimeMode: PlayMode,
      currentUser: NakamaAuthenticatedUser,
      currentMatch: NakamaMatchSnapshot,
    ) => {
      cleanupRuntime();

      const runtime =
        runtimeMode === 'local'
          ? new LocalMultiplayerRuntime<TicTacToeAction, TicTacToeState>()
          : new OnlineMultiplayerRuntime<TicTacToeAction, TicTacToeState>({
              send: async (message) => {
                await broadcastRuntimeMessage(
                  adapterRef.current?.adapter ?? null,
                  currentUser,
                  currentMatch,
                  message,
                );
              },
            });
      const unsubscribeState = runtime.onState((message) => {
        setGameState(message.state);
      });

      runtimeRef.current = {
        runtime,
        cleanup: () => {
          unsubscribeState();
          runtime.disconnect();
        },
      };
    },
    [cleanupRuntime],
  );

  const broadcastLobbySnapshot = useCallback(
    async (
      overrides: Partial<{
        nextSelectedGameId: PlayWithFriendsGameId;
        nextHostUserId: string | null;
        nextActiveGameId: PlayWithFriendsGameId | null;
        nextActivePlayerIds: string[];
        nextSpectatorPlayerIds: string[];
        nextReadyPlayerIds: string[];
        nextCountdownStartedAt: number | null;
      }> = {},
    ) => {
      if (mode !== 'online' || !authUser || !match || !adapterRef.current) {
        return;
      }

      await adapterRef.current.adapter.broadcastAsync(
        createNakamaPeerMessage({
          type: 'lobby/snapshot',
          senderId: authUser.userId,
          matchId: match.matchId,
          payload: {
            hostUserId: overrides.nextHostUserId ?? hostUserId ?? authUser.userId,
            selectedGameId: overrides.nextSelectedGameId ?? selectedGameId,
            activeGameId: overrides.nextActiveGameId ?? activeGameSession?.gameId ?? null,
            activePlayerIds: overrides.nextActivePlayerIds ?? activePlayerIds,
            spectatorPlayerIds: overrides.nextSpectatorPlayerIds ?? spectatorPlayerIds,
            readyPlayerIds: overrides.nextReadyPlayerIds ?? readyPlayerIds,
            countdownStartedAt:
              overrides.nextCountdownStartedAt !== undefined
                ? overrides.nextCountdownStartedAt
                : countdownStartedAt,
          },
        }),
      );
    },
    [
      activeGameSession?.gameId,
      activePlayerIds,
      authUser,
      countdownStartedAt,
      hostUserId,
      match,
      mode,
      readyPlayerIds,
      selectedGameId,
      spectatorPlayerIds,
    ],
  );

  const handleIncomingMessage = useCallback(
    (message: PeerMessageEnvelope) => {
      appendEvent(`${message.type} from ${getShortId(message.senderId)}`);

      if (message.type === 'lobby/snapshot') {
        const payload = parseOnlineLobbySnapshotPayload(message.payload);

        if (!payload) {
          setNotice('Ignored invalid lobby snapshot.');
          return;
        }

        setHostUserId(payload.hostUserId);
        setSelectedGameId(payload.selectedGameId);
        setReadyPlayerIds(payload.readyPlayerIds);
        setCountdownStartedAt(payload.countdownStartedAt);
        setActiveGameSession(null);
        setPhase('in-lobby');
        syncPresenceSnapshots(
          presencesRef.current,
          payload.hostUserId,
          authUserRef.current?.userId ?? null,
          payload.readyPlayerIds,
        );
        router.push(getPlayWithFriendsPath('lobby'));
        return;
      }

      if (message.type === 'lobby/player-joined') {
        const presence = parsePresencePayload(message.payload);

        if (!presence) {
          setNotice('Ignored invalid player join.');
          return;
        }

        const nextPresences = upsertPresence(presencesRef.current, presence);
        syncPresenceSnapshots(
          nextPresences,
          hostUserIdRef.current,
          authUserRef.current?.userId ?? null,
        );
        setNotice(`${presence.username} joined.`);

        if (
          authUserRef.current?.userId &&
          authUserRef.current.userId === hostUserIdRef.current
        ) {
          const currentMatch = adapterRef.current?.adapter.getCurrentMatch();
          const currentGame =
            getGameById(selectedGameIdRef.current) ?? PLAY_WITH_FRIENDS_GAMES[0];
          const nextActivePlayerIds = getSeatPlayerIds(
            nextPresences,
            currentGame,
            hostUserIdRef.current,
          );
          const nextSpectatorPlayerIds = nextPresences
            .map((nextPresence) => nextPresence.userId)
            .filter((userId) => !nextActivePlayerIds.includes(userId));

          if (currentMatch) {
            void adapterRef.current?.adapter.broadcastAsync(
              createNakamaPeerMessage({
                type: 'lobby/snapshot',
                senderId: authUserRef.current.userId,
                matchId: currentMatch.matchId,
                payload: {
                  hostUserId: hostUserIdRef.current,
                  selectedGameId: selectedGameIdRef.current,
                  activeGameId: null,
                  activePlayerIds: nextActivePlayerIds,
                  spectatorPlayerIds: nextSpectatorPlayerIds,
                  readyPlayerIds: readyPlayerIdsRef.current,
                  countdownStartedAt: countdownStartedAtRef.current,
                },
              }),
            );
          }
        }
        return;
      }

      if (message.type === 'lobby/player-left') {
        const userId = parseUserIdPayload(message.payload);

        if (!userId) {
          setNotice('Ignored invalid player leave.');
          return;
        }

        const nextPresences = presencesRef.current.filter(
          (presence) => presence.userId !== userId,
        );
        const nextReadyPlayerIds = readyPlayerIdsRef.current.filter(
          (playerId) => playerId !== userId,
        );

        setReadyPlayerIds(nextReadyPlayerIds);
        setCountdownStartedAt(null);
        syncPresenceSnapshots(
          nextPresences,
          hostUserIdRef.current === userId ? null : hostUserIdRef.current,
          authUserRef.current?.userId ?? null,
          nextReadyPlayerIds,
        );
        setNotice('Player left.');
        return;
      }

      if (message.type === 'game/start') {
        const payload = parseOnlineGameStartPayload(message.payload);

        if (!payload) {
          setNotice('Ignored invalid game start.');
          return;
        }

        const session = createOnlineGameSession({
          sessionId: payload.sessionId,
          gameId: payload.gameId,
          activePlayerIds: payload.activePlayerIds,
          spectatorPlayerIds: payload.spectatorPlayerIds,
          startedAt: Date.now(),
        });

        setHostUserId(payload.hostUserId);
        setSelectedGameId(payload.gameId);
        setActiveGameSession(session);
        setGameState(
          isTicTacToeState(payload.state)
            ? payload.state
            : createInitialTicTacToeState(payload.activePlayerIds),
        );
        setPhase('in-game');
        router.push(getPlayWithFriendsPath('game', payload.gameId));
        return;
      }

      if (message.type === 'game/state') {
        const payload = parseTicTacToeWirePayload(message.payload);

        if (!payload) {
          setNotice('Ignored invalid game state.');
          return;
        }

        setNotice(payload.note);
        setGameState(payload.state);
      }
    },
    [appendEvent, router, syncPresenceSnapshots],
  );

  const runAction = useCallback(
    async (actionName: string, action: () => Promise<void>) => {
      setBusy(true);
      logNakamaDebugEvent(`ui:${actionName}:start`, {
        mode,
        phase,
        matchId: match?.matchId,
        userId: authUser?.userId,
      });

      try {
        await action();
        logNakamaDebugEvent(`ui:${actionName}:success`, {
          mode,
          phase,
          matchId: match?.matchId,
          userId: authUser?.userId,
        });
      } catch (error) {
        const message = getNakamaErrorMessage(error);
        setNotice(message);
        appendEvent(message);
        setPhase((currentPhase) => (currentPhase === 'connecting' ? 'idle' : currentPhase));
        logNakamaDebugEvent(`ui:${actionName}:error`, {
          message,
          mode,
          phase,
          matchId: match?.matchId,
          userId: authUser?.userId,
        });
      } finally {
        setBusy(false);
      }
    },
    [appendEvent, authUser?.userId, match?.matchId, mode, phase],
  );

  const authenticateOnline = useCallback(async () => {
    await runAction('auth', async () => {
      adapterRef.current?.cleanup();
      cleanupRuntime();
      clearLobbyState({
        setMatch,
        setPresences,
        setPlayers,
        setHostUserId,
        setReadyPlayerIds,
        setCountdownStartedAt,
        setActiveGameSession,
        setGameState,
      });
      setMode('online');
      setPhase('connecting');

      const adapter = new NakamaNetworkAdapter(config);
      const unsubscribeMessage = adapter.onMessage(handleIncomingMessage);
      const unsubscribePresence = adapter.onPresence((nextPresences) => {
        const nextUserIds = new Set(nextPresences.map((presence) => presence.userId));
        const nextReadyPlayerIds = readyPlayerIdsRef.current.filter((playerId) =>
          nextUserIds.has(playerId),
        );

        if (nextReadyPlayerIds.length !== readyPlayerIdsRef.current.length) {
          setReadyPlayerIds(nextReadyPlayerIds);
          setCountdownStartedAt(null);
        }

        syncPresenceSnapshots(
          nextPresences,
          hostUserIdRef.current,
          authUserRef.current?.userId ?? null,
          nextReadyPlayerIds,
        );
      });
      const unsubscribeError = adapter.onError((message) => {
        setNotice(message);
        appendEvent(message);
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

      const deviceId = getOrCreateNakamaDeviceId(window.localStorage);
      const user = await adapter.authenticate({
        deviceId,
        username,
      });

      setAuthUser(user);
      setPhase('online');
      setNotice(user.created ? 'User created.' : 'User logged in.');
      appendEvent(`${user.created ? 'Created' : 'Logged in'} ${user.username}`);
    });
  }, [
    appendEvent,
    cleanupRuntime,
    config,
    handleIncomingMessage,
    runAction,
    syncPresenceSnapshots,
    username,
  ]);

  const createOnlineLobby = useCallback(
    async (event?: FormEvent<HTMLFormElement>) => {
      event?.preventDefault();

      if (!authUser || !adapterRef.current) {
        setNotice('Create or login an online user first.');
        return;
      }

      await runAction('match-create', async () => {
        const snapshot = await adapterRef.current?.adapter.createMatch(matchName);

        if (!snapshot) {
          return;
        }

        setMode('online');
        setMatch(snapshot);
        setJoinMatchId(snapshot.matchId);
        setHostUserId(authUser.userId);
        setReadyPlayerIds([]);
        setCountdownStartedAt(null);
        syncPresenceSnapshots(snapshot.presences, authUser.userId, authUser.userId);
        configureRuntime('online', authUser, snapshot);
        setPhase('in-lobby');
        setNotice('Online lobby created.');
        appendEvent(`Lobby ${getShortId(snapshot.matchId)} created`);
        router.push(getPlayWithFriendsPath('lobby'));
        await broadcastLobbySnapshot({
          nextHostUserId: authUser.userId,
          nextReadyPlayerIds: [],
          nextCountdownStartedAt: null,
        });
      });
    },
    [
      appendEvent,
      authUser,
      broadcastLobbySnapshot,
      configureRuntime,
      matchName,
      router,
      runAction,
      syncPresenceSnapshots,
    ],
  );

  const joinOnlineLobby = useCallback(
    async (event?: FormEvent<HTMLFormElement>) => {
      event?.preventDefault();

      if (!authUser || !adapterRef.current) {
        setNotice('Create or login an online user first.');
        return;
      }

      if (!joinMatchId.trim()) {
        setNotice('Enter a match id.');
        return;
      }

      await runAction('match-join', async () => {
        const snapshot = await adapterRef.current?.adapter.joinMatch(joinMatchId);

        if (!snapshot) {
          return;
        }

        const inferredHostUserId =
          hostUserId ?? snapshot.presences[0]?.userId ?? snapshot.self?.userId ?? null;

        setMode('online');
        setMatch(snapshot);
        setJoinMatchId(snapshot.matchId);
        setReadyPlayerIds([]);
        setCountdownStartedAt(null);
        syncPresenceSnapshots(snapshot.presences, inferredHostUserId, authUser.userId);
        configureRuntime('online', authUser, snapshot);
        setPhase('in-lobby');
        setNotice('Online lobby joined.');
        appendEvent(`Joined ${getShortId(snapshot.matchId)}`);
        router.push(getPlayWithFriendsPath('lobby'));
        await adapterRef.current?.adapter.broadcastAsync(
          createNakamaPeerMessage({
            type: 'lobby/player-joined',
            senderId: authUser.userId,
            matchId: snapshot.matchId,
            payload: snapshot.self ?? {
              userId: authUser.userId,
              sessionId: `session-${authUser.userId}`,
              username: authUser.username,
            },
          }),
        );
      });
    },
    [
      appendEvent,
      authUser,
      configureRuntime,
      hostUserId,
      joinMatchId,
      router,
      runAction,
      syncPresenceSnapshots,
    ],
  );

  const createLocalLobby = useCallback(() => {
    adapterRef.current?.cleanup();
    adapterRef.current = null;
    cleanupRuntime();

    const hostId = createLocalId('host');
    const friendId = createLocalId('friend');
    const roomCode = createLocalRoomCode();
    const hostName = username.trim() || 'Player';
    const localUser = { userId: hostId, username: hostName, created: true };
    const localPresences = [
      createLocalPresence(hostId, hostName),
      createLocalPresence(friendId, 'Friend'),
    ];
    const localMatch = {
      matchId: roomCode,
      roomCode,
      self: localPresences[0],
      presences: localPresences,
    } satisfies NakamaMatchSnapshot;

    setMode('local');
    setAuthUser(localUser);
    setMatch(localMatch);
    setJoinMatchId(roomCode);
    setHostUserId(hostId);
    setReadyPlayerIds([friendId]);
    setCountdownStartedAt(null);
    setPresences(localPresences);
    setPlayers([
      new LocalPlayer({
        id: hostId,
        name: hostName,
        role: 'host',
        ready: false,
      }).toSnapshot(),
      new MockPlayer({
        id: friendId,
        name: 'Friend',
        role: 'guest',
        ready: true,
      }).toSnapshot(),
    ]);
    configureRuntime('local', localUser, localMatch);
    setGameState(createInitialTicTacToeState(getSeatPlayerIds(localPresences, selectedGame, hostId)));
    setActiveGameSession(null);
    setPhase('in-lobby');
    setNotice('Local lobby created.');
    appendEvent(`Local lobby ${roomCode} created`);
    router.push(getPlayWithFriendsPath('lobby'));
  }, [
    appendEvent,
    cleanupRuntime,
    configureRuntime,
    router,
    selectedGame,
    username,
  ]);

  const addLocalPlayer = useCallback(() => {
    if (mode !== 'local' || !match || !authUser || !hostUserId) {
      setNotice('Create a local lobby first.');
      return;
    }

    const playerNumber =
      presences.filter((presence) => presence.userId.startsWith('friend-')).length + 2;
    const friend = createLocalPresence(createLocalId('friend'), `Friend ${playerNumber}`);
    const nextPresences = [...presences, friend];

    setPresences(nextPresences);
    setPlayers((currentPlayers) => [
      ...currentPlayers,
      new MockPlayer({
        id: friend.userId,
        name: friend.username,
        role: 'guest',
        ready: true,
      }).toSnapshot(),
    ]);
    setReadyPlayerIds((currentReadyPlayerIds) => [
      ...currentReadyPlayerIds,
      friend.userId,
    ]);
    setCountdownStartedAt(null);
    setNotice(`${friend.username} joined locally.`);
  }, [authUser, hostUserId, match, mode, presences]);

  const selectGame = useCallback(
    async (gameId: PlayWithFriendsGameId) => {
      const game = getGameById(gameId);

      if (!game) {
        setNotice('Select a supported game.');
        return;
      }

      if (!isHost) {
        setNotice('Only the host can select games.');
        return;
      }

      setSelectedGameId(gameId);
      setActiveGameSession(null);
      const nextReadyPlayerIds =
        mode === 'local' ? readyPlayerIds.filter((id) => id !== hostUserId) : [];

      setReadyPlayerIds(nextReadyPlayerIds);
      setPlayers((currentPlayers) => applyReadyState(currentPlayers, nextReadyPlayerIds));
      setCountdownStartedAt(null);
      setNotice(`${game.name} selected.`);
      appendEvent(`Selected ${game.name}`);
      await broadcastLobbySnapshot({
        nextSelectedGameId: gameId,
        nextActiveGameId: null,
        nextReadyPlayerIds,
        nextCountdownStartedAt: null,
      });
    },
    [appendEvent, broadcastLobbySnapshot, hostUserId, isHost, mode, readyPlayerIds],
  );

  const toggleReady = useCallback(async () => {
    if (!authUser || !match) {
      setNotice('Join a lobby first.');
      return;
    }

    if (!activePlayerIds.includes(authUser.userId)) {
      setNotice('Only seated players need to ready up.');
      return;
    }

    const nextReadyPlayerIds = readyPlayerIds.includes(authUser.userId)
      ? readyPlayerIds.filter((playerId) => playerId !== authUser.userId)
      : [...readyPlayerIds, authUser.userId];

    setReadyPlayerIds(nextReadyPlayerIds);
    setCountdownStartedAt(null);
    setPlayers((currentPlayers) => applyReadyState(currentPlayers, nextReadyPlayerIds));
    setNotice(
      nextReadyPlayerIds.includes(authUser.userId)
        ? 'You are ready.'
        : 'You are no longer ready.',
    );
    appendEvent(
      `${authUser.username} ${
        nextReadyPlayerIds.includes(authUser.userId) ? 'ready' : 'not ready'
      }`,
    );
    await broadcastLobbySnapshot({
      nextReadyPlayerIds,
      nextCountdownStartedAt: null,
    });
  }, [
    activePlayerIds,
    appendEvent,
    authUser,
    broadcastLobbySnapshot,
    match,
    readyPlayerIds,
  ]);

  const startSelectedGame = useCallback(async () => {
    if (!authUser || !match) {
      setNotice('Join a lobby first.');
      return;
    }

    if (!startGate.canStart || !startGate.game) {
      setNotice(startGate.reason);
      return;
    }

    const session = createOnlineGameSession({
      sessionId: createLocalId('game'),
      gameId: startGate.game.id,
      activePlayerIds: startGate.activePlayerIds,
      spectatorPlayerIds: startGate.spectatorPlayerIds,
      startedAt: Date.now(),
    });
    const initialGameState = createInitialTicTacToeState(session.activePlayerIds);

    setActiveGameSession(session);
    setGameState(initialGameState);
    setCountdownStartedAt(null);
    countdownStartRequestedRef.current = false;
    setPhase('in-game');
    setNotice(`${startGate.game.name} started.`);
    appendEvent(`Started ${startGate.game.name}`);
    router.push(getPlayWithFriendsPath('game', startGate.game.id));

    if (mode === 'online' && adapterRef.current) {
      await adapterRef.current.adapter.broadcastAsync(
        createNakamaPeerMessage({
          type: 'game/start',
          senderId: authUser.userId,
          matchId: match.matchId,
          payload: {
            sessionId: session.id,
            gameId: session.gameId,
            hostUserId: hostUserId ?? authUser.userId,
            activePlayerIds: session.activePlayerIds,
            spectatorPlayerIds: session.spectatorPlayerIds,
            state: initialGameState,
          },
        }),
      );
    }
  }, [appendEvent, authUser, hostUserId, match, mode, router, startGate]);

  useEffect(() => {
    if (
      phase !== 'in-lobby' ||
      activeGameSession ||
      !isHost ||
      !startGate.canStart ||
      !allActivePlayersReady ||
      countdownStartedAt !== null
    ) {
      return;
    }

    const nextCountdownStartedAt = Date.now();
    setCountdownStartedAt(nextCountdownStartedAt);
    setNotice('All players ready. Starting soon.');
    void broadcastLobbySnapshot({
      nextCountdownStartedAt,
      nextReadyPlayerIds: readyPlayerIds,
    });
  }, [
    activeGameSession,
    allActivePlayersReady,
    broadcastLobbySnapshot,
    countdownStartedAt,
    isHost,
    phase,
    readyPlayerIds,
    startGate.canStart,
  ]);

  useEffect(() => {
    if (countdownStartedAt === null) {
      return undefined;
    }

    const interval = window.setInterval(() => {
      setCountdownNow(Date.now());
    }, 250);

    return () => window.clearInterval(interval);
  }, [countdownStartedAt]);

  useEffect(() => {
    if (
      countdownStartedAt === null ||
      countdownRemaining !== 0 ||
      !isHost ||
      countdownStartRequestedRef.current
    ) {
      return;
    }

    countdownStartRequestedRef.current = true;
    void startSelectedGame();
  }, [countdownRemaining, countdownStartedAt, isHost, startSelectedGame]);

  const publishGameState = useCallback(
    async (nextState: TicTacToeState, playerId: string, note: string) => {
      if (!activeGameSession || !runtimeRef.current) {
        setGameState(nextState);
        return;
      }

      await runtimeRef.current.runtime.publishState({
        playerId,
        sessionId: activeGameSession.id,
        state: nextState,
      });
      setNotice(note);
      appendEvent(note);
    },
    [activeGameSession, appendEvent],
  );

  const playCell = useCallback(
    async (cellIndex: number) => {
      if (!authUser || !activeGameSession) {
        setNotice('Start a game first.');
        return;
      }

      const playerId = mode === 'local' ? gameState.turnPlayerId : authUser.userId;
      const result = applyTicTacToeAction(gameState, {
        type: 'place-mark',
        playerId,
        cellIndex,
      });

      if (!result.accepted) {
        setNotice(result.reason);
        return;
      }

      await publishGameState(result.state, playerId, result.message);
    },
    [activeGameSession, authUser, gameState, mode, publishGameState],
  );

  const resetGame = useCallback(async () => {
    if (!authUser || !activeGameSession) {
      setNotice('Start a game first.');
      return;
    }

    const result = applyTicTacToeAction(gameState, {
      type: 'reset',
      activePlayerIds: activeGameSession.activePlayerIds,
    });

    if (!result.accepted) {
      setNotice(result.reason);
      return;
    }

    await publishGameState(result.state, authUser.userId, result.message);
  }, [activeGameSession, authUser, gameState, publishGameState]);

  const returnToLobby = useCallback(async () => {
    const nextReadyPlayerIds =
      mode === 'local' && hostUserId
        ? readyPlayerIds.filter((playerId) => playerId !== hostUserId)
        : [];

    setActiveGameSession(null);
    setGameState(createInitialTicTacToeState(activePlayerIds));
    setReadyPlayerIds(nextReadyPlayerIds);
    setPlayers((currentPlayers) => applyReadyState(currentPlayers, nextReadyPlayerIds));
    setCountdownStartedAt(null);
    setPhase(match ? 'in-lobby' : 'online');
    setNotice('Returned to lobby.');
    appendEvent('Returned to lobby');
    router.push(getPlayWithFriendsPath('lobby'));
    await broadcastLobbySnapshot({
      nextActiveGameId: null,
      nextActivePlayerIds: activePlayerIds,
      nextSpectatorPlayerIds: spectatorPlayerIds,
      nextReadyPlayerIds,
      nextCountdownStartedAt: null,
    });
  }, [
    activePlayerIds,
    appendEvent,
    broadcastLobbySnapshot,
    hostUserId,
    match,
    mode,
    readyPlayerIds,
    router,
    spectatorPlayerIds,
  ]);

  const leaveLobby = useCallback(async () => {
    if (mode === 'online' && authUser && match && adapterRef.current) {
      await adapterRef.current.adapter.broadcastAsync(
        createNakamaPeerMessage({
          type: 'lobby/player-left',
          senderId: authUser.userId,
          matchId: match.matchId,
          payload: { userId: authUser.userId },
        }),
      );
    }

    adapterRef.current?.adapter.leave();
    clearLobbyState({
      setMatch,
      setPresences,
      setPlayers,
      setHostUserId,
      setReadyPlayerIds,
      setCountdownStartedAt,
      setActiveGameSession,
      setGameState,
    });
    setJoinMatchId('');
    setPhase(authUser && mode === 'online' ? 'online' : 'idle');
    setNotice('Left lobby.');
    appendEvent('Left lobby');
    router.push(getPlayWithFriendsPath('entry'));
  }, [appendEvent, authUser, match, mode, router]);

  const disconnect = useCallback(() => {
    adapterRef.current?.cleanup();
    adapterRef.current = null;
    cleanupRuntime();
    clearLobbyState({
      setMatch,
      setPresences,
      setPlayers,
      setHostUserId,
      setReadyPlayerIds,
      setCountdownStartedAt,
      setActiveGameSession,
      setGameState,
    });
    setAuthUser(null);
    setJoinMatchId('');
    setPhase('idle');
    setNotice('Disconnected.');
    appendEvent('Disconnected');
    router.push(getPlayWithFriendsPath('entry'));
  }, [appendEvent, cleanupRuntime, router]);

  const copyMatchId = useCallback(async () => {
    if (!match || !navigator.clipboard) {
      return;
    }

    await navigator.clipboard.writeText(match.matchId);
    setNotice('Lobby id copied.');
  }, [match]);

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

    return () => {
      adapterRef.current?.cleanup();
      cleanupRuntime();
    };
  }, [cleanupRuntime]);

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
          message: 'Play With Friends console ready. Type help for commands.',
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

  function appendTerminalEntry(input: CreateNakamaTerminalEntryInput) {
    if (!isDeveloperToolsEnabled) {
      return;
    }

    setTerminalEntries((current) =>
      [...current, createNakamaTerminalEntry(input)].slice(-MAX_TERMINAL_ENTRIES),
    );
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
        message: `${mode} ${phase} ${endpoint}`,
        details: {
          user: authUser?.username ?? null,
          userId: authUser?.userId ? getShortId(authUser.userId) : null,
          matchId: match?.matchId ? getShortId(match.matchId) : null,
          route: activeGameSession?.gameId ?? 'lobby',
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
      void authenticateOnline();
      return;
    }

    appendTerminalEntry({
      level: 'error',
      source: 'terminal',
      message: command.message,
      details: { raw: command.raw },
    });
  }

  const contextValue = useMemo<PlayWithFriendsContextValue>(
    () => ({
      mode,
      setMode,
      phase,
      busy,
      notice,
      username,
      setUsername,
      matchName,
      setMatchName,
      joinMatchId,
      setJoinMatchId,
      config,
      setServerKey,
      setHost,
      setPort,
      setUseSSL,
      endpoint,
      authUser,
      match,
      presences,
      players,
      hostUserId,
      selectedGameId,
      selectedGame,
      activeGameSession,
      gameState,
      activePlayerIds,
      spectatorPlayerIds,
      readyPlayerIds,
      countdownRemaining,
      allActivePlayersReady,
      localMark,
      statusText,
      startGate,
      eventLog,
      isHost,
      canUseBoard,
      authenticateOnline,
      createOnlineLobby,
      joinOnlineLobby,
      createLocalLobby,
      addLocalPlayer,
      selectGame,
      toggleReady,
      startSelectedGame,
      playCell,
      resetGame,
      returnToLobby,
      leaveLobby,
      disconnect,
      copyMatchId,
    }),
    [
      activeGameSession,
      activePlayerIds,
      addLocalPlayer,
      allActivePlayersReady,
      authUser,
      authenticateOnline,
      busy,
      canUseBoard,
      config,
      countdownRemaining,
      copyMatchId,
      createLocalLobby,
      createOnlineLobby,
      disconnect,
      endpoint,
      eventLog,
      gameState,
      hostUserId,
      isHost,
      joinMatchId,
      joinOnlineLobby,
      leaveLobby,
      localMark,
      match,
      matchName,
      mode,
      notice,
      phase,
      playCell,
      players,
      presences,
      resetGame,
      readyPlayerIds,
      returnToLobby,
      selectGame,
      selectedGame,
      selectedGameId,
      spectatorPlayerIds,
      startGate,
      startSelectedGame,
      statusText,
      toggleReady,
      username,
    ],
  );

  return (
    <PlayWithFriendsContext.Provider value={contextValue}>
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
                  Play console
                </span>
                <label className={styles.developerSelect}>
                  <span>Info</span>
                  <select
                    value={activeDeveloperGroup.id}
                    onChange={(event) =>
                      setDeveloperGroupId(
                        event.target.value as NakamaDeveloperInfoGroup['id'],
                      )
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
                <section className={styles.terminalPanel} aria-label="Terminal output">
                  <div className={styles.terminalOutput} ref={terminalOutputRef}>
                    {terminalEntries.length ? (
                      terminalEntries.map((entry) => {
                        const details = formatTerminalDetails(entry.details);
                        const lineClassByLevel: Record<NakamaTerminalEntry['level'], string> =
                          {
                            debug: styles.terminalLineDebug,
                            error: styles.terminalLineError,
                            info: styles.terminalLineInfo,
                            input: styles.terminalLineInput,
                            success: styles.terminalLineSuccess,
                          };

                        return (
                          <div
                            key={entry.id}
                            className={`${styles.terminalLine} ${
                              lineClassByLevel[entry.level]
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
                  <form
                    className={styles.terminalCommandLine}
                    onSubmit={handleDeveloperCommand}
                  >
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

        <section className={styles.shell} aria-labelledby="play-with-friends-title">
          <header className={styles.header}>
            <div>
              <p className={styles.eyebrow}>Experiment</p>
              <h1 id="play-with-friends-title">Play With Friends</h1>
            </div>
            <div className={styles.statusStrip} aria-label="Connection status">
              <span className={styles.statusPill}>
                <FaWifi aria-hidden="true" />
                {mode === 'online' ? endpoint : 'local runtime'}
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

          {children}
        </section>
      </main>
    </PlayWithFriendsContext.Provider>
  );
}

function clearLobbyState({
  setMatch,
  setPresences,
  setPlayers,
  setHostUserId,
  setReadyPlayerIds,
  setCountdownStartedAt,
  setActiveGameSession,
  setGameState,
}: {
  setMatch: (match: NakamaMatchSnapshot | null) => void;
  setPresences: (presences: NakamaPresenceSummary[]) => void;
  setPlayers: (players: Player[]) => void;
  setHostUserId: (userId: string | null) => void;
  setReadyPlayerIds: (playerIds: string[]) => void;
  setCountdownStartedAt: (startedAt: number | null) => void;
  setActiveGameSession: (session: GameSession | null) => void;
  setGameState: (state: TicTacToeState) => void;
}) {
  setMatch(null);
  setPresences([]);
  setPlayers([]);
  setHostUserId(null);
  setReadyPlayerIds([]);
  setCountdownStartedAt(null);
  setActiveGameSession(null);
  setGameState(createInitialTicTacToeState([]));
}

async function broadcastRuntimeMessage(
  adapter: NakamaNetworkAdapter | null,
  user: NakamaAuthenticatedUser,
  match: NakamaMatchSnapshot,
  message: MultiplayerRuntimeMessage<TicTacToeAction, TicTacToeState>,
) {
  if (!adapter || message.kind !== 'state') {
    return;
  }

  await adapter.broadcastAsync(
    createNakamaPeerMessage({
      type: 'game/state',
      senderId: user.userId,
      matchId: match.matchId,
      payload: {
        game: 'tic-tac-toe',
        state: message.state,
        note: 'State synced.',
      } satisfies TicTacToeWirePayload,
    }),
  );
}

function getSeatPlayerIds(
  presences: NakamaPresenceSummary[],
  game: GameDefinition,
  hostUserId: string | null,
) {
  const sortedPlayerIds = getSortedNakamaSeatPlayerIds(presences, game.maxPlayers);

  if (!hostUserId || !sortedPlayerIds.includes(hostUserId)) {
    return sortedPlayerIds;
  }

  return [
    hostUserId,
    ...sortedPlayerIds.filter((playerId) => playerId !== hostUserId),
  ].slice(0, game.maxPlayers);
}

function describeGameStatus(
  state: TicTacToeState,
  presences: NakamaPresenceSummary[],
) {
  if (state.result.status === 'won') {
    return `${getPresenceName(presences, state.result.winnerPlayerId)} wins.`;
  }

  if (state.result.status === 'draw') {
    return 'Draw.';
  }

  if (state.players.filter((player) => player.playerId).length < 2) {
    return 'Waiting for two players.';
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

function createLocalId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function createLocalRoomCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

function createLocalPresence(userId: string, username: string): NakamaPresenceSummary {
  return {
    userId,
    sessionId: `session-${userId}`,
    username,
  };
}

function applyReadyState(players: Player[], readyPlayerIds: string[]) {
  const readyPlayerIdSet = new Set(readyPlayerIds);

  return players.map((player) => ({
    ...player,
    ready: readyPlayerIdSet.has(player.id),
  }));
}

function parsePresencePayload(payload: unknown): NakamaPresenceSummary | null {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  const candidate = payload as Partial<NakamaPresenceSummary> & {
    user_id?: unknown;
    session_id?: unknown;
  };
  const userId =
    typeof candidate.userId === 'string'
      ? candidate.userId
      : typeof candidate.user_id === 'string'
        ? candidate.user_id
        : '';
  const sessionId =
    typeof candidate.sessionId === 'string'
      ? candidate.sessionId
      : typeof candidate.session_id === 'string'
        ? candidate.session_id
        : '';

  if (!userId || !sessionId) {
    return null;
  }

  return {
    userId,
    sessionId,
    username: typeof candidate.username === 'string' ? candidate.username : 'Player',
  };
}

function parseUserIdPayload(payload: unknown) {
  if (!payload || typeof payload !== 'object') {
    return '';
  }

  const candidate = payload as { userId?: unknown; user_id?: unknown };

  return typeof candidate.userId === 'string'
    ? candidate.userId
    : typeof candidate.user_id === 'string'
      ? candidate.user_id
      : '';
}

function upsertPresence(
  presences: NakamaPresenceSummary[],
  nextPresence: NakamaPresenceSummary,
) {
  const existingIndex = presences.findIndex(
    (presence) => presence.sessionId === nextPresence.sessionId,
  );

  if (existingIndex < 0) {
    return [...presences, nextPresence];
  }

  return presences.map((presence, index) =>
    index === existingIndex ? nextPresence : presence,
  );
}

function getShortId(value: string | null | undefined) {
  if (!value) {
    return '-';
  }

  return value.length > 12 ? `${value.slice(0, 8)}...${value.slice(-4)}` : value;
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
