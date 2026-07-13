# Portfolio Repo Context

## Stack

- Next.js app router with React 18 and TypeScript.
- npm with `package-lock.json`.
- Routes live in `app/`, including `/`, `/portfolio/*`, and `/experiments/*`.
- Reusable UI lives in `src/Components/`; older page code remains in `src/page-components/`.
- Static assets live in `public/`.
- Docker support exists through `dockerfile` and `docker-compose.yml`.

## Current Constraints

- `AGENTS.md` is the root contributor guide.
- The README still describes Create React App and may be stale.
- `package.json` has `dev`, `build`, `start`, and `lint`; it does not define `test`.
- CSS is split between global files and component CSS Modules. Prefer CSS Modules for new component styles.

## Verification

Use these commands when relevant:

```bash
npm run build
npm run lint
```

If a task restores testing, add the script to `package.json` and update `AGENTS.md`.

## Agent Workflow

Keep plans, reviews, and long research notes in `.ai/reports/`. Use focused agents for planning, implementation, review, docs lookup, and build repair instead of loading the full ECC library into every session.
