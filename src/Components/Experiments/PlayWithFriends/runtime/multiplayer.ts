import type { PlayerRuntimeMode } from './players';

export type MultiplayerActionMessage<TAction> = {
  kind: 'action';
  playerId: string;
  sessionId: string;
  action: TAction;
};

export type MultiplayerStateMessage<TState> = {
  kind: 'state';
  playerId: string;
  sessionId: string;
  state: TState;
};

export type MultiplayerRuntimeMessage<TAction, TState> =
  | MultiplayerActionMessage<TAction>
  | MultiplayerStateMessage<TState>;

export type PublishActionInput<TAction> = Omit<
  MultiplayerActionMessage<TAction>,
  'kind'
>;

export type PublishStateInput<TState> = Omit<MultiplayerStateMessage<TState>, 'kind'>;

export type MultiplayerMessageHandler<TMessage> = (message: TMessage) => void;

export type OnlineMultiplayerTransport<TAction, TState> = {
  send: (message: MultiplayerRuntimeMessage<TAction, TState>) => Promise<void>;
};

export interface MultiplayerRuntime<TAction, TState> {
  readonly mode: PlayerRuntimeMode;
  publishAction(message: PublishActionInput<TAction>): Promise<void>;
  publishState(message: PublishStateInput<TState>): Promise<void>;
  onAction(
    handler: MultiplayerMessageHandler<MultiplayerActionMessage<TAction>>,
  ): () => void;
  onState(
    handler: MultiplayerMessageHandler<MultiplayerStateMessage<TState>>,
  ): () => void;
  disconnect(): void;
}

export abstract class BaseMultiplayerRuntime<TAction, TState>
  implements MultiplayerRuntime<TAction, TState>
{
  abstract readonly mode: PlayerRuntimeMode;

  private readonly actionHandlers = new Set<
    MultiplayerMessageHandler<MultiplayerActionMessage<TAction>>
  >();
  private readonly stateHandlers = new Set<
    MultiplayerMessageHandler<MultiplayerStateMessage<TState>>
  >();

  abstract publishAction(message: PublishActionInput<TAction>): Promise<void>;
  abstract publishState(message: PublishStateInput<TState>): Promise<void>;

  onAction(handler: MultiplayerMessageHandler<MultiplayerActionMessage<TAction>>) {
    this.actionHandlers.add(handler);

    return () => {
      this.actionHandlers.delete(handler);
    };
  }

  onState(handler: MultiplayerMessageHandler<MultiplayerStateMessage<TState>>) {
    this.stateHandlers.add(handler);

    return () => {
      this.stateHandlers.delete(handler);
    };
  }

  disconnect() {
    this.actionHandlers.clear();
    this.stateHandlers.clear();
  }

  protected emit(message: MultiplayerRuntimeMessage<TAction, TState>) {
    if (message.kind === 'action') {
      this.actionHandlers.forEach((handler) => handler(message));
      return;
    }

    this.stateHandlers.forEach((handler) => handler(message));
  }
}

export class LocalMultiplayerRuntime<TAction, TState> extends BaseMultiplayerRuntime<
  TAction,
  TState
> {
  readonly mode = 'local';

  async publishAction(message: PublishActionInput<TAction>) {
    this.emit({ kind: 'action', ...message });
  }

  async publishState(message: PublishStateInput<TState>) {
    this.emit({ kind: 'state', ...message });
  }
}

export class OnlineMultiplayerRuntime<TAction, TState> extends BaseMultiplayerRuntime<
  TAction,
  TState
> {
  readonly mode = 'online';

  constructor(private readonly transport: OnlineMultiplayerTransport<TAction, TState>) {
    super();
  }

  async publishAction(message: PublishActionInput<TAction>) {
    await this.transport.send({ kind: 'action', ...message });
  }

  async publishState(message: PublishStateInput<TState>) {
    const stateMessage: MultiplayerStateMessage<TState> = { kind: 'state', ...message };

    this.emit(stateMessage);
    await this.transport.send(stateMessage);
  }

  receive(message: MultiplayerRuntimeMessage<TAction, TState>) {
    this.emit(message);
  }
}
