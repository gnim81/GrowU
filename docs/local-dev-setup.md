# Local Development Setup

> [English](local-dev-setup.md) | [简体中文](local-dev-setup.zh-CN.md)

This guide covers local development without Docker. It assumes you will run PostgreSQL locally and start the Next.js app directly from the repository.

## 1. Install PostgreSQL

Install PostgreSQL using your preferred package manager or the official installer for your operating system.

Verify that:

- PostgreSQL is installed
- the server is running
- `psql` is available on your shell path

## 2. Create a Local Database and User

Create a database and a dedicated user with your own generated password. Example SQL:

```sql
CREATE USER growu WITH PASSWORD 'replace-with-your-generated-local-password';
CREATE DATABASE growu OWNER growu;
```

If your password contains reserved URI characters such as `@`, `:`, `/`, `?`, or `#`, URL-encode the password segment before placing it in `DATABASE_URL`.

## 3. Create `.env`

Copy the template:

```bash
cp .env.example .env
```

Then edit `.env` and set at least:

```env
DATABASE_URL="postgresql://growu:replace-with-a-url-encoded-password@localhost:5432/growu?schema=public"
AUTH_SECRET="replace-with-a-long-random-auth-secret"
AUTH_COOKIE_SECURE="false"
GROWU_ACCOUNTS=""
```

For ordinary local HTTP development, keep `AUTH_COOKIE_SECURE=false`.

That setting is also useful for mobile or LAN testing over HTTP. If you later test through HTTPS locally, you can switch it to `true`.

## 4. Install Dependencies

This project pins exact dependency versions in `package.json` (no `^` ranges) and ships a committed `package-lock.json`. Install dependencies with one of the commands below — both respect the locked versions.

```bash
npm ci        # recommended: installs exactly what the lock file records
# or
npm install   # also fine; npm respects the committed lock file by default
```

> **Do not run `npm install <package>@latest` or `npm update`.** Dependencies are pinned to versions this project is built and tested against. Upgrading a major version (for example `tailwindcss` v3 → v4, or `next` 15 → 16) will break the build because the code is written for the pinned major versions. If you genuinely need to upgrade, treat it as a dedicated migration task and update the lock file deliberately.

### Node.js version

The project targets Node.js 24 (see `.nvmrc`). If you use a Node version manager, run `nvm use` to switch to the expected version before installing dependencies.

## 5. Apply Database Migrations

```bash
npm run prisma:deploy
```

## 6. Start the Development Server

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

## 7. First-Run Setup

On a new local database:

1. Visit `/setup`
2. Create the initial admin account
3. Sign in at `/login`

Do not configure local accounts through environment variables for normal development. `GROWU_ACCOUNTS` is only for upgrade-import testing.

## 8. Optional Production-Mode Local Check

If you want to test the production build locally:

```bash
npm run build
npm run start
```
