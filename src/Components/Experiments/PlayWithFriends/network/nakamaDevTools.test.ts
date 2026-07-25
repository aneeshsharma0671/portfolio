import { describe, expect, it, vi } from 'vitest';

import {
  createNakamaDeveloperInfoGroups,
  createSafeNakamaDebugPayload,
  createNakamaTerminalEntry,
  isNakamaDevelopmentMode,
  logNakamaDebugEvent,
  maskNakamaSecret,
  parseNakamaDeveloperCommand,
  shortenNakamaDebugValue,
  subscribeNakamaDebugEvents,
} from './nakamaDevTools';

describe('Nakama developer tools helpers', () => {
  it('only enables developer tools in development mode', () => {
    expect(isNakamaDevelopmentMode('development')).toBe(true);
    expect(isNakamaDevelopmentMode('production')).toBe(false);
    expect(isNakamaDevelopmentMode('test')).toBe(false);
  });

  it('redacts sensitive values for console output and developer info', () => {
    expect(maskNakamaSecret('')).toBe('empty');
    expect(maskNakamaSecret('secret-server-key')).toBe('set');
    expect(
      createSafeNakamaDebugPayload({
        host: '3.108.212.210',
        serverKey: 'secret-server-key',
        refresh_token: 'refresh-token',
        nested: { password: 'password', matchId: 'match-1' },
      }),
    ).toEqual({
      host: '3.108.212.210',
      serverKey: 'set',
      refresh_token: 'set',
      nested: {
        password: 'set',
        matchId: 'match-1',
      },
    });
  });

  it('shortens long ids without hiding useful identity context', () => {
    expect(shortenNakamaDebugValue('short')).toBe('short');
    expect(shortenNakamaDebugValue('1234567890abcdefghijklmnop')).toBe(
      '12345678...ijklmnop',
    );
  });

  it('logs structured debug events only in development', () => {
    const logger = vi.fn();

    logNakamaDebugEvent('auth:start', { deviceId: 'device-1' }, 'production', logger);
    expect(logger).not.toHaveBeenCalled();

    logNakamaDebugEvent('auth:start', { deviceId: 'device-1' }, 'development', logger);
    expect(logger).toHaveBeenCalledWith('[Nakama] auth:start', {
      deviceId: 'set',
    });
  });

  it('emits redacted terminal entries for development debug events', () => {
    const listener = vi.fn();
    const unsubscribe = subscribeNakamaDebugEvents(listener);

    logNakamaDebugEvent(
      'auth:start',
      { deviceId: 'device-1', host: '3.108.212.210' },
      'development',
      vi.fn(),
    );
    unsubscribe();

    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({
        level: 'debug',
        source: 'nakama',
        message: 'auth:start',
        details: {
          deviceId: 'set',
          host: '3.108.212.210',
        },
      }),
    );
  });

  it('creates terminal entries with stable ids when supplied', () => {
    expect(
      createNakamaTerminalEntry(
        {
          level: 'input',
          source: 'user',
          message: 'connect',
        },
        () => 1000,
        () => 'entry-1',
      ),
    ).toEqual({
      id: 'entry-1',
      at: 1000,
      level: 'input',
      source: 'user',
      message: 'connect',
      details: undefined,
    });
  });

  it('parses developer terminal commands', () => {
    expect(parseNakamaDeveloperCommand('connect')).toEqual({ type: 'connect' });
    expect(parseNakamaDeveloperCommand('log this')).toEqual({
      type: 'log',
      message: 'this',
    });
    expect(parseNakamaDeveloperCommand('status')).toEqual({ type: 'status' });
    expect(parseNakamaDeveloperCommand('clear')).toEqual({ type: 'clear' });
    expect(parseNakamaDeveloperCommand('help')).toEqual({ type: 'help' });
    expect(parseNakamaDeveloperCommand('wat')).toEqual({
      type: 'unknown',
      raw: 'wat',
      message: 'Unknown command. Type help for commands.',
    });
  });

  it('creates grouped developer panel info without exposing the server key', () => {
    const groups = createNakamaDeveloperInfoGroups({
      nodeEnv: 'development',
      endpoint: 'http/ws://3.108.212.210:7350',
      pageProtocol: 'http:',
      pageHost: '3.108.212.210',
      config: {
        serverKey: 'secret-server-key',
        host: '3.108.212.210',
        port: '7350',
        useSSL: false,
      },
      phase: 'in-match',
      busy: false,
      notice: 'Lobby joined.',
      authUser: {
        userId: 'user-1234567890abcdefghijklmnop',
        username: 'Aneesh',
        created: false,
      },
      match: {
        matchId: 'match-1234567890abcdefghijklmnop',
        roomCode: 'MATCH123',
        self: null,
        presences: [],
      },
      presenceCount: 2,
      activePlayerIds: ['user-a', 'user-b'],
      localMark: 'X',
      gameStatus: 'Aneesh to move.',
      eventCount: 4,
    });

    expect(groups.map((group) => group.id)).toEqual([
      'connection',
      'account',
      'lobby',
      'game',
      'events',
    ]);
    expect(groups[0].items).toContainEqual({ label: 'Server key', value: 'set' });
    expect(JSON.stringify(groups)).not.toContain('secret-server-key');
  });
});
