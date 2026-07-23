# Play With Friends PRD Rereview

Date: 2026-07-24
Reviewer: Codex re-review
Recommendation: **Needs changes before implementation agents start**

## Blocking Findings

1. **Medium - verification scope is still undecided for implementation agents.**
   - `.ai/reports/playwithfriends-prd.md:390` labels an automated testing decision, but `.ai/reports/playwithfriends-prd.md:393`-`394` still leaves both paths open: add tests and a runner, or proceed without a runner and report the manual coverage gap.
   - `.ai/reports/playwithfriends-prd.md:565` keeps the timing of a dedicated test runner as an open question.
   - `.ai/reports/playwithfriends-agent-prompts.md:42`, `.ai/reports/playwithfriends-agent-prompts.md:83`, and `.ai/reports/playwithfriends-agent-prompts.md:100` ask agents to deliver reducer, game, and protocol logic, but no prompt assigns test ownership or says automated tests are explicitly deferred. `.ai/context.md:16` and `AGENTS.md:22` confirm the repo has no existing test script.
   - Required fix: choose one first-milestone verification rule before implementation starts. Either require focused tests plus a deliberate test script addition, or explicitly defer automated tests for this milestone and make the orchestrator/final report own the manual coverage gap.

All other prior blockers are resolved well enough for implementation: local-only networking scope, seating/readiness with spectators, shared file ownership, permission matrix, accessibility criteria, protocol validation limits, ended phase ambiguity, and route alias scope.
