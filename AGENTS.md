# Repository Guidelines

## Project Structure & Module Organization

This is a Next.js portfolio app. Route entry points live in `app/`, including the main homepage, `/portfolio/*`, and `/experiments/*` pages. Reusable UI and page composition live under `src/Components/` and `src/page-components/`. Shared data and types are in `src/data/` and `src/types/`. Global styles are in `src/index.css`, `src/App.css`, and `src/Styles/`; component-specific styles commonly use `.module.css` files next to their component. Static assets, logos, manifest files, and public images belong in `public/`.

## Build, Test, and Development Commands

- `npm ci`: install dependencies from `package-lock.json`.
- `npm run dev`: start the local Next development server.
- `npm run build`: create a production build and run Next/TypeScript checks.
- `npm start`: serve the built app locally.
- `npm run lint`: run the configured Next lint command.
- `docker compose up --build`: build and run the production container on port `3000`.

## Coding Style & Naming Conventions

Use TypeScript for new route and component work. Keep React components in `PascalCase` files, for example `HeroSection.tsx`, and export a single default component when that matches the surrounding pattern. Use CSS Modules for new component styles (`ComponentName.module.css`) and keep global CSS limited to shared resets or cross-page utilities. The existing code uses two-space indentation, single quotes in many `src/` files, and the `@/*` path alias for root-relative imports.

## Testing Guidelines

There are legacy CRA test files (`src/App.test.js`, `src/setupTests.js`), but `package.json` does not currently define an `npm test` script. Until a test runner is restored, use `npm run build` and `npm run lint` as the minimum verification for changes. If adding tests, prefer React Testing Library, name files `*.test.tsx` or `*.test.js`, and add or update the test script in `package.json`.

## Commit & Pull Request Guidelines

Recent commits use short, imperative summaries such as `added ask out page` or `updated page animation`, with feature branches named like `feat/homepage`. Keep commits focused on one change. Pull requests should include a brief description, affected routes or components, verification commands run, linked issues when available, and screenshots for visual changes.

## Security & Configuration Tips

Do not commit secrets or local environment files. Public client-safe assets go in `public/`; private configuration should be passed through environment variables and documented separately.
