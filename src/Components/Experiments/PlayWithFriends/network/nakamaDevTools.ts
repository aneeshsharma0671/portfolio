import type {
  NakamaAuthenticatedUser,
  NakamaMatchSnapshot,
} from './NakamaNetworkAdapter';
import type { NakamaClientConfig } from './nakama';

export type NakamaDeveloperInfoItem = {
  label: string;
  value: string;
};

export type NakamaDeveloperInfoGroup = {
  id: 'connection' | 'account' | 'lobby' | 'game' | 'events';
  label: string;
  items: NakamaDeveloperInfoItem[];
};

export type CreateNakamaDeveloperInfoGroupsInput = {
  nodeEnv: string | undefined;
  endpoint: string;
  pageProtocol: string;
  pageHost: string;
  config: NakamaClientConfig;
  phase: string;
  busy: boolean;
  notice: string;
  authUser: NakamaAuthenticatedUser | null;
  match: NakamaMatchSnapshot | null;
  presenceCount: number;
  activePlayerIds: string[];
  localMark: string | null;
  gameStatus: string;
  eventCount: number;
};

type DebugLogger = (message: string, details?: unknown) => void;

const sensitiveKeyPattern = /(key|secret|token|password|deviceid|device_id)/i;
const terminalListeners = new Set<(entry: NakamaTerminalEntry) => void>();

export type NakamaTerminalEntryLevel = 'debug' | 'error' | 'input' | 'info' | 'success';

export type NakamaTerminalEntry = {
  id: string;
  at: number;
  level: NakamaTerminalEntryLevel;
  source: string;
  message: string;
  details?: unknown;
};

export type CreateNakamaTerminalEntryInput = Omit<NakamaTerminalEntry, 'at' | 'id'> & {
  at?: number;
  id?: string;
};

export type NakamaDeveloperCommand =
  | { type: 'clear' }
  | { type: 'connect' }
  | { type: 'help' }
  | { type: 'log'; message: string }
  | { type: 'status' }
  | { type: 'unknown'; raw: string; message: string };

export function isNakamaDevelopmentMode(nodeEnv = process.env.NODE_ENV) {
  return nodeEnv === 'development';
}

export function maskNakamaSecret(value: string | null | undefined) {
  return value && value.trim() ? 'set' : 'empty';
}

export function shortenNakamaDebugValue(value: string | null | undefined) {
  if (!value) {
    return '-';
  }

  return value.length > 20 ? `${value.slice(0, 8)}...${value.slice(-8)}` : value;
}

export function createSafeNakamaDebugPayload(input: unknown): unknown {
  if (Array.isArray(input)) {
    return input.map((item) => createSafeNakamaDebugPayload(item));
  }

  if (!input || typeof input !== 'object') {
    return input;
  }

  return Object.fromEntries(
    Object.entries(input).map(([key, value]) => [
      key,
      sensitiveKeyPattern.test(key)
        ? maskNakamaSecret(String(value ?? ''))
        : createSafeNakamaDebugPayload(value),
    ]),
  );
}

export function createNakamaTerminalEntry(
  input: CreateNakamaTerminalEntryInput,
  now = Date.now,
  createId = createNakamaTerminalEntryId,
): NakamaTerminalEntry {
  return {
    id: input.id ?? createId(),
    at: input.at ?? now(),
    level: input.level,
    source: input.source,
    message: input.message,
    details: input.details,
  };
}

export function subscribeNakamaDebugEvents(
  listener: (entry: NakamaTerminalEntry) => void,
) {
  terminalListeners.add(listener);

  return () => {
    terminalListeners.delete(listener);
  };
}

export function logNakamaDebugEvent(
  eventName: string,
  details?: Record<string, unknown>,
  nodeEnv = process.env.NODE_ENV,
  logger: DebugLogger = console.info,
) {
  if (!isNakamaDevelopmentMode(nodeEnv)) {
    return;
  }

  const safeDetails = createSafeNakamaDebugPayload(details ?? {});
  logger(`[Nakama] ${eventName}`, safeDetails);
  emitNakamaTerminalEntry(
    createNakamaTerminalEntry({
      level: eventName.includes('error') ? 'error' : 'debug',
      source: 'nakama',
      message: eventName,
      details: safeDetails,
    }),
  );
}

export function parseNakamaDeveloperCommand(input: string): NakamaDeveloperCommand | null {
  const trimmedInput = input.trim();

  if (!trimmedInput) {
    return null;
  }

  const [rawCommand = '', ...args] = trimmedInput.split(/\s+/);
  const command = rawCommand.toLowerCase();

  if (command === 'connect') {
    return { type: 'connect' };
  }

  if (command === 'clear') {
    return { type: 'clear' };
  }

  if (command === 'help' || command === '?') {
    return { type: 'help' };
  }

  if (command === 'status') {
    return { type: 'status' };
  }

  if (command === 'log') {
    return {
      type: 'log',
      message: args.join(' ').trim() || 'this',
    };
  }

  return {
    type: 'unknown',
    raw: trimmedInput,
    message: 'Unknown command. Type help for commands.',
  };
}

export function createNakamaDeveloperInfoGroups({
  nodeEnv,
  endpoint,
  pageProtocol,
  pageHost,
  config,
  phase,
  busy,
  notice,
  authUser,
  match,
  presenceCount,
  activePlayerIds,
  localMark,
  gameStatus,
  eventCount,
}: CreateNakamaDeveloperInfoGroupsInput): NakamaDeveloperInfoGroup[] {
  return [
    {
      id: 'connection',
      label: 'Connection',
      items: [
        { label: 'Mode', value: nodeEnv || 'unknown' },
        { label: 'Endpoint', value: endpoint },
        { label: 'Page', value: `${pageProtocol}//${pageHost}` },
        { label: 'Host', value: config.host || '-' },
        { label: 'Port', value: config.port || '-' },
        { label: 'SSL', value: config.useSSL ? 'on' : 'off' },
        { label: 'Server key', value: maskNakamaSecret(config.serverKey) },
      ],
    },
    {
      id: 'account',
      label: 'Account',
      items: [
        { label: 'Phase', value: phase },
        { label: 'Busy', value: busy ? 'yes' : 'no' },
        { label: 'Notice', value: notice || '-' },
        { label: 'Username', value: authUser?.username ?? '-' },
        { label: 'User id', value: shortenNakamaDebugValue(authUser?.userId) },
        { label: 'Created', value: authUser ? String(authUser.created) : '-' },
      ],
    },
    {
      id: 'lobby',
      label: 'Lobby',
      items: [
        { label: 'Match id', value: shortenNakamaDebugValue(match?.matchId) },
        { label: 'Room code', value: match?.roomCode ?? '-' },
        { label: 'Presences', value: String(presenceCount) },
        {
          label: 'Seats',
          value: activePlayerIds.map((id) => shortenNakamaDebugValue(id)).join(', ') || '-',
        },
      ],
    },
    {
      id: 'game',
      label: 'Game',
      items: [
        { label: 'Status', value: gameStatus },
        { label: 'Local mark', value: localMark ?? 'Spectator' },
      ],
    },
    {
      id: 'events',
      label: 'Events',
      items: [{ label: 'Event log', value: `${eventCount} entries` }],
    },
  ];
}

function emitNakamaTerminalEntry(entry: NakamaTerminalEntry) {
  terminalListeners.forEach((listener) => listener(entry));
}

function createNakamaTerminalEntryId() {
  return `nakama-terminal-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
