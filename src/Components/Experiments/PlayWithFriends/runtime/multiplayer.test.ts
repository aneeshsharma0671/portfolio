import { describe, expect, it } from 'vitest';

import {
  LocalMultiplayerRuntime,
  OnlineMultiplayerRuntime,
  type MultiplayerRuntime,
} from './multiplayer';

type TestAction = { type: 'place-mark'; cellIndex: number };
type TestState = { board: string[] };

describe('Play With Friends multiplayer runtime', () => {
  it('lets games publish actions through the same interface in local and online modes', async () => {
    const sentMessages: unknown[] = [];
    const runtimes: MultiplayerRuntime<TestAction, TestState>[] = [
      new LocalMultiplayerRuntime<TestAction, TestState>(),
      new OnlineMultiplayerRuntime<TestAction, TestState>({
        send: async (message) => {
          sentMessages.push(message);
        },
      }),
    ];

    await Promise.all(
      runtimes.map((runtime) =>
        runtime.publishAction({
          playerId: 'player-1',
          sessionId: 'session-1',
          action: { type: 'place-mark', cellIndex: 4 },
        }),
      ),
    );

    expect(sentMessages).toEqual([
      {
        kind: 'action',
        playerId: 'player-1',
        sessionId: 'session-1',
        action: { type: 'place-mark', cellIndex: 4 },
      },
    ]);
  });

  it('loops local actions to subscribers without transport-specific code', async () => {
    const runtime = new LocalMultiplayerRuntime<TestAction, TestState>();
    const actions: TestAction[] = [];

    runtime.onAction((message) => actions.push(message.action));

    await runtime.publishAction({
      playerId: 'player-1',
      sessionId: 'session-1',
      action: { type: 'place-mark', cellIndex: 2 },
    });

    expect(actions).toEqual([{ type: 'place-mark', cellIndex: 2 }]);
  });

  it('lets online transports feed received state into the same runtime listeners', () => {
    const runtime = new OnlineMultiplayerRuntime<TestAction, TestState>({
      send: async () => undefined,
    });
    const states: TestState[] = [];

    runtime.onState((message) => states.push(message.state));
    runtime.receive({
      kind: 'state',
      playerId: 'host-1',
      sessionId: 'session-1',
      state: { board: ['X'] },
    });

    expect(states).toEqual([{ board: ['X'] }]);
  });

  it('applies published online state locally while sending it to peers', async () => {
    const sentMessages: unknown[] = [];
    const runtime = new OnlineMultiplayerRuntime<TestAction, TestState>({
      send: async (message) => {
        sentMessages.push(message);
      },
    });
    const states: TestState[] = [];

    runtime.onState((message) => states.push(message.state));

    await runtime.publishState({
      playerId: 'player-1',
      sessionId: 'session-1',
      state: { board: ['X'] },
    });

    expect(states).toEqual([{ board: ['X'] }]);
    expect(sentMessages).toEqual([
      {
        kind: 'state',
        playerId: 'player-1',
        sessionId: 'session-1',
        state: { board: ['X'] },
      },
    ]);
  });
});
