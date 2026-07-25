# Portfolio Website

Next.js portfolio app with experiments, including the Play With Friends multiplayer game prototype.

## Development

Install dependencies:

```bash
pnpm install --frozen-lockfile
```

Run the local Next.js dev server:

```bash
pnpm run dev
```

Open:

```text
http://localhost:3000
```

## Verification

Run the standard checks before merging or deploying:

```bash
pnpm test
pnpm run lint
pnpm run build
```

## Nakama Local Checks Before Production Deploy

Create a local Nakama env file:

```bash
cp .env.nakama.example .env.nakama.local
```

Edit `.env.nakama.local` and replace every `replace-with-*` value. Use local-only random strings. Do not commit `.env.nakama.local`.

Validate the app:

```bash
pnpm install --frozen-lockfile
pnpm test
pnpm run lint
pnpm run build
```

### Install And Start Docker

On macOS, install Docker Desktop from Docker's official installer, then start the app:

```bash
open -a Docker
```

Wait until Docker Desktop reports that it is running, then verify the Docker daemon:

```bash
docker info
```

If `docker info` fails with a message like `failed to connect to the docker API` or `Cannot connect to the Docker daemon`, Docker is installed but the daemon is not running. Open Docker Desktop and wait for it to finish starting before continuing.

Check Compose:

```bash
docker-compose --version
```

If your Docker Desktop install provides Compose v2, this may also work:

```bash
docker compose version
```

The local commands below use `docker-compose` because it works across more local installs. If your machine only supports Compose v2, replace `docker-compose` with `docker compose`.

Validate Docker Compose:

```bash
docker-compose --env-file .env.nakama.local --profile nakama config
```

If `docker-compose` does not support `--env-file`, use Compose's default `.env` loading:

```bash
cp .env.nakama.local .env
COMPOSE_PROFILES=nakama docker-compose config
```

`.env` is ignored by git. Remove it when you no longer need the local Docker fallback:

```bash
rm .env
```

If you prefer Compose v2 and see `docker: unknown command: docker compose`, update Docker Desktop or install the Compose plugin:

```bash
brew install docker-compose
mkdir -p ~/.docker/cli-plugins
ln -sfn "$(brew --prefix)/opt/docker-compose/bin/docker-compose" ~/.docker/cli-plugins/docker-compose
docker compose version
```

### Podman Alternative

If Docker Desktop is restricted on your machine, use Podman with `podman-compose`:

```bash
brew install podman podman-compose
podman machine init --cpus 4 --memory 6 --disk-size 30
podman machine start
podman info
```

Validate the Compose file with Podman:

```bash
podman-compose --env-file .env.nakama.local --profile nakama config
```

Start the local stack with Podman:

```bash
podman-compose --env-file .env.nakama.local --profile nakama up --build
```

Check running services and Nakama logs:

```bash
podman-compose --env-file .env.nakama.local --profile nakama ps
podman-compose --env-file .env.nakama.local --profile nakama logs -f nakama
```

Stop the Podman stack:

```bash
podman-compose --env-file .env.nakama.local --profile nakama down
```

Remove local Nakama Postgres data when you need a clean Podman database:

```bash
podman-compose --env-file .env.nakama.local --profile nakama down -v
```

If your Podman install exposes `podman compose`, that may also work:

```bash
podman compose --env-file .env.nakama.local --profile nakama up --build
```

Podman Compose compatibility is close to Docker Compose but not identical. If it fails on service health dependencies, use the Docker-free native Nakama path or add a local Podman override.

Start the local stack:

```bash
docker-compose --env-file .env.nakama.local --profile nakama up --build
```

If you had to use the `.env` fallback above:

```bash
cp .env.nakama.local .env
COMPOSE_PROFILES=nakama docker-compose up --build
```

The first startup downloads Postgres and Nakama images, then builds the Next app image. It requires the Docker daemon to be running.

Expected local URLs:

```text
Next app:        http://localhost:3000
Nakama API:     http://127.0.0.1:7350
Nakama console: http://127.0.0.1:7351
Postgres:       127.0.0.1:5433
```

Check running services and logs:

```bash
docker-compose --env-file .env.nakama.local --profile nakama ps
docker-compose --env-file .env.nakama.local --profile nakama logs -f nakama
```

For the `.env` fallback, use the same commands without `--env-file`:

```bash
COMPOSE_PROFILES=nakama docker-compose ps
COMPOSE_PROFILES=nakama docker-compose logs -f nakama
```

The Nakama logs should include:

```text
Play With Friends Nakama runtime loaded.
```

Open the Nakama console:

```text
http://127.0.0.1:7351
```

Use `NAKAMA_CONSOLE_USERNAME` and `NAKAMA_CONSOLE_PASSWORD` from `.env.nakama.local`.

Smoke check the current Play With Friends route:

```text
http://localhost:3000/experiments/playwithfriends
```

Smoke check the Nakama-backed lobby and Tic Tac Toe route:

```text
http://localhost:3000/experiments/playwithfriends/nakama
```

The original route is still the local mock prototype. The Nakama route creates/logs in a device user, creates or joins a relayed match, tracks presences, and syncs Tic Tac Toe state through Nakama match data.

If create/login shows `failed to fetch`, first check the fields on the Nakama route:

```text
Host: 3.108.212.210
Port: 7350
Use SSL: off when testing through http://3.108.212.210:3000
Server key: the value of NAKAMA_SOCKET_SERVER_KEY / NEXT_PUBLIC_NAKAMA_SERVER_KEY
```

The host field must not be `127.0.0.1` unless Nakama is running on the same machine as the browser. If the fields are correct, verify that the EC2 security group allows inbound TCP `7350` from your IP. If the portfolio page is served over HTTPS, expose Nakama behind HTTPS/WSS and set `NEXT_PUBLIC_NAKAMA_USE_SSL=true`; browsers block HTTPS pages from calling a plain HTTP/WebSocket Nakama endpoint.

Stop the local stack:

```bash
docker-compose --env-file .env.nakama.local --profile nakama down
```

Remove local Nakama Postgres data when you need a clean database:

```bash
docker-compose --env-file .env.nakama.local --profile nakama down -v
```

For the `.env` fallback:

```bash
COMPOSE_PROFILES=nakama docker-compose down
COMPOSE_PROFILES=nakama docker-compose down -v
rm .env
```

## Production Deployment Notes

The deploy workflow uses GitHub Actions production secrets and variables to write `.env.production` on the server, then starts the Compose stack with the `nakama` profile.

Deployments pull only the `web` and `nakama` images, ensure `nakama-postgres` exists with `--no-recreate`, then force-recreate only `web` and `nakama`. Postgres is not force-restarted and the `nakama_postgres_data` volume is not removed by the deploy workflow.

Before deploying, SSH into the server and confirm Docker Engine is running:

```bash
docker --version
docker info
```

Then check Docker Compose. The deploy workflow requires Compose v2:

```bash
docker compose version
```

If that command does not work, install the Compose v2 plugin. If the server has a broken Docker apt source from a previous attempt, remove that source first:

```bash
sudo rm -f /etc/apt/sources.list.d/docker.list
```

Then install the Compose plugin from Docker's repository:

```bash
sudo apt-get update
sudo apt-get install -y docker-compose-plugin
docker compose version
```

### Open Production Nakama Console

The Nakama console is bound to `127.0.0.1` on the server, so open it through an SSH tunnel from your local machine:

```bash
ssh -N -L 7351:127.0.0.1:7351 tspServer
```

Keep that terminal open, then open this URL in your browser:

```text
http://127.0.0.1:7351
```

Use `NAKAMA_CONSOLE_USERNAME` and `NAKAMA_CONSOLE_PASSWORD` from the production secrets.

If local port `7351` is already in use, forward a different local port:

```bash
ssh -N -L 17351:127.0.0.1:7351 tspServer
```

Then open:

```text
http://127.0.0.1:17351
```

Required production secrets:

```text
SSH_HOST
SSH_USER
SSH_KEY
NAKAMA_POSTGRES_USER
NAKAMA_POSTGRES_PASSWORD
NAKAMA_SOCKET_SERVER_KEY
NAKAMA_SESSION_ENCRYPTION_KEY
NAKAMA_SESSION_REFRESH_ENCRYPTION_KEY
NAKAMA_RUNTIME_HTTP_KEY
NAKAMA_CONSOLE_USERNAME
NAKAMA_CONSOLE_PASSWORD
```

Required production variables:

```text
NEXT_PUBLIC_NAKAMA_HOST
NEXT_PUBLIC_NAKAMA_PORT
NEXT_PUBLIC_NAKAMA_USE_SSL
```

Keep Nakama console, gRPC, and Postgres ports private. Use the public Nakama HTTP/WebSocket endpoint behind TLS for browser clients.
