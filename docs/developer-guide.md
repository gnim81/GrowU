# Developer Guide

> [English](developer-guide.md) | [简体中文](developer-guide.zh-CN.md)

This guide is for maintainers, contributors, and AI tools working on GrowU after the public release. It describes the current architecture, key business rules, and the files that define the product's durable behavior.

## Project Overview

GrowU is a single-repository Next.js application for tracking positive reinforcement, point changes, and reward redemption for children. It uses a server-rendered App Router frontend, server actions for writes, Prisma for persistence, and PostgreSQL as the system of record.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Prisma
- PostgreSQL

## Core Account Model

GrowU now uses database-backed `UserAccount` records instead of an environment-defined account list.

Key files:

- `src/lib/accounts.ts`
- `src/app/setup/page.tsx`
- `src/app/(app)/settings/accounts/page.tsx`
- `src/app/login/page.tsx`

Current behavior:

- On an empty database, `/setup` creates the initial admin account.
- Users sign in at `/login`.
- Admins manage accounts at `/settings/accounts`.
- The system must always retain at least one enabled admin account.
- `GROWU_ACCOUNTS` remains only as a legacy import source for upgrades.

## Architecture Notes

### App entry points

- `src/app/setup/page.tsx`: first-run admin creation
- `src/app/login/page.tsx`: sign-in flow
- `src/app/(app)/page.tsx`: dashboard
- `src/app/(app)/children/page.tsx`: child management
- `src/app/(app)/items/page.tsx`: point item management
- `src/app/(app)/transactions/page.tsx`: transaction history and filtering
- `src/app/(app)/transactions/[id]/page.tsx`: transaction detail and revision history
- `src/app/(app)/transactions/export/route.ts`: export endpoint
- `src/app/(app)/stats/page.tsx`: reporting

### Server-side write orchestration

- `src/app/actions.ts` centralizes most authenticated write paths

New mutations should follow the same pattern unless there is a strong reason to create a separate boundary.

### Business logic helpers

- `src/lib/accounts.ts`: account validation, hashing, initial admin creation, legacy import, admin guard rules
- `src/lib/transactions.ts`: transaction normalization, reward balance checks, revision snapshots
- `src/lib/csv.ts`: CSV generation for exported transaction data
- `src/lib/points.ts`: point summaries and transaction labeling
- `src/lib/date-range.ts`: date range validation
- `src/lib/transaction-trends.ts`: trend aggregation

## Data Model Highlights

See `prisma/schema.prisma` for the full schema.

### `UserAccount`

Fields include:

- `username`
- `displayName`
- `passwordHash`
- `role`
- `enabled`

Roles currently include `ADMIN` and `PARENT`.

### `Child`

Children are not hard-deleted through normal product flows. They are disabled by setting `enabled=false` so historical transactions remain intact.

### `PointItem`

Items are also disable-only in normal flows. This protects historical records and lets the UI hide inactive choices without rewriting the past.

### `PointTransaction`

Important fields include:

- `childId`
- `type`
- `itemId`
- `itemNameSnapshot`
- `points`
- `note`
- `occurredAt`
- `createdByUsername`

`itemNameSnapshot` is a deliberate historical snapshot. Do not replace it with display logic that depends only on the current item name.

### `TransactionRevision`

Edits are audited through `TransactionRevision`, which stores before/after snapshots plus edit metadata.

## Business Rules That Should Not Drift

- Children are disabled, not hard-deleted, in normal product flows.
- Point items are disabled, not hard-deleted, in normal product flows.
- Reward redemption must fail if it would push the balance below zero.
- Penalty transactions may reduce the balance below zero.
- Transaction history must keep `itemNameSnapshot` for historical readability.
- Transaction edits must write revision history through `TransactionRevision`.
- The account system must keep at least one enabled admin.
- CSV export should preserve readable Chinese content in the generated file.

## Commands

Generate Prisma client:

```bash
npm run prisma:generate
```

Type-check:

```bash
npm run typecheck
```

Run tests:

```bash
npm test
```

Build:

```bash
npm run build
```

## Local-Only Artifacts

These locations are local planning or tool artifacts and should not be treated as public release documentation:

- `docs/superpowers`
- `.codegraph`
- `.deepseek`

They are local-only and excluded through `.git/info/exclude`. Do not submit them in a public pull request.

In linked worktrees, the effective exclude file may live in the common Git directory rather than in the worktree's `.git` pointer file. Use `git rev-parse --git-common-dir` if you need to find the exact local path.

## Contributor Guidance

- Read this guide before changing account, transaction, or export behavior.
- Prefer extending existing helpers over duplicating business rules in page components.
- Keep data-retention rules intact unless the product explicitly changes them.
- When documenting or changing auth, reflect the current `UserAccount` model rather than the legacy environment-based import path.
