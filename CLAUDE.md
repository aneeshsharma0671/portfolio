# Claude Code Guide

@AGENTS.md
@.ai/context.md

## Operating Mode

Use this repo as a focused Next.js portfolio workspace. Keep context local to this repo, inspect only the affected routes/components/styles for each task, and write durable plans or reviews under `.ai/reports/` when work spans more than one step.

Do not load the full ECC library by default. Use the project-local `.claude/agents/`, `.claude/skills/`, and `.claude/rules/ecc/` surfaces first. Reach into the ECC source repo only when the `skill-library` router says a library skill is relevant.

## Daily Agent Routing

- `planner`: use before multi-file features, route restructuring, or significant UI changes.
- `tdd-guide`: use when adding behavior or restoring a test runner.
- `typescript-reviewer` and `react-reviewer`: use after TypeScript, JavaScript, JSX, or TSX changes.
- `security-reviewer`: use before changes involving forms, external links, environment variables, or user-provided content.
- `build-error-resolver`: use when `npm run build` or `npm run lint` fails.
- `e2e-runner`: use for route-level visual/user-flow checks when Playwright is available.

## Verification

Prefer the repo commands:

- `npm ci` for clean dependency install.
- `npm run dev` for local development.
- `npm run build` for production build and framework checks.
- `npm run lint` for linting, noting that this project may need lint config repair on modern Next versions.

There is no active `npm test` script. If tests are added, update `package.json` and document the runner in `AGENTS.md`.

## Context Budget

Start from `AGENTS.md`, `.ai/context.md`, `package.json`, and the files directly touched by the task. Use `/compact` after research, planning, or debugging milestones before starting an unrelated phase.
