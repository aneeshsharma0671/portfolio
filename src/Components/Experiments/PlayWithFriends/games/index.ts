import type { GameRegistry, RegisteredGameModule } from '../bridge';
import { PLAY_WITH_FRIENDS_GAMES, type PlayWithFriendsGameId } from '../state';
import { ticTacToeModule } from './ticTacToe';

export const PLAY_WITH_FRIENDS_GAME_MODULES: GameRegistry = {
  'tic-tac-toe': ticTacToeModule as RegisteredGameModule,
};

export function getGameModule(gameId: PlayWithFriendsGameId) {
  return PLAY_WITH_FRIENDS_GAME_MODULES[gameId] ?? null;
}

export function getRegisteredGameMetadata() {
  return PLAY_WITH_FRIENDS_GAMES.map((game) => ({
    ...game,
    moduleAvailable: Boolean(getGameModule(game.id)),
  }));
}
