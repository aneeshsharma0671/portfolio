# Play With Friends Agent Prompts

Status: Prepared for hidden Codex subagents
Prerequisite: `.ai/reports/playwithfriends-prd.md` with review edits applied is the source of truth.

## Orchestrator Agent

```text
Repo path: /Users/aneesh.sharma@zomato.com/personal-code/portfolio/.dmux/worktrees/work-playwithfriendsexperiment

You are the Play With Friends implementation orchestrator. Read AGENTS.md, .ai/context.md, .ai/reports/playwithfriends-prd.md, and .ai/reports/playwithfriends-prd-review.md first.

Create and maintain .ai/reports/playwithfriends-agent-status.md with:
- final approved scope
- active worker agents
- file ownership boundaries
- merge order
- verification checklist
- unresolved conflicts

Current milestone scope is local mock only: no WebRTC, no Trystero, no PeerJS, no manual signaling, no networking dependencies. Tic Tac Toe is the only required playable game. Connect Four and Card Table should be planned/disabled.

Verification scope: this milestone adds Vitest for pure TypeScript logic tests. Final verification must run `npm test`, `npm run lint`, and `npm run build`.

You may make PRD/status edits and integration edits after worker outputs are available. Do not revert changes you did not make. Other agents may be editing the same repo, so coordinate by file ownership and report conflicts immediately.
```

## Foundation Agent

```text
Repo path: /Users/aneesh.sharma@zomato.com/personal-code/portfolio/.dmux/worktrees/work-playwithfriendsexperiment

You own the Play With Friends foundation split. Read AGENTS.md, .ai/context.md, .ai/reports/playwithfriends-prd.md, .ai/reports/playwithfriends-prd-review.md, app/experiment/playwithfriends/page.tsx, and src/Components/Experiments/PlayWithFriends/index.tsx first.

Current milestone scope is local mock only: no WebRTC, no Trystero, no PeerJS, no manual signaling, no networking dependencies. Tic Tac Toe is the only required playable game. Connect Four and Card Table should be planned/disabled.

Write scope:
- src/Components/Experiments/PlayWithFriends/index.tsx
- src/Components/Experiments/PlayWithFriends/state/*
- src/Components/Experiments/PlayWithFriends/PlayWithFriends.module.css only for root/layout compatibility
- package.json and package-lock.json only if Vitest scripts/dependency are not already present

Do not implement game engines or networking adapters. You are not alone in the codebase; do not revert edits made by others, and adapt to existing changes.

Deliver shared lobby/player/game-session types, a reducer with phases entry/joining/lobby/game, automatic seating rules, start-gating helpers, host/guest permission helpers, root composition placeholders ready to consume Lobby/Game/Network modules, Vitest setup/scripts if missing, and tests for lobby start-gating helpers/reducer behavior. Final response must list changed files and integration assumptions.
```

## Lobby Agent

```text
Repo path: /Users/aneesh.sharma@zomato.com/personal-code/portfolio/.dmux/worktrees/work-playwithfriendsexperiment

You own the Play With Friends entry and lobby UX. Read AGENTS.md, .ai/context.md, .ai/reports/playwithfriends-prd.md, .ai/reports/playwithfriends-prd-review.md, and src/Components/Experiments/PlayWithFriends/* first.

Current milestone scope is local mock only: no WebRTC, no Trystero, no PeerJS, no manual signaling, no networking dependencies. Tic Tac Toe is the only required playable game. Connect Four and Card Table should be planned/disabled.

Write scope:
- src/Components/Experiments/PlayWithFriends/components/EntryScreen.tsx
- src/Components/Experiments/PlayWithFriends/components/LobbyScreen.tsx
- src/Components/Experiments/PlayWithFriends/components/PlayerList.tsx
- src/Components/Experiments/PlayWithFriends/components/GamePicker.tsx
- src/Components/Experiments/PlayWithFriends/components/Lobby.module.css

Do not edit game engine files, network adapter files, shared state files, or the root index unless the foundation owner has already created explicit prop contracts requiring a tiny integration adjustment. You are not alone in the codebase; do not revert edits made by others, and adapt to existing changes.

Deliver entry screen, lobby screen, player list, ready controls, automatic seat/spectator display, game picker, start-game disabled reason UI with `aria-describedby`, copy room-code affordance, focusable controls, and responsive layout. Final response must list changed files and any integration assumptions.
```

## Games Agent

```text
Repo path: /Users/aneesh.sharma@zomato.com/personal-code/portfolio/.dmux/worktrees/work-playwithfriendsexperiment

You own the Play With Friends game registry, bridge contract, and game implementations. Read AGENTS.md, .ai/context.md, .ai/reports/playwithfriends-prd.md, .ai/reports/playwithfriends-prd-review.md, and src/Components/Experiments/PlayWithFriends/index.tsx first.

Current milestone scope is local mock only: no WebRTC, no Trystero, no PeerJS, no manual signaling, no networking dependencies. Tic Tac Toe is the only required playable game. Connect Four and Card Table should be planned/disabled.

Write scope:
- src/Components/Experiments/PlayWithFriends/bridge/*
- src/Components/Experiments/PlayWithFriends/games/*
- src/Components/Experiments/PlayWithFriends/components/GameScreen.tsx
- src/Components/Experiments/PlayWithFriends/components/GameScreen.module.css

Do not edit networking files, lobby UI files, shared state files, or the root index unless the foundation owner has already created explicit prop contracts requiring a tiny integration adjustment. You are not alone in the codebase; do not revert edits made by others, and adapt to existing changes.

Deliver the GameMetadata/GameModule contract, a registry, playable Tic Tac Toe with move validation/win/draw/reset helpers, planned metadata for Connect Four and Card Table, tests for registry metadata and Tic Tac Toe engine behavior, and an accessible game screen with keyboard-operable cells and live status text. Final response must list changed files, game action rules, and any integration assumptions.
```

## Networking Agent

```text
Repo path: /Users/aneesh.sharma@zomato.com/personal-code/portfolio/.dmux/worktrees/work-playwithfriendsexperiment

You own the Play With Friends network boundary and local mock adapter. Read AGENTS.md, .ai/context.md, .ai/reports/playwithfriends-prd.md, .ai/reports/playwithfriends-prd-review.md, .ai/reports/playwithfriends-networking-tech.md, and src/Components/Experiments/PlayWithFriends/index.tsx first.

Current milestone scope is local mock only: no WebRTC, no Trystero, no PeerJS, no manual signaling, no networking dependencies. Tic Tac Toe is the only required playable game. Connect Four and Card Table should be planned/disabled.

Write scope:
- src/Components/Experiments/PlayWithFriends/network/*

Do not edit shared state files unless the foundation owner has created an explicit type import you need to consume. Do not install networking dependencies. Do not implement Trystero/WebRTC/manual signaling. You are not alone in the codebase; do not revert edits made by others, and adapt to existing changes.

Deliver NetworkAdapter, PeerMessage envelope/protocol types, parse/validation helpers with room-code/display-name/message-size/type allowlist checks, dedup/version helper behavior, tests for malformed/oversized/unknown/duplicate messages, and LocalNetworkAdapter behavior for host/join/mock friend simulation. Final response must list changed files, adapter API, validation limits, and any integration assumptions.
```

## Final Reviewer Agent

```text
Repo path: /Users/aneesh.sharma@zomato.com/personal-code/portfolio/.dmux/worktrees/work-playwithfriendsexperiment

Review the final Play With Friends diff after worker integration. Read AGENTS.md, .ai/context.md, .ai/reports/playwithfriends-prd.md, and the current git diff.

Do not edit files. Write findings to .ai/reports/playwithfriends-final-review.md. Lead with correctness, React/Next behavior, accessibility, responsive layout, state consistency, game rules, network-boundary cleanliness, and missing verification.
```
