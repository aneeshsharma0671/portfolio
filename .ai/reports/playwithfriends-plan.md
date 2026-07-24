# Play With Friends Experiment Plan

> Current milestone note: `.ai/reports/playwithfriends-prd.md` is now the source of truth for the first implementation pass. The WebRTC/manual-signaling phases and verification items in this older plan are future-only until a later networking milestone explicitly reopens them. First implementation scope is local mock adapter only, Tic Tac Toe playable, Connect Four/Card Table planned, no new networking dependencies.

## Goal

Create a browser-based multiplayer games experiment at `/experiment/playwithfriends` where one player hosts a lobby, friends join the lobby, and the group can launch different web games through a shared peer-to-peer networking layer.

The route root should be the lobby, not a marketing page. Players should land directly in the host/join experience, see connected friends, pick a game, and start playing.

## Route Decision

Requested route:

- `app/experiment/playwithfriends/page.tsx`

Existing repo convention:

- Current experiments use plural routes under `app/experiments/*`, for example `/experiments/ask-out-for-date`.

Recommended implementation:

- Create the requested exact route at `/experiment/playwithfriends`.
- Optionally add `/experiments/playwithfriends` as an alias or redirect later if the experiment list expects plural URLs.
- Keep the feature source under `src/Components/Experiments/PlayWithFriends/` to match the existing component organization.

## Product Shape

### Lobby Root

The root page should show a compact multiplayer control surface:

- Player name entry.
- Host lobby action.
- Join lobby action.
- Invite/share area once hosting.
- Connected players list.
- Connection health indicators.
- Game picker.
- Start game action available to host.
- Current game panel once a game starts.

The first version should feel like a functional tool. Avoid a landing-page hero because the primary value is immediate lobby creation and game play.

### Player Roles

- Host creates the lobby and becomes authoritative for lobby state.
- Guests connect to the host over peer-to-peer channels.
- Host selects and starts games.
- Guests can ready up and interact inside the active game.
- If the host leaves, MVP can end the lobby instead of attempting host migration.

## Networking Reality Check

The desired architecture says “no external servers, one player acts as host.” That is achievable for game-state transport after peers connect, but browser peers still need a signaling path before a WebRTC connection can be formed.

Important browser limitation:

- A normal browser tab cannot act as a public WebSocket or HTTP server for friends on the internet.
- WebRTC peers must exchange offers, answers, and ICE candidates through some signaling mechanism before direct data channels are available.
- NAT traversal often needs STUN, and difficult networks need TURN. TURN is a relay server, so it violates strict peer-to-peer.

Recommended MVP interpretation:

- No custom backend owned by this project.
- WebRTC DataChannels carry lobby and game messages peer-to-peer after connection.
- Manual signaling is used for MVP: host copies an invite payload, guest pastes it, guest copies a response payload, host pastes it.
- Public STUN can be configurable, but strict “zero external infrastructure” mode should also exist and document that internet connections may fail outside local networks.

Future UX options:

- Add an optional ephemeral signaling service only for connection setup.
- Support QR-code exchange for in-person play.
- Support LAN-only discovery if a future runtime permits it.
- Support TURN only as an explicit reliability tradeoff, not as the default if strict peer-to-peer is the goal.

## Technical Architecture

### Layers

```text
PlayWithFriendsRoute
  -> Lobby UI
  -> Lobby state manager
  -> Peer network adapter
  -> Game registry
  -> Active game shell
      -> Game bridge adapter
      -> Game implementation
```

### Proposed File Structure

```text
app/
  experiment/
    playwithfriends/
      page.tsx

src/
  Components/
    Experiments/
      PlayWithFriends/
        index.tsx
        PlayWithFriends.module.css
        components/
          LobbyPanel.tsx
          PlayerList.tsx
          InviteExchange.tsx
          GamePicker.tsx
          GameShell.tsx
        games/
          index.ts
          ticTacToe/
            TicTacToeGame.tsx
            engine.ts
            metadata.ts
        network/
          PeerNetwork.ts
          manualSignaling.ts
          protocol.ts
        bridge/
          GameBridge.ts
          types.ts
        state/
          lobbyReducer.ts
          lobbyTypes.ts
```

Keep the route file thin, similar to `app/experiments/ask-out-for-date/page.tsx`, and put client-side behavior in `src/Components/Experiments/PlayWithFriends/index.tsx`.

## Shared Game Bridge

Each game can use its own renderer or engine, but it should talk to the lobby through one bridge interface.

### Game Metadata

```ts
export type GameMetadata = {
  id: string;
  name: string;
  minPlayers: number;
  maxPlayers: number;
  description: string;
};
```

### Game Module Contract

```ts
export type GameModule<TState, TAction> = {
  metadata: GameMetadata;
  createInitialState: (players: LobbyPlayer[]) => TState;
  reduceAction: (state: TState, action: TAction) => TState;
  validateAction: (state: TState, action: TAction, playerId: string) => boolean;
  Component: React.ComponentType<GameComponentProps<TState, TAction>>;
};
```

### Runtime Bridge

```ts
export type GameBridge<TState, TAction> = {
  localPlayerId: string;
  players: LobbyPlayer[];
  state: TState;
  isHost: boolean;
  sendAction: (action: TAction) => void;
  onStateSnapshot: (state: TState) => void;
};
```

Host-authoritative mode should be the MVP:

- Guests send game actions to host.
- Host validates actions through the active game module.
- Host updates canonical state.
- Host broadcasts state snapshots or accepted actions.
- Guests render from host-approved state.

This keeps board games deterministic and reduces cheating/consistency bugs for the first release.

## Network Protocol

Use typed messages across all peers.

```ts
export type PeerMessage =
  | { type: 'lobby/player-joined'; player: LobbyPlayer }
  | { type: 'lobby/player-left'; playerId: string }
  | { type: 'lobby/snapshot'; lobby: LobbySnapshot }
  | { type: 'game/select'; gameId: string }
  | { type: 'game/start'; gameId: string; seed: string; players: LobbyPlayer[] }
  | { type: 'game/action'; gameId: string; actionId: string; playerId: string; payload: unknown }
  | { type: 'game/state'; gameId: string; version: number; payload: unknown }
  | { type: 'system/ping'; sentAt: number }
  | { type: 'system/pong'; sentAt: number; receivedAt: number };
```

Protocol rules:

- Every player gets a generated `playerId`.
- Every game action gets an `actionId` for deduplication.
- Host maintains monotonically increasing lobby and game state versions.
- Unknown message types are ignored and surfaced in debug UI.
- Payloads are validated before being applied.

## MVP Game

Start with a simple deterministic board game to prove the bridge:

- Tic-tac-toe is the lowest-risk first game.
- It has a tiny action space.
- It exposes turn order, win/draw state, rematch, and player assignment.
- It does not need timers, physics, hidden information, or simultaneous actions.

After the bridge is stable, add games with gradually more complexity:

- Connect Four.
- Checkers.
- Card table prototype.
- Real-time lightweight game only after board-game sync is solid.

## UI Plan

### Lobby States

- Idle: enter display name and choose host or join.
- Hosting setup: show local offer/invite text and instructions for guest response.
- Joining setup: paste host invite and generate response.
- Connected lobby: show players, ready states, game picker, start button.
- In game: show game shell, player list, connection status, leave lobby.
- Disconnected: show reason and reset/reconnect actions.

### Visual Direction

- Dense, practical interface with clear panels for lobby, players, and game.
- Use CSS Modules for new styles.
- Use existing repo typography and global layout constraints where possible.
- Use icon buttons where controls are tool-like, especially copy, paste, refresh, leave, and settings.
- Avoid decorative card stacks and oversized marketing sections.

## State Management

Use a reducer for lobby state because networking events, local UI actions, and game state transitions will converge in one place.

Core state:

- Local player.
- Host player id.
- Connected peers.
- Lobby status.
- Invite/signaling state.
- Selected game id.
- Active game id.
- Active game state version.
- Connection health.
- Last error.

Avoid global app-level state until the experiment needs to survive route changes.

## Persistence

MVP should avoid durable persistence.

Use `sessionStorage` only for convenience:

- Last display name.
- Last selected local settings.
- In-progress manual signaling text while the page is open.

Do not persist lobby data, game history, or peer identifiers across browser sessions for the first version.

## Security And Privacy

- Treat all peer messages as untrusted input.
- Validate message shape and game actions before applying them.
- Cap payload size to avoid UI freezes from pasted or received data.
- Do not expose IP addresses or raw ICE details in normal UI.
- Do not add analytics or third-party tracking.
- Do not store personal data beyond local display name convenience.
- Use clear copy that connection data is shared directly with invited peers.

## Implementation Phases

### Phase 1: Static Route And Lobby UI

- Add `/experiment/playwithfriends`.
- Build lobby shell with idle, host, join, connected, and in-game placeholders.
- Add local-only reducer and mock player list.
- Add responsive CSS Module styles.
- Verify with `npm run build`.

### Phase 2: Bridge And Game Registry

- Define lobby, network, protocol, and game bridge types.
- Add game registry.
- Implement Tic-tac-toe as the first game module.
- Wire local single-browser host mode to the game bridge.
- Verify game actions and reducer behavior manually.

### Phase 3: WebRTC Peer Layer

- Implement `PeerNetwork` around `RTCPeerConnection` and `RTCDataChannel`.
- Implement manual offer/answer exchange.
- Add message serialization, parsing, validation, action ids, and version checks.
- Connect two browser windows on the same machine.

### Phase 4: Host-Authoritative Multiplayer

- Route guest actions to host.
- Broadcast lobby snapshots and game snapshots.
- Add ready state and start-game gating.
- Handle disconnects and host-ended lobby.
- Test with multiple tabs and at least two separate browsers.

### Phase 5: UX Hardening

- Add copy/share affordances.
- Add QR-code signaling if a dependency is acceptable.
- Add reconnect/error states.
- Add settings for strict local-only versus STUN-assisted connection attempts.
- Add `/experiments/playwithfriends` alias if needed.

## Verification Plan

Minimum repo verification:

```bash
npm run build
npm run lint
```

Manual browser checks:

- Route loads at `/experiment/playwithfriends`.
- Host can create a lobby.
- Guest can join via manual signaling.
- Player list updates for host and guest.
- Host can select and start Tic-tac-toe.
- Guest action reaches host and appears on both screens.
- Invalid out-of-turn action is rejected.
- Host disconnect ends lobby cleanly.
- UI works at mobile and desktop widths.

Potential future automated tests:

- Unit tests for lobby reducer.
- Unit tests for game reducers and action validators.
- Protocol parser tests for invalid payloads.
- Playwright test for route rendering and local single-browser game flow.

## Open Decisions

- Should the canonical public URL stay singular `/experiment/playwithfriends`, or should the app also expose plural `/experiments/playwithfriends` for consistency?
- Is public STUN acceptable, or does “no external servers” mean strict manual/local-only connectivity even if remote friends fail more often?
- Is manual offer/answer exchange acceptable for the first version, or should implementation pause until an acceptable signaling option is chosen?
- Should games be host-authoritative only, or should some future engines be allowed to run lockstep deterministic sync?
- Should the first release include only board games, or should the bridge reserve explicit support for real-time games from the start?

## Recommended First Build

Build the route, lobby UI, bridge types, game registry, and local Tic-tac-toe first. Keep WebRTC behind a small adapter so the game bridge and lobby UX can be tested before networking complexity enters the implementation.

This sequence proves the product shape and shared game interface early, while keeping the hard peer-to-peer connection problem isolated in one layer.
