import { describe, expect, it } from 'vitest';

import { getGameModule, getRegisteredGameMetadata } from '.';

describe('Play With Friends game registry', () => {
  it('registers Tic Tac Toe as the only playable game module for this milestone', () => {
    expect(getGameModule('tic-tac-toe')?.metadata.status).toBe('playable');
    expect(getGameModule('connect-four')).toBeNull();
    expect(getGameModule('card-table')).toBeNull();
  });

  it('reports planned games without modules', () => {
    expect(getRegisteredGameMetadata()).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'connect-four',
          status: 'planned',
          moduleAvailable: false,
        }),
        expect.objectContaining({
          id: 'card-table',
          status: 'planned',
          moduleAvailable: false,
        }),
      ]),
    );
  });
});
