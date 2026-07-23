# test-fe-be-db

Small full-stack experiment: **frontend** (`fe/`) talks to an **Express backend** (`be/`), which stores data in **Postgres** running in **Docker**.

## What Docker is doing here

- **Docker** runs an app (Postgres) inside an isolated **container** — like a lightweight VM with only Postgres installed.
- **Docker Compose** reads [`docker-compose.yml`](docker-compose.yml) and starts that container with the right ports, password, and storage.
- Your **Node backend still runs on your machine** (not inside Docker). It connects to Postgres at `localhost:5432` because Compose maps the container port to your host.

```
[ Browser / curl ] → [ Express on :3000 ] → [ Postgres container on :5432 ]
```

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running
- Node.js + npm

## 1. Start Postgres

From the **repo root**:

```bash
docker compose up -d
```

Or from `be/`:

```bash
npm run db:up
```

| Piece | Meaning |
| --- | --- |
| `docker compose` | Use the Compose CLI with `docker-compose.yml` in this folder |
| `up` | Create and start services |
| `-d` | Detached (background) so your terminal is free |

First run downloads the `postgres:16-alpine` image (one-time). Check it is up:

```bash
docker compose ps
```

You should see service `db` as running / healthy.

## 2. Configure the backend

```bash
cd be
copy .env.example .env
npm install
```

`.env` must match the user/password/database in `docker-compose.yml` (`app` / `app` / `appdb`). `.env` is gitignored so secrets stay local.

## 3. Start the backend

```bash
npm run start-be
```

On success you should see:

- `Database ready: notes table exists (or was created)`
- `Example app listening on port 3000`

If Postgres is not running, the process exits with a hint to run `docker compose up -d`.

## 4. Try the API

PowerShell examples (Windows). Adjust if you use Git Bash / curl differently.

### Health (DB ping)

```powershell
Invoke-RestMethod http://localhost:3000/health
```

### Create a note

```powershell
Invoke-RestMethod -Method POST -Uri http://localhost:3000/notes `
  -ContentType 'application/json' `
  -Body '{"title":"First note","body":"Hello Postgres"}'
```

### List notes

```powershell
Invoke-RestMethod http://localhost:3000/notes
```

### Get one note (use an id from the list)

```powershell
Invoke-RestMethod http://localhost:3000/notes/1
```

### Update a note

```powershell
Invoke-RestMethod -Method PUT -Uri http://localhost:3000/notes/1 `
  -ContentType 'application/json' `
  -Body '{"title":"Updated title","body":"Updated body"}'
```

### Delete a note

```powershell
Invoke-RestMethod -Method DELETE -Uri http://localhost:3000/notes/1
```

### Hello (no DB)

```powershell
Invoke-RestMethod http://localhost:3000/
```

Equivalent `curl` (Git Bash / WSL / macOS / Linux):

```bash
curl http://localhost:3000/health
curl -X POST http://localhost:3000/notes -H "Content-Type: application/json" -d "{\"title\":\"First note\",\"body\":\"Hello Postgres\"}"
curl http://localhost:3000/notes
curl http://localhost:3000/notes/1
curl -X PUT http://localhost:3000/notes/1 -H "Content-Type: application/json" -d "{\"title\":\"Updated\",\"body\":\"Updated body\"}"
curl -X DELETE http://localhost:3000/notes/1
```

## 5. Peek inside Postgres

Open an interactive `psql` shell **inside** the container:

```bash
docker compose exec db psql -U app -d appdb
```

| Piece | Meaning |
| --- | --- |
| `exec` | Run a command in an already-running container |
| `db` | Service name from `docker-compose.yml` |
| `psql` | Postgres CLI |
| `-U app -d appdb` | User and database created by Compose env vars |

Useful SQL once inside:

```sql
\dt
SELECT * FROM notes;
\q
```

## 6. Stop or reset the database

Stop the container but **keep** note data (volume stays):

```bash
docker compose down
```

Or from `be/`: `npm run db:down`.

Stop **and delete** stored data (fresh empty DB next time):

```bash
docker compose down -v
```

`-v` removes the named volume `pgdata`.

## Project layout (backend + DB)

| Path | Role |
| --- | --- |
| [`docker-compose.yml`](docker-compose.yml) | How Docker runs Postgres |
| [`be/.env.example`](be/.env.example) | Template for connection settings |
| [`be/src/db.js`](be/src/db.js) | Connection pool (`pg`) |
| [`be/src/init-db.js`](be/src/init-db.js) | Creates `notes` table on startup |
| [`be/src/index.js`](be/src/index.js) | HTTP routes: `/`, `/health`, `/notes` CRUD |

## Notes table

| Column | Type | Notes |
| --- | --- | --- |
| `id` | SERIAL | Auto-increment primary key |
| `title` | TEXT | Required |
| `body` | TEXT | Defaults to empty string |
| `created_at` | TIMESTAMPTZ | Set automatically on insert |
