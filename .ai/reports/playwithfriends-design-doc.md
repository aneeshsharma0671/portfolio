# Play With Friends Design Doc

Date: 2026-07-25
Owner: Codex implementation session
Status: Current implementation design

## 1. Overview

Play With Friends is implemented as a routed Next.js experiment with a persistent client-side shell. The shell owns multiplayer state, Nakama connection state, runtime abstractions, developer tooling, and navigation. Thin route pages render entry, lobby, and active game views through that shell.

High-level flow:

```text
Browser
  -> Next route subtree /experiments/playwithfriends
  -> PlayWithFriendsRouteShell
  -> Entry/Lobby/Game route view
  -> NakamaNetworkAdapter
  -> Nakama match state
  -> Other browser clients
```

## 2. Route Architecture

Files:

| File | Responsibility |
| --- | --- |
| `app/experiments/playwithfriends/layout.tsx` | Wraps the subtree in `PlayWithFriendsRouteShell`. |
| `app/experiments/playwithfriends/page.tsx` | Entry view. |
| `app/experiments/playwithfriends/lobby/page.tsx` | Lobby view. |
| `app/experiments/playwithfriends/games/page.tsx` | Redirects to lobby. |
| `app/experiments/playwithfriends/games/[gameId]/page.tsx` | Active game view; awaits dynamic route params. |
| `app/experiments/playwithfriends/nakama/page.tsx` | Redirects old test path to canonical entry. |

The route shell is a client component. It persists while navigating inside the route subtree, so lobby/game state is not lost when routing from lobby to game.

## 3. UI Composition

Main files:

- `PlayWithFriendsRouteShell.tsx`
- `PlayWithFriendsRouteViews.tsx`
- `NakamaLobbyTest.module.css`

Views:

- `PlayWithFriendsEntryView`
- `PlayWithFriendsLobbyView`
- `PlayWithFriendsGameView`
- `PlayWithFriendsGamesView` remains available but `/games` now redirects to lobby.

The entry view handles mode selection, Nakama endpoint config, device auth, and lobby create/join. The lobby view handles players, ready flow, selected game, countdown, and leave/copy actions. The game view handles active Tic Tac Toe play.

## 4. State Ownership

`PlayWithFriendsRouteShell` owns the active state:

- `mode`: `local` or `online`.
- `phase`: `idle`, `connecting`, `online`, `in-lobby`, or `in-game`.
- Nakama config: server key, host, port, SSL.
- User identity: username and `authUser`.
- Match state: `match`, `presences`, `players`, `hostUserId`.
- Lobby state: selected game, ready players, countdown.
- Game state: active game session and Tic Tac Toe state.
- Developer state: console visibility, terminal entries, active info group.

Refs mirror several state values so asynchronous Nakama event handlers can read current values without stale closure bugs:

- `authUserRef`
- `hostUserIdRef`
- `presencesRef`
- `readyPlayerIdsRef`
- `countdownStartedAtRef`
- `selectedGameIdRef`

## 5. Game Catalog And Game Logic

Game metadata lives in:

```text
src/Components/Experiments/PlayWithFriends/state/games.ts
```

Current catalog:

- `tic-tac-toe`: playable.
- `connect-four`: planned.
- `card-table`: planned.

Tic Tac Toe logic lives in:

```text
src/Components/Experiments/PlayWithFriends/games/ticTacToe/engine.ts
```

The engine is pure TypeScript:

- Creates initial state from active player ids.
- Assigns X/O.
- Validates moves.
- Applies moves.
- Detects win/draw.
- Resets board.

The current UI renders Tic Tac Toe directly from `PlayWithFriendsGameView`. The `GameModule` shape exists for future extraction to a fuller game registry renderer.

## 6. Player Model

Player implementations live in:

```text
src/Components/Experiments/PlayWithFriends/runtime/players.ts
```

Classes:

- `BaseMultiplayerPlayer`
- `LocalPlayer`
- `MockPlayer`
- `OnlinePlayer`

The game-facing snapshot is the shared `Player` type. This keeps game input semantics separate from transport details.

Current behavior:

- Local players are same-screen players.
- Mock players are local simulation players controlled by the host.
- Online players are derived from Nakama presences.
- Host is the creator or first known host from lobby snapshots.

## 7. Runtime Abstraction

Runtime implementations live in:

```text
src/Components/Experiments/PlayWithFriends/runtime/multiplayer.ts
```

Interface:

- `publishAction`
- `publishState`
- `onAction`
- `onState`
- `disconnect`

Implementations:

- `LocalMultiplayerRuntime`: emits messages in process.
- `OnlineMultiplayerRuntime`: sends messages through an injected transport and emits locally published state to the local subscriber.

Important behavior:

- Online state publishing is optimistic for the actor. The local player sees their move immediately, and peers receive the same state through Nakama.
- Games can use the same runtime interface for local and online play.

## 8. Nakama Adapter

Nakama integration lives in:

```text
src/Components/Experiments/PlayWithFriends/network/NakamaNetworkAdapter.ts
```

Responsibilities:

- Create Nakama JS client.
- Authenticate a device user.
- Open socket.
- Create/join matches.
- Leave/disconnect.
- Track self and remote presences.
- Send match state.
- Decode match state into peer messages.
- Deduplicate messages.
- Emit non-fatal errors.

The adapter implements the local `NetworkAdapter` shape so the shell is not tightly coupled to Nakama details.

## 9. Protocol

Protocol helpers live in:

```text
src/Components/Experiments/PlayWithFriends/network/protocol.ts
src/Components/Experiments/PlayWithFriends/network/nakama.ts
src/Components/Experiments/PlayWithFriends/network/nakamaLobby.ts
```

Envelope:

```ts
type PeerMessageEnvelope = {
  id: string;
  type: PeerMessageType;
  senderId: string;
  roomCode: string;
  version: number;
  sentAt: number;
  payload: unknown;
};
```

Allowed messages:

- `lobby/snapshot`
- `lobby/player-joined`
- `lobby/player-left`
- `game/start`
- `game/action`
- `game/state`
- `system/ping`
- `system/pong`

Validation:

- Max message size: 16 KB.
- Max id length: 64 characters.
- Allowlisted message types.
- Valid room code shape.
- Positive timestamp.
- Duplicate ids ignored.

## 10. Online Flow

### Authenticate

1. Entry view submits username.
2. Shell creates or reuses local browser Nakama device id.
3. `NakamaNetworkAdapter.authenticate` authenticates with device auth.
4. Adapter creates and connects the Nakama socket.
5. Shell stores `authUser` and sets phase to `online`.

### Create Lobby

1. Authenticated user creates a match.
2. Shell sets host to the local user.
3. Shell stores match and presences.
4. Shell configures online runtime.
5. Shell routes to `/experiments/playwithfriends/lobby`.

### Join Lobby

1. Authenticated user joins by match id.
2. Adapter stores match snapshot.
3. Shell broadcasts `lobby/player-joined`.
4. Host replies with `lobby/snapshot`.
5. Guest applies snapshot and routes to lobby.

### Ready And Start

1. Seated players toggle ready.
2. Shell broadcasts lobby snapshot with ready ids.
3. When all active players are ready, the host sets `countdownStartedAt`.
4. Countdown is broadcast to guests.
5. At zero, host creates a `GameSession`, creates initial Tic Tac Toe state, broadcasts `game/start`, and routes to `/experiments/playwithfriends/games/tic-tac-toe`.
6. Guests receive `game/start`, create local active session, apply game state, and route to the same game path.

### Game State

1. Player clicks a board cell.
2. Shell validates and applies the Tic Tac Toe action.
3. Runtime publishes the resulting state.
4. Online runtime emits the state locally, then sends `game/state` through Nakama.
5. Peers receive `game/state` and update their board.

## 11. Local Flow

Local mode uses the same shell and runtime interface:

1. Player selects local mode.
2. Player creates a local lobby.
3. Shell creates local host identity and local match snapshot.
4. Local players can be added as mock players.
5. Ready/game/countdown/game-state flow uses the same UI and runtime shape.

Local mode is useful for development and demos, but online Nakama mode is the production target.

## 12. Developer Console

Developer tooling is enabled only when `NODE_ENV === 'development'`.

Key files:

```text
src/Components/Experiments/PlayWithFriends/network/nakamaDevTools.ts
```

Behavior:

- Starts collapsed by default.
- Shows terminal entries and grouped connection/account/lobby/game/event info.
- Redacts sensitive values in debug payloads.
- Does not show the server key in normal UI.

Commands:

- `help`
- `connect`
- `status`
- `server-key`
- `log <message>`
- `clear`

`server-key` prints the current Nakama server key only after explicit command input.

## 13. Production Deployment

Runtime services:

- `web`: Next.js app on port 3000.
- `nakama`: Nakama server on port 7350.
- `nakama-postgres`: Postgres backing Nakama.

Compose file:

```text
docker-compose.yml
```

Deployment:

- GitHub Actions builds and pushes `web`.
- Deploy job uploads Compose and Nakama files.
- Server writes `.env.production`.
- `nakama-postgres` is kept stable with `--no-recreate`.
- `web` and `nakama` are force-recreated.

Production browser config:

```text
NEXT_PUBLIC_NAKAMA_HOST=thesharmaproject.com
NEXT_PUBLIC_NAKAMA_PORT=443
NEXT_PUBLIC_NAKAMA_USE_SSL=true
```

Nginx reverse proxy must route:

- `/v2/` to `http://127.0.0.1:7350/v2/`
- `/ws` to `http://127.0.0.1:7350/ws`

Security group policy:

- Public: 80, 443.
- SSH: user IP only.
- Closed publicly: 7350, 7351, 7349, 5433.

Nakama console is accessed through SSH tunnel:

```bash
ssh -N -L 7351:127.0.0.1:7351 tspServer
```

## 14. Error Handling

Current non-fatal error behavior:

- Invalid lobby snapshots are ignored with notice.
- Invalid player join/leave payloads are ignored with notice.
- Invalid game start payloads are ignored with notice.
- Invalid game state payloads are ignored with notice.
- Nakama socket and match-state errors are logged through developer tools in development.

Known limitation:

- Production player-facing error display is basic. More structured error states should be added before wider release.

## 15. Security Design

Public client value:

- `NEXT_PUBLIC_NAKAMA_SERVER_KEY`.

Private values:

- Postgres password.
- Nakama session encryption keys.
- Nakama runtime HTTP key.
- Nakama console credentials.
- SSH key.

Current client trust model:

- Client validates Tic Tac Toe actions locally.
- Peers trust broadcast state.
- This is acceptable for MVP but not cheat-resistant.

Future secure model:

- Move match/game validation into Nakama runtime server code.
- Clients send actions, not final state.
- Server validates turn order and produces authoritative state.
- Add rate limits at Nginx or Nakama edge.

## 16. Testing Strategy

Current command set:

```bash
pnpm test
pnpm run lint
pnpm exec next build
git diff --check
```

Current unit test coverage areas:

- Nakama config helpers.
- Developer console parsing/redaction.
- Nakama lobby helpers.
- Nakama protocol encode/decode.
- Multiplayer runtime.
- Online flow helpers.
- Game registry.
- Tic Tac Toe engine.
- Lobby state reducer/helpers.

Manual production checks:

- HTTPS page should call `https://thesharmaproject.com/v2/...`.
- Socket should connect through `wss://thesharmaproject.com/ws`.
- `/v2/` through HTTPS should reach Nakama and return a Nakama JSON response.
- Browser should not show mixed-content errors.

## 17. Known Gaps

- No reconnect after page refresh on a game route.
- No short invite links.
- No host migration.
- No server-authoritative game validation.
- No production rate limiting documented in repo config.
- Game UI is currently Tic Tac Toe specific rather than dynamically rendered through a full module registry.
- Old `NakamaLobbyTest.tsx` remains in the tree for compatibility/reference but is no longer the canonical route.

## 18. Next Design Iterations

Recommended sequence:

1. Add reconnect/resume from match id and route state.
2. Add invite links or short lobby ids.
3. Move Tic Tac Toe validation into Nakama runtime.
4. Replace Tic Tac Toe-specific game view with dynamic game module rendering.
5. Add Connect Four.
6. Add Nginx rate limiting and production observability notes.
