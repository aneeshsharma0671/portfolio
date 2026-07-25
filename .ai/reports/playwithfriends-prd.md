# Play With Friends PRD

Date: 2026-07-25
Owner: Codex implementation session
Status: Updated to match current routed Nakama implementation

## 1. Product Summary

Play With Friends is a portfolio experiment for quickly playing lightweight browser games with friends. The product opens directly into a usable multiplayer flow rather than a marketing page.

The current product shape is:

```text
Entry -> Lobby -> Active Game -> Lobby
```

The canonical route is:

```text
/experiments/playwithfriends
```

The current implementation supports local same-screen play and online Nakama-backed lobbies. Tic Tac Toe is the first playable game. Connect Four and Card Table are visible planned games.

## 2. Goals

- Provide a working staged multiplayer experience inside the portfolio site.
- Support online device authentication through Nakama.
- Support creating and joining Nakama match lobbies.
- Support local mode for same-screen development and demos.
- Keep lobby and game screens separate.
- Keep game logic independent from whether players are local or online.
- Represent players through shared player/runtime interfaces so games receive players and inputs consistently.
- Gate game start through host selection, seated players, ready state, and a visible countdown.
- Route active games to dedicated URLs under `/experiments/playwithfriends/games/[gameId]`.
- Keep developer-only debugging tools available in development without exposing sensitive config in the normal lobby UI.

## 3. Non-Goals

- Public matchmaking is not required.
- Rankings, profiles, social graphs, and durable player accounts are not required.
- Host migration is not required.
- Voice chat is not required.
- Direct WebRTC game transport is not required for the current release. Nakama is the active relay/state transport.
- A standalone landing page is not required.
- Connect Four and Card Table do not need to be playable in the current release.
- Server-authoritative game validation is not required in the current release, though it is a future security improvement.

## 4. Target Users

- Friends who want to quickly enter a browser lobby and play a simple game.
- The portfolio visitor who should understand the experiment by using it.
- The project owner, who needs an extensible playground for multiplayer game and networking experiments.

## 5. Current Routes

| Route | Purpose |
| --- | --- |
| `/experiments/playwithfriends` | Entry screen for mode selection, Nakama config, device login, and lobby create/join. |
| `/experiments/playwithfriends/lobby` | Joined lobby with players, ready flow, game selection, countdown, and leave/copy controls. |
| `/experiments/playwithfriends/games` | Redirects to `/experiments/playwithfriends/lobby`; games are selected in the lobby. |
| `/experiments/playwithfriends/games/[gameId]` | Dedicated active game screen. Currently renders Tic Tac Toe when the active session matches the route. |
| `/experiments/playwithfriends/nakama` | Redirects to `/experiments/playwithfriends`; the old test route is no longer canonical. |

The route subtree is wrapped by `PlayWithFriendsRouteShell`, so entry, lobby, and game pages share client state across navigation.

## 6. Current Product Surface

### 6.1 Entry Screen

The entry screen contains:

- Play mode selector:
  - Local play.
  - Online play.
- Local play action:
  - Create local lobby.
- Online account form:
  - Host.
  - Port.
  - Use SSL.
  - Username.
  - Create / login.
  - Disconnect.
- Online lobby actions:
  - Create lobby with optional match name.
  - Join lobby by match id.
- Identity display:
  - Username.
  - User id.

Server key requirements:

- The server key must not appear in the normal account/lobby form.
- The server key may be printed only through the development console command `server-key`.
- Production secrets other than the public Nakama server key must never be visible in client UI.

Acceptance criteria:

- A player can create or log in with a device identity.
- A player can create an online lobby after authentication.
- A player can join an online lobby by match id.
- A local player can create a local lobby without Nakama auth.
- The default production endpoint can be configured through build-time `NEXT_PUBLIC_NAKAMA_*` values.
- On HTTPS production pages, Nakama must be reached through HTTPS/WSS.

### 6.2 Lobby Screen

The lobby screen contains:

- Lobby id display.
- Copy lobby id button.
- Add local player button in local mode.
- Ready / Ready up button for the local seated player.
- Leave button.
- Player list with host/guest and connection labels.
- Game table with all registered games.
- Ready/countdown status.

Game selection requirements:

- Game selection lives in the lobby.
- Host can select a game.
- Guests can see the selected game but cannot change it.
- Planned games are visible but cannot start.
- The `/games` route redirects back to the lobby.

Ready and countdown requirements:

- Ready state applies to active seated players.
- The host is not allowed to start until selected game requirements are satisfied.
- When all active players are ready, the host starts a short countdown.
- When the countdown reaches zero, the host starts the selected game.
- Online clients receive a `game/start` message and navigate to the active game route.

Acceptance criteria:

- A joining player appears in the host lobby.
- A leaving player is removed from the lobby and ready state.
- Ready state changes are reflected for all lobby participants.
- Host game selection is reflected for all participants.
- Countdown is visible in the lobby before routing to the game.
- Extra connected players beyond the active seats are treated as spectators.

### 6.3 Active Game Screen

The active game screen contains:

- Active game title.
- Lobby button.
- Leave button.
- Status text.
- Local mark display.
- Game board.
- Rematch button.
- Player table with marks/seats/spectator labels.

Current Tic Tac Toe behavior:

- Two active players are assigned X and O.
- X starts.
- Players take alternating turns.
- Out-of-turn moves are rejected.
- Occupied cells cannot be overwritten.
- Wins and draws are detected.
- Rematch resets the board using the current active players.
- Online state changes are applied locally and broadcast to peers through Nakama match state.

Acceptance criteria:

- The game screen renders only when an active game session exists and matches the route game id.
- If no active session exists, the route shows a safe empty state with entry/lobby links.
- The actor who makes a move sees the move immediately.
- Peers receive the updated board state.
- Returning to lobby preserves the lobby and clears active game state.

## 7. Game Catalog

| Game | Id | Status | Players | Current behavior |
| --- | --- | --- | --- | --- |
| Tic Tac Toe | `tic-tac-toe` | Playable | 2 | Fully playable board game. |
| Connect Four | `connect-four` | Planned | 2 | Visible in lobby, not startable. |
| Card Table | `card-table` | Planned | 2-6 | Visible in lobby, not startable. |

## 8. Player And Input Model

Games should not need to know whether the transport is local or online.

Current player implementations:

- `LocalPlayer`: same-browser local player.
- `MockPlayer`: local dev/simulation player controlled by the host.
- `OnlinePlayer`: Nakama presence-backed player.

Current runtime implementations:

- `LocalMultiplayerRuntime`: emits local state/action messages in-process.
- `OnlineMultiplayerRuntime`: sends state/action messages through a transport and also applies locally published state to the local subscriber.

Requirements:

- Game input must be tied to the current active player.
- Spectators cannot make game moves.
- In online mode, only the local authenticated user can make their own move.
- In local mode, same-screen controls can play the current turn.

## 9. Networking Requirements

The active networking provider is Nakama.

Nakama responsibilities:

- Device authentication.
- Match creation and join.
- Presence tracking.
- Match-state relay for lobby and game messages.
- Console/dashboard for operational checks.

Message types:

- `lobby/snapshot`
- `lobby/player-joined`
- `lobby/player-left`
- `game/start`
- `game/action`
- `game/state`
- `system/ping`
- `system/pong`

Protocol requirements:

- Message ids are required and capped.
- Message types are allowlisted.
- Message payloads are capped at 16 KB.
- Duplicate message ids are ignored.
- Unknown or malformed messages are ignored and surfaced as non-fatal errors.
- Game actions and game state are validated by the active game logic before use where possible.

Production transport requirements:

- Browser clients on `https://thesharmaproject.com` must use HTTPS/WSS Nakama endpoints.
- Nakama should be exposed through the existing HTTPS reverse proxy.
- Public client config should use:

```text
NEXT_PUBLIC_NAKAMA_HOST=thesharmaproject.com
NEXT_PUBLIC_NAKAMA_PORT=443
NEXT_PUBLIC_NAKAMA_USE_SSL=true
```

- AWS security group should not expose Nakama HTTP, console, gRPC, or Postgres ports publicly once reverse proxying is active.

## 10. Security Requirements

Client-visible:

- `NEXT_PUBLIC_NAKAMA_SERVER_KEY` is a public Nakama client key. It can be embedded in client code but should not be shown in normal UI.

Must remain secret:

- `NAKAMA_POSTGRES_PASSWORD`
- `NAKAMA_SESSION_ENCRYPTION_KEY`
- `NAKAMA_SESSION_REFRESH_ENCRYPTION_KEY`
- `NAKAMA_RUNTIME_HTTP_KEY`
- `NAKAMA_CONSOLE_USERNAME`
- `NAKAMA_CONSOLE_PASSWORD`
- `SSH_KEY`

Developer console requirements:

- Developer console is enabled only in development.
- Developer console starts collapsed by default.
- Sensitive values in debug payloads are redacted.
- `server-key` command prints the configured Nakama server key only after explicit user command in the developer console.

Future security requirements:

- Add server-authoritative validation for game actions.
- Add rate limiting on public Nakama endpoints through the reverse proxy or infrastructure layer.
- Add abuse controls for anonymous device account creation.

## 11. Accessibility Requirements

- Inputs need labels.
- Icon-only controls need accessible labels.
- Game board cells must be buttons with stable names.
- Status and turn changes should be visible.
- Disabled controls should use real disabled states.
- Keyboard users must be able to authenticate, create/join lobby, ready up, select games where allowed, leave, and play moves.
- The UI must remain usable at mobile widths without overlapping text or controls.

## 12. Visual Design Requirements

- The first viewport must be the usable app, not a landing page.
- Layout should feel operational and compact.
- Cards/panels should be simple and scan-friendly.
- The game board should have stable dimensions.
- Lobby and game phases must be visually distinct.
- Developer tooling should not dominate the user experience and should remain collapsed by default.

## 13. Verification Requirements

Minimum commands:

```bash
pnpm test
pnpm run lint
pnpm exec next build
git diff --check
```

Expected automated coverage areas:

- Nakama client config.
- Nakama protocol parsing and validation.
- Developer console command parsing and secret redaction.
- Nakama lobby helpers.
- Multiplayer runtime behavior.
- Online flow routing/start helpers.
- Game registry.
- Tic Tac Toe engine.
- Lobby reducer/state helpers.

Manual browser checks:

- Entry page loads at `/experiments/playwithfriends`.
- Online create/login works against the configured Nakama endpoint.
- Online create lobby returns a match id.
- Second player can join by match id.
- Joined player appears on the host screen.
- Ready flow syncs across players.
- Host-selected game syncs across players.
- Countdown routes both players to `/experiments/playwithfriends/games/tic-tac-toe`.
- Tic Tac Toe moves update for the actor and peer.
- Rematch resets the board.
- Lobby button returns to lobby.
- Production HTTPS page makes only HTTPS/WSS Nakama calls.

## 14. Deployment Requirements

The deployed stack includes:

- Next.js web container.
- Nakama container.
- Nakama Postgres container.
- Nginx HTTPS reverse proxy on the host.

Deployment behavior:

- GitHub Actions builds the web image with `NEXT_PUBLIC_NAKAMA_*` values.
- Deployment writes `.env.production` on the server.
- Deployment pulls `web` and `nakama`.
- Deployment starts `nakama-postgres` with `--no-recreate`.
- Deployment force-recreates only `web` and `nakama`.
- Postgres data volume is preserved.

Operational access:

- Nakama console is bound to localhost and opened through SSH tunnel:

```bash
ssh -N -L 7351:127.0.0.1:7351 tspServer
```

## 15. Open Questions

- Should the game route support reconnecting to an existing Nakama match after page refresh?
- Should lobby ids be shortened or aliased for easier sharing?
- Should host-controlled seat assignment replace automatic seating?
- Should game state become server-authoritative through a Nakama runtime module?
- Should Connect Four or a card table be the next playable game?
- Should production rate limits be added at Nginx before wider sharing?

## 16. Recommended Next Milestone

Stabilize the current Nakama-backed MVP before adding more games:

- Add reconnect/resume behavior for refreshes.
- Add Nginx rate limiting for auth and match endpoints.
- Add server-authoritative validation for Tic Tac Toe.
- Add a shareable invite link or short room code.
- Add Connect Four once the lobby/game lifecycle is stable.
