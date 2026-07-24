import {
  parsePeerMessage,
  serializePeerMessage,
  type PeerMessageEnvelope,
  type ProtocolParseResult,
} from './protocol';

export const NAKAMA_MATCH_STATE_OP_CODES = {
  peerMessage: 1,
} as const;

export type NakamaClientEnvironment = Record<string, string | undefined>;

export type NakamaClientConfig = {
  serverKey: string;
  host: string;
  port: string;
  useSSL: boolean;
};

export function createNakamaClientConfig(
  env: NakamaClientEnvironment,
): NakamaClientConfig {
  return {
    serverKey: env.NEXT_PUBLIC_NAKAMA_SERVER_KEY || 'local-nakama-server-key',
    host: env.NEXT_PUBLIC_NAKAMA_HOST || '127.0.0.1',
    port: env.NEXT_PUBLIC_NAKAMA_PORT || '7350',
    useSSL: parseBooleanEnv(env.NEXT_PUBLIC_NAKAMA_USE_SSL),
  };
}

export function encodeNakamaPeerMessage(message: PeerMessageEnvelope) {
  return serializePeerMessage(message);
}

export function decodeNakamaPeerMessage(
  payload: string,
  seenMessageIds?: Set<string>,
): ProtocolParseResult {
  return parsePeerMessage(payload, seenMessageIds);
}

function parseBooleanEnv(value: string | undefined) {
  return value === '1' || value === 'true';
}
