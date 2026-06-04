# Upgrading GrowU

This guide is for existing GrowU deployments that are moving to the current open-source release-hardening branch.

## Before You Start

Back up both of these before making any change:

- the PostgreSQL database
- the current environment file or secret configuration

If you are using Docker, also record the current image tag or commit reference so you can roll back quickly.

## Upgrade Overview

Current GrowU uses database-backed `UserAccount` records. Legacy environment-defined accounts remain supported only as a one-time import source through `GROWU_ACCOUNTS` and `npm run migrate:legacy-accounts`.

Fresh installations should use `/setup`. Existing installations upgrading from legacy accounts should import them once, verify access, and then remove `GROWU_ACCOUNTS`.

## Standard Node.js Upgrade Path

1. Update the code:

```bash
git pull
```

2. Install dependencies:

```bash
npm install
```

3. Apply database migrations:

```bash
npm run prisma:deploy
```

4. If you are upgrading from legacy `GROWU_ACCOUNTS`, run:

```bash
npm run migrate:legacy-accounts
```

5. Start or restart the app, then verify:

- `/login` loads
- imported or existing users can sign in
- `/settings/accounts` is available to admins

6. After a successful legacy import, remove `GROWU_ACCOUNTS` from your environment configuration.

## Legacy Account Migration Details

Use this only if your existing deployment still defines accounts through `GROWU_ACCOUNTS`.

Recommended sequence:

```bash
npm install
npm run prisma:deploy
npm run migrate:legacy-accounts
```

Then verify:

- the expected users exist in the database
- login works at `/login`
- at least one enabled admin account is present

The import only runs into an empty account table. If accounts already exist, the import is skipped intentionally to avoid overwriting database-backed account management.

## Docker Upgrade Path

Before upgrading:

1. Back up the PostgreSQL volume or create a database dump
2. Back up `.env`
3. Confirm `.env` contains explicit values for:
   - `POSTGRES_PASSWORD`
   - `DATABASE_URL`
   - `AUTH_SECRET`

The `DATABASE_URL` must be explicitly supplied. If the embedded password contains reserved URI characters, URL-encode that password segment.

Then update and restart:

```bash
docker compose up --build -d
```

Startup runs:

- `npm run prisma:deploy`
- `npm run migrate:legacy-accounts`

After the containers are healthy, verify:

- `/login` responds
- admin sign-in works
- `/settings/accounts` loads for admins

If you used `GROWU_ACCOUNTS` for import, remove it after verification and restart the stack.

## Rollback Guidance

If the upgrade fails:

1. Stop the updated app
2. Restore the previous code or image version
3. Restore the database backup if migrations or imports produced an unusable state
4. Restore the previous environment configuration
5. Start the previous version and verify login and core workflows

Do not attempt rollback without a database backup if schema or account data changed during the upgrade.

## Post-Upgrade Checklist

- `/login` works
- `/setup` is no longer shown when accounts already exist
- admins can open `/settings/accounts`
- at least one enabled admin remains
- transactions, CSV export, and historical data still look correct
- `GROWU_ACCOUNTS` has been removed after a successful import

## Translation Prompt

Translate this document into Simplified Chinese for public upgrade documentation. Keep Markdown structure, command lines, filenames, environment variable names, and route paths unchanged. Preserve the exact upgrade order, the one-time legacy import guidance, the explicit `DATABASE_URL` warning, and the rollback instructions.
