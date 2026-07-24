# Play With Friends Nakama Setup

Date: 2026-07-24
Branch: `feat/nakama-setup`

## Decision

Start Nakama as a separate service in this repo's Docker Compose stack, not inside the Next.js SSR process.

The local setup uses:

- `web`: existing Next.js portfolio app.
- `nakama`: Nakama realtime/game backend.
- `nakama-postgres`: local Postgres database for Nakama.

The Nakama services are behind the `nakama` Compose profile so normal portfolio runs do not require the game backend.

## Local Command

```bash
cp .env.nakama.example .env.nakama.local
docker compose --env-file .env.nakama.local --profile nakama up --build
```

## Deploy Workflow

`.github/workflows/deploy.yml` now deploys with Docker Compose instead of a single `docker run`.

The workflow:

- Builds and pushes the Next.js image to GHCR.
- Uploads `docker-compose.yml` and `nakama/` to the server.
- Writes `.env.production` on the server from GitHub production secrets and variables.
- Runs `docker compose --env-file .env.production --profile nakama up -d --no-build --remove-orphans`.

Required production GitHub secrets:

- `SSH_HOST`
- `SSH_USER`
- `SSH_KEY`
- `NAKAMA_POSTGRES_USER`
- `NAKAMA_POSTGRES_PASSWORD`
- `NAKAMA_SOCKET_SERVER_KEY`
- `NAKAMA_SESSION_ENCRYPTION_KEY`
- `NAKAMA_SESSION_REFRESH_ENCRYPTION_KEY`
- `NAKAMA_RUNTIME_HTTP_KEY`
- `NAKAMA_CONSOLE_USERNAME`
- `NAKAMA_CONSOLE_PASSWORD`

Required production GitHub variables:

- `NEXT_PUBLIC_NAKAMA_HOST`
- `NEXT_PUBLIC_NAKAMA_PORT`
- `NEXT_PUBLIC_NAKAMA_USE_SSL`

Optional production GitHub variables:

- `DEPLOY_PATH` defaults to `portfolio`.
- `NAKAMA_POSTGRES_PORT` defaults to `5433`.
- `NAKAMA_HTTP_PORT` defaults to `7350`.
- `NAKAMA_CONSOLE_PORT` defaults to `7351`.
- `NAKAMA_GRPC_PORT` defaults to `7349`.

## Current Scope

- Add container infrastructure.
- Add a minimal Nakama runtime module with a health RPC.
- Add Play With Friends helper functions for carrying the existing peer envelope over Nakama match state.

## Deferred

- Install and wire `@heroiclabs/nakama-js`.
- Implement `NakamaNetworkAdapter`.
- Replace local mock networking in the UI.
- Add authoritative match handlers for Tic Tac Toe / Connect Four.
- Add production proxy/TLS configuration.
