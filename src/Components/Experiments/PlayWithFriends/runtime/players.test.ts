import { describe, expect, it } from 'vitest';

import {
  LocalPlayer,
  MockPlayer,
  OnlinePlayer,
  createOnlinePlayerFromPresence,
  type MultiplayerPlayer,
} from './players';

describe('Play With Friends player models', () => {
  it('keeps local and online players behind the same player interface', () => {
    const players: MultiplayerPlayer[] = [
      new LocalPlayer({
        id: 'local-1',
        name: 'Local',
        role: 'host',
        ready: true,
      }),
      new OnlinePlayer({
        id: 'online-1',
        sessionId: 'session-1',
        name: 'Online',
        role: 'guest',
        ready: true,
        isLocalDevice: false,
      }),
    ];

    expect(players.map((player) => player.toSnapshot())).toEqual([
      {
        id: 'local-1',
        name: 'Local',
        role: 'host',
        ready: true,
        connection: 'local',
      },
      {
        id: 'online-1',
        name: 'Online',
        role: 'guest',
        ready: true,
        connection: 'remote',
      },
    ]);
  });

  it('models host-controlled mock players separately from real local players', () => {
    const mockPlayer = new MockPlayer({
      id: 'mock-1',
      name: 'Friend',
      role: 'guest',
      ready: false,
    });

    expect(mockPlayer.toSnapshot()).toMatchObject({
      id: 'mock-1',
      connection: 'mock',
    });
    expect(mockPlayer.canProvideInput('host-1', 'host-1')).toBe(true);
    expect(mockPlayer.canProvideInput('guest-1', 'host-1')).toBe(false);
  });

  it('allows input only from the current browser player for real players', () => {
    const localPlayer = new LocalPlayer({
      id: 'local-1',
      name: 'Local',
      role: 'host',
      ready: true,
    });
    const localOnlinePlayer = new OnlinePlayer({
      id: 'online-local',
      sessionId: 'session-local',
      name: 'Me',
      role: 'guest',
      ready: true,
      isLocalDevice: true,
    });
    const remoteOnlinePlayer = new OnlinePlayer({
      id: 'online-remote',
      sessionId: 'session-remote',
      name: 'Them',
      role: 'guest',
      ready: true,
      isLocalDevice: false,
    });

    expect(localPlayer.canProvideInput('local-1')).toBe(true);
    expect(localPlayer.canProvideInput('other')).toBe(false);
    expect(localOnlinePlayer.canProvideInput('online-local')).toBe(true);
    expect(remoteOnlinePlayer.canProvideInput('online-remote')).toBe(false);
  });

  it('creates online players directly from Nakama presences', () => {
    expect(
      createOnlinePlayerFromPresence(
        {
          userId: 'user-1',
          sessionId: 'session-1',
          username: 'Aneesh',
        },
        {
          hostUserId: 'user-1',
          localUserId: 'other-user',
        },
      ).toSnapshot(),
    ).toEqual({
      id: 'user-1',
      name: 'Aneesh',
      role: 'host',
      ready: true,
      connection: 'remote',
    });
  });
});
