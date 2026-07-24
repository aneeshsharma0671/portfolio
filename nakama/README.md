# Nakama Setup

This folder contains the local Nakama runtime scaffold for the Play With Friends experiment.

## Local Run

Create a local env file from the template:

```bash
cp .env.nakama.example .env.nakama.local
```

Change every placeholder value in `.env.nakama.local`, then start the portfolio and game backend:

```bash
docker compose --env-file .env.nakama.local --profile nakama up --build
```

Useful local URLs:

- Next app: `http://localhost:3000`
- Nakama HTTP/WebSocket API: `http://127.0.0.1:7350`
- Nakama console: `http://127.0.0.1:7351`
- Postgres: `127.0.0.1:5433`

## Runtime

`modules/index.js` is loaded by Nakama at startup and currently registers:

- `playwithfriends_health`: lightweight RPC used to confirm the runtime module loaded.

Keep runtime code ES5-compatible. Nakama's JavaScript runtime is not Node.js, so avoid Node-only APIs such as `fs`, `crypto`, and process access.

## Production Notes

- Run Nakama as a separate long-lived service beside the Next.js app.
- Use managed or dedicated Postgres storage for production.
- Replace all local keys and passwords with deployment secrets.
- Do not expose the console port publicly.
- Put TLS/proxy routing in front of Nakama before browser clients connect in production.
