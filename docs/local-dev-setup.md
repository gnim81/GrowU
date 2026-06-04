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

```bash
npm install
```

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

## Translation Prompt

Translate this document into Simplified Chinese for public local development documentation. Keep Markdown structure, commands, filenames, environment variable names, and route paths unchanged. Preserve the warnings about generating your own passwords, URL-encoding database credentials when needed, and using `AUTH_COOKIE_SECURE=false` for local HTTP or LAN testing.
