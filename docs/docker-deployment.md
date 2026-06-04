# Docker Deployment

> [English](docker-deployment.md) | [简体中文](docker-deployment.zh-CN.md)

This guide covers Docker-based deployment for GrowU using the included `Dockerfile`, `compose.yaml`, and `.env.example`.

## Requirements

- Docker Engine with the Compose plugin
- A writable host environment for `.env`
- A strong, non-placeholder secret for authentication
- A PostgreSQL connection string supplied explicitly through `DATABASE_URL`

The bundled Compose setup starts both the app and PostgreSQL. Even in that setup, you must still provide `DATABASE_URL` explicitly.

## Environment Variables

Start by copying the template:

```bash
cp .env.example .env
```

Set these values before starting the stack:

- `POSTGRES_PASSWORD`: required for the PostgreSQL container
- `DATABASE_URL`: required for Prisma and the app runtime
- `AUTH_SECRET`: required for session signing
- `AUTH_COOKIE_SECURE`: set to `true` behind HTTPS, `false` only for local HTTP testing
- `GROWU_ACCOUNTS`: optional, only for importing legacy environment-configured accounts during an upgrade

Example shape:

```env
POSTGRES_PASSWORD="replace-with-a-strong-database-password"
DATABASE_URL="postgresql://growu:replace-with-a-url-encoded-password@db:5432/growu?schema=public"
AUTH_SECRET="replace-with-a-long-random-auth-secret"
AUTH_COOKIE_SECURE="false"
GROWU_ACCOUNTS=""
```

Do not leave placeholder production secrets in `.env`. Replace every example value before deployment.

If your database password contains reserved URI characters such as `@`, `:`, `/`, `?`, `#`, `&`, or `%`, URL-encode the password portion before placing it into `DATABASE_URL`.

## Start the Stack

```bash
docker compose up --build
```

The app container runs:

1. `npm run prisma:deploy`
2. `npm run migrate:legacy-accounts`
3. `npm run start -- --hostname 0.0.0.0 --port 3000`

Open the app at `http://localhost:3000`.

## First Run

On a new installation with no accounts in the database:

1. Visit `/setup`
2. Create the initial admin account
3. Sign in at `/login`
4. Manage future accounts at `/settings/accounts`

GrowU requires at least one enabled admin account. Do not disable the last enabled admin.

## Stop the Stack

To stop and remove containers while keeping the database volume:

```bash
docker compose down
```

To stop and remove containers and the named volume as part of an intentional reset:

```bash
docker compose down -v
```

Use `-v` only when you mean to delete the stored PostgreSQL data.

## Migrations

Startup already runs `npm run prisma:deploy`. If you want to run migrations manually inside the app container:

```bash
docker compose run --rm app npm run prisma:deploy
```

That command should be used before first traffic after an upgrade if you are validating the deployment manually.

## Legacy Account Migration

Legacy environment-configured accounts are supported only for upgrades.

If you are importing from `GROWU_ACCOUNTS`:

1. Set `GROWU_ACCOUNTS` in `.env`
2. Start the stack
3. The app container runs `npm run migrate:legacy-accounts`
4. Verify imported users can sign in at `/login`
5. Remove `GROWU_ACCOUNTS` from `.env` after a successful import

On a fresh installation, leave `GROWU_ACCOUNTS` empty and use `/setup` instead.

## Backup and Restore

Back up the PostgreSQL database before upgrades.

Example backup:

```bash
docker compose exec -T db pg_dump -U growu -d growu > growu-backup.sql
```

Example restore into an intentionally replaced database:

```bash
docker compose exec -T db psql -U growu -d growu < growu-backup.sql
```

If you need a full rollback, keep both:

- a database backup
- the previous application image or commit reference

## Troubleshooting

### App fails to start

Check logs:

```bash
docker compose logs app
```

Common causes:

- `DATABASE_URL` is missing
- `AUTH_SECRET` is missing
- the password embedded in `DATABASE_URL` was not URL-encoded
- placeholder secrets were left unchanged

### Database connection errors

Check:

- `POSTGRES_PASSWORD` and `DATABASE_URL` agree on the actual password
- `DATABASE_URL` points to the correct host and database name
- the connection string includes `?schema=public`

For the bundled Compose setup, the host in `DATABASE_URL` should normally be `db`.

### `/setup` redirects away immediately

That means an account already exists in the database. Sign in at `/login` instead, or inspect the database if you expected a fresh install.

### Legacy import does not create users

Check:

- `GROWU_ACCOUNTS` contains valid JSON
- the accounts have non-empty `username`, `displayName`, and `passwordHash`
- the database does not already contain accounts

If accounts already exist, the import is intentionally skipped.

## Translation Prompt

Translate this document into Simplified Chinese for public self-hosting documentation. Keep Markdown headings, code blocks, command lines, filenames, environment variable names, and route paths unchanged. Preserve all operational warnings, especially the notes about explicit `DATABASE_URL`, URL-encoding passwords, and replacing placeholder secrets.
