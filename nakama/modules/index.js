/* eslint-disable @typescript-eslint/no-unused-vars */

var playWithFriendsHealthRpc = function (ctx, logger, nk, payload) {
  return JSON.stringify({
    ok: true,
    module: 'playwithfriends',
    runtimeVersion: 1
  });
};

function InitModule(ctx, logger, nk, initializer) {
  initializer.registerRpc('playwithfriends_health', playWithFriendsHealthRpc);
  logger.info('Play With Friends Nakama runtime loaded.');
}
