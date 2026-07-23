# Play With Friends PRD Review

Date: 2026-07-24
Reviewer: Codex reviewer pass
Recommendation: **Needs changes before implementation agents start**

## Findings And Risks

1. **High - networking MVP scope is inconsistent across the PRD, plan, and agent prompts.**
   - `.ai/reports/playwithfriends-prd.md:29` says real internet multiplayer is not required, and `.ai/reports/playwithfriends-prd.md:201`-`229` scopes the first implementation to a local mock adapter with future Trystero.
   - `.ai/reports/playwithfriends-plan.md:61`-`67` still describes manual WebRTC signaling as the MVP interpretation, `.ai/reports/playwithfriends-plan.md:300`-`305` schedules `RTCPeerConnection`/`RTCDataChannel`, and `.ai/reports/playwithfriends-plan.md:323`-`342` verifies guest signaling and cross-screen host/guest behavior.
   - `.ai/reports/playwithfriends-agent-prompts.md:63`-`71` tells the networking agent not to install networking dependencies or implement Trystero/WebRTC yet.
   - Risk: implementation agents can legitimately choose different scopes: local mock only, manual signaling, or early WebRTC. That will create incompatible state, adapter, and verification expectations.
   - Required edit: add an explicit scope precedence section to the PRD: first implementation is local mock only, no manual signaling/WebRTC/Trystero dependency, and the older plan's WebRTC phases are future-only unless the PRD review changes scope. Also update the plan verification checklist or mark it superseded for this milestone.

2. **High - two-player game seating is underspecified for a lobby that can contain more than two people.**
   - `.ai/reports/playwithfriends-prd.md:92`-`108` requires mock friends, game selection, and start gating based on enough players and all non-host players being ready.
   - `.ai/reports/playwithfriends-prd.md:183`-`199` says Tic Tac Toe and Connect Four require exactly two active players.
   - `.ai/reports/playwithfriends-prd.md:244`-`257` lists core state but does not include seats, active player ids, spectator ids, or per-game participant selection.
   - Risk: with 3+ players in the lobby, it is unclear whether all guests block start, which two players get marks/colors, whether extra players spectate, and whether `maxPlayers` should prevent start. This will affect lobby UI, game initialization, reducer logic, and tests.
   - Required edit: define `activePlayerIds` or seat assignment rules. For MVP, pick one rule: either disable start unless lobby player count is within the selected game's `minPlayers`/`maxPlayers`, or allow spectators and define how the host chooses/auto-assigns active players. Define whether readiness applies to all lobby guests or only selected active players.

3. **High - multi-agent ownership leaves the central state and integration surface without a clear owner.**
   - `.ai/reports/playwithfriends-prd.md:327`-`331` says Milestone 2 extracts state/types and adds the registry, contract, protocol, and local adapter.
   - `.ai/reports/playwithfriends-prd.md:373`-`413` splits Lobby, Games, and Networking scopes, but no worker explicitly owns `src/Components/Experiments/PlayWithFriends/index.tsx`, `state/lobbyReducer.ts`, or the root composition/wiring.
   - `.ai/reports/playwithfriends-agent-prompts.md:31`-`38`, `48`-`55`, and `65`-`71` reinforce that workers own separate folders, while `.ai/reports/playwithfriends-agent-prompts.md:13`-`21` limits the orchestrator to small integration edits after worker outputs.
   - `src/Components/Experiments/PlayWithFriends/index.tsx:252`-`560` is currently the monolithic UI/state composition, so any meaningful split needs one owner for the reducer, shared types, root component wiring, and import boundaries.
   - Risk: workers will either avoid wiring their work, all touch the monolith, or create conflicting shared types. The shared CSS module is also in both Lobby and Games scopes.
   - Required edit: add a foundation/integration phase before parallel workers. Assign one owner for `index.tsx`, `state/lobbyTypes.ts`, `state/lobbyReducer.ts`, and shared exports. Either split CSS by component/game module or reserve named CSS sections so agents do not edit the same selectors concurrently.

4. **Medium-high - host/guest permissions are not acceptance-testable.**
   - `.ai/reports/playwithfriends-prd.md:103`-`108` specifies host-only start rules, and `.ai/reports/playwithfriends-prd.md:132`-`137` says game modules receive local player and host status.
   - `.ai/reports/playwithfriends-prd.md:92`-`101` does not specify who may select games, add mock friends, toggle readiness, end games, reset/rematch, or return to lobby.
   - The current component allows any rendered player row to toggle any player's ready state at `src/Components/Experiments/PlayWithFriends/index.tsx:452`-`456`, allows all game tiles to dispatch selection at `src/Components/Experiments/PlayWithFriends/index.tsx:493`-`500`, and calculates `canStartGame` without role/readiness/min-player rules at `src/Components/Experiments/PlayWithFriends/index.tsx:264`-`265`.
   - Risk: lobby and game agents may implement different authority assumptions, especially for the guest preview state.
   - Required edit: add a permission matrix for host, guest, mock/dev controls, and spectators. Include game selection, ready toggles, adding mock friends, start, reset/rematch, end game, and leave lobby.

5. **Medium-high - accessibility requirements need concrete focus, live-region, and disabled-reason criteria.**
   - `.ai/reports/playwithfriends-prd.md:120` and `.ai/reports/playwithfriends-prd.md:274` keep entry/lobby/game transitions inside client component state, so browser navigation will not automatically reset focus or announce a page change.
   - `.ai/reports/playwithfriends-prd.md:288`-`296` requires labels, keyboard access, and live regions only "if practical."
   - `.ai/reports/playwithfriends-prd.md:115` says disabled start states should explain themselves, while `.ai/reports/playwithfriends-prd.md:293` says disabled actions should use real disabled state. A disabled button cannot expose a hover-only explanation to keyboard users.
   - Risk: screen-reader and keyboard users can miss lobby/game transitions, turn changes, copy feedback, invalid move errors, and reasons that start is unavailable.
   - Required edit: make live regions and focus management mandatory for phase changes, event log/status changes, turn/result messages, copy success/failure, and invalid moves. Require disabled reasons to be visible or associated with controls via `aria-describedby`; do not rely on tooltip-only explanations.

6. **Medium - protocol and input validation boundaries are not specific enough for the networking agent.**
   - `.ai/reports/playwithfriends-prd.md:205`-`214` lists adapter concepts, and `.ai/reports/playwithfriends-prd.md:224`-`229` says malformed messages are ignored or surfaced as non-fatal errors.
   - `.ai/reports/playwithfriends-plan.md:181`-`205` has a concrete typed `PeerMessage` shape and version/action-id rules, but the networking agent prompt at `.ai/reports/playwithfriends-agent-prompts.md:63`-`71` does not require reading that plan.
   - `.ai/reports/playwithfriends-plan.md:272`-`280` says to cap payload size and avoid exposing raw connection details, but those requirements are not carried into the PRD.
   - Risk: protocol validators can be too loose, pasted join/signaling payloads can be unbounded, and future peer messages can freeze the UI or leak raw connection details into normal UI.
   - Required edit: move the minimal protocol envelope and validation rules into the PRD, including max display-name length, room-code format, max message/payload size, schema validation behavior, message id/dedup expectations, state versioning, and non-fatal error handling.

7. **Medium - verification is too manual for the game and protocol surfaces being requested.**
   - `.ai/reports/playwithfriends-prd.md:297`-`318` requires only `npm run lint`, `npm run build`, and manual browser checks.
   - `.ai/reports/playwithfriends-plan.md:344`-`349` lists reducer, game reducer, protocol parser, and Playwright tests only as potential future automated tests.
   - `package.json:19`-`24` has no `test` script, and `.ai/context.md:17`-`26` confirms build/lint are the current minimum.
   - Risk: Tic Tac Toe turn validation, win/draw detection, start gating, protocol parsing, and malformed-message handling can regress without fast deterministic checks.
   - Required edit: either require focused unit tests for pure logic or explicitly document that the first implementation is manual-only and why. Preferred PRD edit: add unit tests for lobby reducer start gates, Tic Tac Toe engine/validator, game registry metadata, and protocol parser invalid payloads; add/update a test script if tests are introduced.

8. **Medium - result/end-state phase is internally ambiguous.**
   - `.ai/reports/playwithfriends-prd.md:13`-`15` names `Results / Back to Lobby` as part of the staged flow.
   - `.ai/reports/playwithfriends-prd.md:139`-`150` says a simple in-game end state is enough.
   - `.ai/reports/playwithfriends-prd.md:235`-`241` includes an app-level `ended` phase.
   - Risk: one agent may build a separate results screen while another keeps results inside the game shell. That affects reducer state, focus behavior, rematch, and back-to-lobby semantics.
   - Required edit: define whether `ended` is an app phase in MVP. If results remain inside the game shell, remove `ended` from the MVP phase union or document exactly when it is entered.

9. **Low - route alias should be explicitly out of scope for this pass.**
   - `.ai/reports/playwithfriends-prd.md:266`-`274` keeps `/experiment/playwithfriends` as canonical and leaves `/experiments/playwithfriends` as a later alias decision.
   - `.ai/reports/playwithfriends-plan.md:15`-`22` notes the repo convention uses plural experiment routes.
   - Risk: low, but parallel agents may spend time on route aliases or redirects instead of the product loop.
   - Required edit: mark the plural alias as deferred and assign it to a later routing/navigation task, unless the implementation owner wants it included now with a specific redirect/alias decision.

## Required PRD Edits Before Agents Start

- Add a "Scope precedence for first implementation" section: local mock adapter only; no manual signaling, WebRTC, Trystero, STUN/TURN, or networking dependencies in this milestone.
- Define player seating and readiness semantics for games with `minPlayers` and `maxPlayers`, including spectators or a no-spectator rule.
- Add a host/guest/spectator permission matrix for lobby and game controls.
- Add a foundation phase and file ownership table for `index.tsx`, shared state/types, reducer, protocol types, bridge types, and CSS ownership.
- Move the minimal peer-message/protocol envelope and validation limits into the PRD.
- Make accessibility acceptance criteria testable: focus movement, live regions, disabled reason exposure, keyboard game-board behavior, and copy/error announcements.
- Decide whether `ended` is an MVP app phase or just an in-game result state.
- Upgrade verification from build/lint/manual-only to include focused pure-logic tests, or explicitly document that automated tests are deferred.

## Approval Recommendation

Do not start implementation agents yet. The PRD is directionally sound and the local-first strategy is the right sequencing, but the unresolved scope, seating, shared-file ownership, accessibility, and verification gaps are likely to cause avoidable rework once agents run in parallel.

After the PRD edits above are applied, implementation can proceed with a conservative first slice: foundation types/reducer/registry, local lobby, Tic Tac Toe through the bridge, local mock adapter, then integration and review.
