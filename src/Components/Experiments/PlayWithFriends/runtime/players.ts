import type { NakamaPresenceSummary } from '../network/nakamaLobby';
import type { Player, PlayerConnection, PlayerRole } from '../state/types';

export type PlayerRuntimeMode = 'local' | 'online';

export type MultiplayerPlayerInput = {
  id: string;
  name: string;
  role: PlayerRole;
  ready: boolean;
};

export type OnlinePlayerInput = MultiplayerPlayerInput & {
  sessionId: string;
  isLocalDevice: boolean;
};

export type CreateOnlinePlayerOptions = {
  hostUserId: string | null;
  localUserId: string | null;
};

export interface MultiplayerPlayer {
  readonly id: string;
  readonly name: string;
  readonly role: PlayerRole;
  readonly ready: boolean;
  readonly connection: PlayerConnection;
  readonly mode: PlayerRuntimeMode;
  canProvideInput(actorPlayerId: string | null, hostPlayerId?: string | null): boolean;
  isHost(): boolean;
  toSnapshot(): Player;
}

export abstract class BaseMultiplayerPlayer implements MultiplayerPlayer {
  abstract readonly connection: PlayerConnection;
  abstract readonly mode: PlayerRuntimeMode;

  readonly id: string;
  readonly name: string;
  readonly role: PlayerRole;
  readonly ready: boolean;

  protected constructor({ id, name, role, ready }: MultiplayerPlayerInput) {
    this.id = id;
    this.name = name;
    this.role = role;
    this.ready = ready;
  }

  abstract canProvideInput(
    actorPlayerId: string | null,
    hostPlayerId?: string | null,
  ): boolean;

  isHost() {
    return this.role === 'host';
  }

  toSnapshot(): Player {
    return {
      id: this.id,
      name: this.name,
      role: this.role,
      ready: this.ready,
      connection: this.connection,
    };
  }
}

export class LocalPlayer extends BaseMultiplayerPlayer {
  readonly connection = 'local';
  readonly mode = 'local';

  constructor(input: MultiplayerPlayerInput) {
    super(input);
  }

  canProvideInput(actorPlayerId: string | null) {
    return actorPlayerId === this.id;
  }
}

export class MockPlayer extends BaseMultiplayerPlayer {
  readonly connection = 'mock';
  readonly mode = 'local';

  constructor(input: MultiplayerPlayerInput) {
    super(input);
  }

  canProvideInput(actorPlayerId: string | null, hostPlayerId?: string | null) {
    return Boolean(hostPlayerId && actorPlayerId === hostPlayerId);
  }
}

export class OnlinePlayer extends BaseMultiplayerPlayer {
  readonly connection: PlayerConnection;
  readonly mode = 'online';
  readonly sessionId: string;
  readonly isLocalDevice: boolean;

  constructor(input: OnlinePlayerInput) {
    super(input);
    this.sessionId = input.sessionId;
    this.isLocalDevice = input.isLocalDevice;
    this.connection = input.isLocalDevice ? 'local' : 'remote';
  }

  canProvideInput(actorPlayerId: string | null) {
    return this.isLocalDevice && actorPlayerId === this.id;
  }
}

export function createOnlinePlayerFromPresence(
  presence: NakamaPresenceSummary,
  { hostUserId, localUserId }: CreateOnlinePlayerOptions,
) {
  return new OnlinePlayer({
    id: presence.userId,
    sessionId: presence.sessionId,
    name: presence.username,
    role: presence.userId === hostUserId ? 'host' : 'guest',
    ready: true,
    isLocalDevice: presence.userId === localUserId,
  });
}
