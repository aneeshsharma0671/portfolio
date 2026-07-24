import type { GameDefinition, PlayWithFriendsGameId } from './types';

export const PLAY_WITH_FRIENDS_GAMES: GameDefinition[] = [
  {
    id: 'tic-tac-toe',
    name: 'Tic Tac Toe',
    minPlayers: 2,
    maxPlayers: 2,
    status: 'playable',
    description: 'Turn based board game bridge target.',
  },
  {
    id: 'connect-four',
    name: 'Connect Four',
    minPlayers: 2,
    maxPlayers: 2,
    status: 'planned',
    description: 'Next deterministic board game candidate.',
  },
  {
    id: 'card-table',
    name: 'Card Table',
    minPlayers: 2,
    maxPlayers: 6,
    status: 'planned',
    description: 'Shared table shell for future card games.',
  },
];

export function getGameById(
  gameId: PlayWithFriendsGameId,
  games: GameDefinition[] = PLAY_WITH_FRIENDS_GAMES,
) {
  return games.find((game) => game.id === gameId);
}
