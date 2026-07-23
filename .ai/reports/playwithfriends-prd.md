# Play With Friends PRD

Date: 2026-07-24
Owner: Codex orchestration session
Status: Review edits applied; ready for local-first implementation

## 1. Product Summary

Play With Friends is a portfolio experiment for lightweight browser games with friends. The experience should open directly into a multiplayer flow, not a landing page. A player creates or joins a lobby, waits for friends, selects a game, and then moves into a dedicated game screen for that selected game.

The current implementation is a single-screen local mock at `/experiment/playwithfriends`. It combines room setup, player list, game picker, game preview, and network notes in one grid. This PRD changes the product shape to a staged app:

```text
Entry -> Lobby -> Game Screen
```

The first build should prove the flow, state boundaries, and game-module contract before committing to a production networking provider.

## 2. Goals

- Make the route feel like a usable multiplayer game tool from the first viewport.
- Split the current single-screen mock into clear stages: entry, lobby, and active game.
- Support hosting and joining a lobby with a local mock adapter first.
- Keep networking behind a replaceable adapter so real peer-to-peer or signaling can be added without rewriting games.
- Add a game registry so multiple games can share lobby, player, and transport state.
- Launch the selected game on a dedicated game screen after lobby readiness and game selection.
- Provide a clean multi-agent implementation plan with disjoint ownership.

## 2.1 Scope Precedence For This Milestone

This PRD is the source of truth for the first implementation milestone. It supersedes older WebRTC/manual-signaling phases in `.ai/reports/playwithfriends-plan.md` until a later networking milestone explicitly reopens that scope.

Current milestone scope:

- Local mock adapter only.
- No Trystero, PeerJS, WebRTC, STUN/TURN, manual offer/answer exchange, or networking dependencies.
- No server, API route, database, auth, or durable persistence.
- Tic Tac Toe is the only required playable game.
- Connect Four and Card Table are registered as planned games, not playable first-pass requirements.
- `/experiments/playwithfriends` alias is deferred.

The implementation should still create boundaries that make future real networking and additional games straightforward.

## 3. Non-Goals For First Implementation

- Real internet multiplayer is not required in the first implementation pass.
- Manual WebRTC signaling is not required in the first implementation pass.
- Trystero, PeerJS, WebRTC, STUN/TURN, or new networking dependencies are not required in the first implementation pass.
- Voice chat is not required.
- Durable accounts, auth, or backend persistence are not required.
- Matchmaking, public lobbies, and ranking are not required.
- Host migration is not required. If the host leaves, the MVP can end the lobby.
- A marketing homepage for the experiment is not required.

## 4. Target Users

- Friends who want to quickly play simple browser games together.
- The portfolio site visitor who should understand the experiment by using it, not reading a pitch.
- The project owner, who needs an extensible playground for adding more games and networking experiments.

## 5. Current State

Relevant files:

- `app/experiment/playwithfriends/page.tsx`
- `src/Components/Experiments/PlayWithFriends/index.tsx`
- `src/Components/Experiments/PlayWithFriends/PlayWithFriends.module.css`
- `.ai/reports/playwithfriends-plan.md`
- `.ai/reports/playwithfriends-networking-tech.md`

Current behavior:

- User can enter a display name.
- User can host a mock room or join a preview room.
- Room code is generated locally.
- Mock friends can be added.
- Players can toggle ready state.
- Game picker shows Tic Tac Toe, Connect Four, and Card Table.
- Start switches status to `game`, but the game remains on the same screen and only shows a board preview.
- Networking is only represented as UI copy.

Primary gap:

- The app does not yet behave like a staged multiplayer product. Lobby and game are visually and structurally fused.

## 6. User Experience Requirements

### 6.1 Entry Screen

The initial route should show a compact setup surface:

- Display name input.
- Host lobby action.
- Join lobby action.
- Join code input only when joining.
- Clear indication that the current build uses local/mock networking when applicable.

Acceptance criteria:

- A new visitor can create a lobby in one submit.
- A joining visitor can enter a room code and reach a lobby preview.
- Empty display names become a safe default such as `Player`.
- Display names are trimmed and capped.

### 6.2 Lobby Screen

The lobby is the waiting room before gameplay. It should be the main collaboration surface.

Required lobby features:

- Room code and copy button.
- Player list with host/guest labels.
- Ready state controls.
- Add mock friend button for local development.
- Game selection.
- Start game button.
- Leave lobby button.
- Lightweight event log or connection status area.

Start-game rules:

- Host can start only when a game is selected.
- Host can start only when the selected game has enough seated players.
- Host can start only when seated non-host players are ready.
- Planned games are visible but disabled until implemented.

Acceptance criteria:

- Lobby does not show the active game board.
- Player count and ready count update predictably.
- Selected game is visually clear.
- Disabled start states explain themselves through concise UI state, not long instructional text.
- Mobile layout remains usable without overlapping buttons or text.

### 6.3 Game Screen

After the host starts a game, the app should forward to a dedicated game screen within the experiment component state.

Required game shell features:

- Active game title.
- Room code and compact player/status rail.
- Leave game / leave lobby action.
- Back to lobby or end game action for host.
- Game-specific play area.
- Turn/status area for board games.
- Rematch or reset action when the game ends.

Acceptance criteria:

- The lobby panels are not still the primary UI once a game starts.
- The selected game determines the rendered game module.
- Game modules receive players, local player, host status, state, and action dispatch through a shared bridge.
- Returning to lobby preserves room code, players, selected game, and readiness unless explicitly leaving the lobby.

### 6.4 Results / End State

For the first board games, a simple in-game end state is enough:

- Win, draw, or cancelled.
- Host can reset/rematch.
- Users can return to lobby.

Acceptance criteria:

- Completed games do not require page refresh.
- Reset creates a fresh game state using the current lobby players.

### 6.5 Permissions

| Action | Host | Seated guest | Spectator | Local mock/dev control |
| --- | --- | --- | --- | --- |
| Create room | Yes | No | No | Yes |
| Join room | No | Yes | Yes | Yes |
| Copy room code | Yes | Yes | Yes | Yes |
| Add mock friend | Yes | No | No | Yes |
| Select game | Yes | No | No | Yes only when simulating host |
| Seat/unseat players | Yes | No | No | Yes only when simulating host |
| Toggle readiness | Host may toggle self; host may simulate mock players | Self only | Self only if later seated | Yes for mock players |
| Start game | Yes | No | No | Yes only when simulating host |
| Make game move | If seated and it is their turn | If seated and it is their turn | No | Yes for current local/seated player |
| Reset/rematch | Yes after game ends | No | No | Yes only when simulating host |
| Return to lobby/end game | Yes | No | No | Yes only when simulating host |
| Leave lobby | Yes, ends local lobby | Yes | Yes | Yes |

Current local mock mode may expose dev simulation controls, but they must be visually labeled as local/mock behavior so they do not look like final guest permissions.

## 7. Game Requirements

### 7.1 Game Registry

All games should be registered through metadata and a shared module contract.

Required metadata:

- `id`
- `name`
- `minPlayers`
- `maxPlayers`
- `status`: `playable` or `planned`
- `description`

Required module behavior:

- Create initial state from lobby players.
- Validate actions.
- Apply accepted actions.
- Render game UI.
- Report game phase: playing, won, draw, cancelled.

### 7.2 First Playable Games

MVP target:

- Tic Tac Toe: playable.
- Connect Four: planned and visible, but disabled for start.
- Card Table: planned placeholder only.

Tic Tac Toe acceptance criteria:

- Exactly two active players are assigned marks.
- Players take alternating turns.
- Out-of-turn moves are rejected.
- Occupied cells cannot be overwritten.
- Win and draw are detected.
- Host can reset/rematch.

Connect Four acceptance criteria, if included in the first implementation:

- Exactly two active players are assigned colors.
- Players take alternating turns.
- Dropping a token fills the lowest empty cell in the selected column.
- Full columns reject moves.
- Horizontal, vertical, and diagonal wins are detected.
- Draw is detected when board is full.

### 7.3 Seating And Spectators

Games use explicit `activePlayerIds` for the current game session.

MVP seating rule:

- Host occupies the first active seat by default.
- For a 2-player game, the earliest joined ready non-host player occupies the second active seat.
- Extra lobby players remain spectators.
- Spectators can see the lobby/game state but do not block start and cannot make moves.
- Readiness gates apply only to seated non-host players.
- If no ready non-host player exists for a 2-player game, start is disabled.
- Planned games cannot be started even if seating requirements are met.

Future versions may add host-controlled seat selection. The first implementation may use automatic seating to avoid a larger lobby-management UI.

## 8. Networking Requirements

The first implementation should use a local mock adapter but must preserve the boundary for real networking.

Required adapter concepts:

- Create room.
- Join room.
- Leave room.
- Broadcast lobby snapshot.
- Send game action.
- Receive peer message.
- Track peer connection status.

Recommended first adapters:

- `LocalNetworkAdapter`: in-memory/mock behavior for one browser session.
- `Protocol` types and validators: real message shapes even before real transport.

Future adapter:

- Trystero prototype for room-code style WebRTC rooms, as documented in `.ai/reports/playwithfriends-networking-tech.md`.

Networking acceptance criteria for first implementation:

- UI and games do not import Trystero, PeerJS, WebRTC, or any specific transport.
- Message types are centralized.
- Unknown or malformed messages are ignored or surfaced as non-fatal errors.
- The local mock can simulate a friend joining and readying.

### 8.1 Protocol And Input Validation

Even in local mock mode, the protocol layer should use the same minimal envelope future transports will use:

```ts
type PeerMessageEnvelope = {
  id: string;
  type: string;
  senderId: string;
  roomCode: string;
  version: number;
  sentAt: number;
  payload: unknown;
};
```

Validation rules:

- Display names are trimmed and capped at 24 visible characters.
- Room codes are uppercase alphanumeric, 4-8 characters.
- Message ids are capped at 64 characters and used for deduplication.
- Message type strings are allowlisted.
- Serialized peer messages are capped at 16 KB for this milestone.
- Unknown or malformed messages produce a non-fatal error event and are not applied.
- Game actions are validated by the active game module before state changes.
- Lobby and game snapshots carry monotonically increasing integer versions.
- Normal UI must not expose raw transport internals such as ICE candidates, IP addresses, or stack traces.

## 9. State Model

The product should have explicit app phases:

```ts
type PlayWithFriendsPhase =
  | 'entry'
  | 'joining'
  | 'lobby'
  | 'game';
```

Core state:

- Local player.
- Room code.
- Host player id.
- Player list.
- Active player ids for the selected/active game.
- Selected game id.
- Active game id.
- Game states keyed by game id or active session id.
- Ready states.
- Event log.
- Connection mode: local mock.
- Last non-fatal error.

Implementation preference:

- Use a reducer for lobby and game-session state.
- Move type definitions out of the large component once multiple agents begin implementation.
- Keep route file thin.
- Keep game result/end state inside the active game state for MVP. Do not add a separate app-level `ended` phase in this milestone.

## 10. Routing

Current canonical route:

- `/experiment/playwithfriends`

Deferred decision:

- Add `/experiments/playwithfriends` as an alias later for consistency with existing plural experiment routes.

For the first implementation, keep the existing route and implement screen transitions inside the component. Do not add URL-level nested game routes or plural route aliases until the product needs shareable game-screen URLs or experiment-list consistency work.

## 11. Design Requirements

- Build the actual app as the first screen, not a landing page.
- Keep the interface compact, operational, and scan-friendly.
- Use CSS Modules for new styles.
- Use existing `react-icons` icons where controls benefit from icons.
- Keep cards at 8px radius or less.
- Avoid nested cards and decorative background-only visuals.
- Ensure button text fits at mobile widths.
- Ensure game boards have stable dimensions and do not shift when status text changes.
- Use clear visual separation between lobby and game phases.

## 12. Accessibility Requirements

- Inputs need labels.
- Icon-only buttons need `aria-label`.
- Game boards need accessible labels or button labels per cell/column.
- Disabled actions should use real disabled state where appropriate.
- Keyboard users must be able to host, join, ready, select a game, start, and make game moves.
- Phase changes must move focus to the new screen heading or primary status region.
- Turn changes, game results, copy success/failure, invalid moves, and start-disabled explanations must be announced through a concise `aria-live` status region.
- Disabled start reasons must be visible text or associated with the button through `aria-describedby`; do not rely on tooltip-only explanations.
- Game-board cells/columns must be buttons with stable accessible names and keyboard operation.

## 13. Verification Requirements

Minimum commands:

```bash
npm run lint
npm run build
npm test
```

Automated testing decision:

- The repo currently has no `test` script.
- This milestone will add a small Vitest setup for pure TypeScript logic tests.
- Tests should focus on reducer/game/protocol logic only; component/browser tests are deferred.
- Add `test` and `test:watch` scripts when Vitest is introduced.
- Do not add Playwright or jsdom for this milestone unless a later task explicitly expands scope.

Required focused test targets:

- Tic Tac Toe move validation, win detection, draw detection, and reset.
- Lobby start-gating with ready seated player, missing seated player, spectators, and planned games.
- Game registry metadata.
- Protocol parser handling malformed, oversized, unknown, and duplicate messages.

Manual browser checks:

- `/experiment/playwithfriends` loads.
- Host can create a lobby.
- Guest preview can join with a code.
- Mock friend can be added.
- Game cannot start before selected game requirements are met.
- Host can start a playable game.
- App moves from lobby view to dedicated game view.
- Tic Tac Toe can be completed to win and draw states.
- Return to lobby works without a refresh.
- Focus moves correctly between entry, lobby, and game phases.
- Disabled start reason is visible and associated with the start control.
- Mobile layout is readable around 375px width.

## 14. Milestones

### Milestone 1: PRD And Review

- Create this PRD.
- Run a reviewer pass.
- Resolve critical PRD gaps before implementation agents start.

### Milestone 2: Foundation Split

- Extract state/types from the current monolithic component.
- Add game registry and game module contract.
- Add network protocol and local adapter boundary.
- Own root composition wiring in `index.tsx`.
- Establish CSS ownership before parallel UI/game edits.
- Add Vitest and `npm test`/`npm run test:watch` scripts for pure logic tests.

### Milestone 3: Parallel Feature Slices

- Build entry and lobby screens.
- Add start gating based on game metadata and readiness.
- Preserve mock host/join/dev controls.
- Build Tic Tac Toe through the game bridge.
- Build local mock network/protocol helpers.

### Milestone 4: Integration

- Build dedicated game shell.
- Wire feature slices through the root component and reducer.
- Resolve responsive styling and accessibility announcements.

### Milestone 5: Verification And Review

- Merge agent work.
- Resolve UI/state conflicts.
- Run lint and build.
- Run tests.
- Run reviewer pass on diff.

## 15. Multi-Agent Plan

Use `dmux-workflows` style orchestration: independent workstreams, clear ownership, and strategic merge.

No implementation agents should start until PRD review findings are resolved in this document.

### File Ownership Table

| Area | Owner | Write scope |
| --- | --- | --- |
| Foundation/root | Main orchestrator or foundation agent | `src/Components/Experiments/PlayWithFriends/index.tsx`, `state/*`, shared exports |
| Lobby UI | Lobby agent | `components/EntryScreen.tsx`, `components/LobbyScreen.tsx`, `components/PlayerList.tsx`, `components/GamePicker.tsx`, `components/Lobby.module.css` |
| Game UI/logic | Games agent | `bridge/*`, `games/*`, `components/GameScreen.tsx`, `components/GameScreen.module.css` |
| Network boundary | Networking agent | `network/*`, protocol validation helpers |
| Existing CSS module | Main orchestrator | `PlayWithFriends.module.css` only for root/layout compatibility or final cleanup |
| Reports/reviews | Reviewer/orchestrator | `.ai/reports/*` |

### Agent 1: Orchestrator

Role:

- Maintain the implementation sequence.
- Keep agent scopes disjoint.
- Integrate returned patches.
- Resolve shared type and state conflicts.
- Own final verification and summary.

Write scope:

- PRD review resolution.
- Foundation split if not delegated.
- Integration changes after worker outputs are reviewed.
- `.ai/reports/playwithfriends-agent-status.md`

### Agent 2: Foundation Agent

Role:

- Extract shared types and reducer.
- Own root `index.tsx` composition and imports.
- Define phase, seating, readiness, permissions, and start-gating data flow.
- Add Vitest config/scripts if not already present.
- Own tests for lobby start-gating helpers/reducer behavior.

Likely write scope:

- `src/Components/Experiments/PlayWithFriends/index.tsx`
- `src/Components/Experiments/PlayWithFriends/state/*`
- `src/Components/Experiments/PlayWithFriends/PlayWithFriends.module.css` only for root layout compatibility.

### Agent 3: Lobby Agent

Role:

- Build entry and lobby screens.
- Implement host/join/ready/game-selection controls.
- Keep UI responsive and accessible.

Likely write scope:

- `src/Components/Experiments/PlayWithFriends/components/*`
- `src/Components/Experiments/PlayWithFriends/components/Lobby.module.css`
- No reducer or root wiring changes unless coordinated by the foundation owner.

### Agent 4: Games Agent

Role:

- Define game module contract.
- Implement game registry.
- Implement Tic Tac Toe.
- Register Connect Four and Card Table as planned.
- Own tests for game registry metadata and Tic Tac Toe engine behavior.

Likely write scope:

- `src/Components/Experiments/PlayWithFriends/games/*`
- `src/Components/Experiments/PlayWithFriends/bridge/*`
- `src/Components/Experiments/PlayWithFriends/components/GameScreen.tsx`
- `src/Components/Experiments/PlayWithFriends/components/GameScreen.module.css`

### Agent 5: Networking Agent

Role:

- Define network adapter interface.
- Define typed protocol messages.
- Implement local mock adapter.
- Keep future Trystero/WebRTC integration replaceable.
- Own tests for protocol parsing, size limits, unknown message types, malformed messages, and dedup behavior.

Likely write scope:

- `src/Components/Experiments/PlayWithFriends/network/*`
- No shared state changes unless coordinated by the foundation owner.

### Agent 6: Reviewer

Role:

- Review PRD before implementation.
- Review final diff for React correctness, accessibility, state bugs, styling regressions, and missing verification.

Write scope:

- `.ai/reports/playwithfriends-prd-review.md`
- `.ai/reports/playwithfriends-final-review.md`

## 16. Open Questions

- Should a future routing task add `/experiments/playwithfriends` as a redirect or alias?
- Should the next playable game after Tic Tac Toe be Connect Four or a simpler card/table prototype?
- Should future real networking use Trystero first, or a custom manual-signaling/WebRTC adapter?
- Should future seat selection be host-controlled instead of automatic?
- Should component/browser tests be added after the local-first flow is stable?

## 17. Recommended First Implementation Decision

Proceed with a local-first MVP:

- Dedicated entry, lobby, and game screens.
- Game registry and bridge.
- Tic Tac Toe playable.
- Connect Four and Card Table registered as planned.
- Network adapter interface plus local mock adapter.
- No real Trystero/WebRTC until the staged UI and game bridge are working.

This gives the project a usable product loop quickly and keeps the highest-risk networking work isolated behind an adapter.
