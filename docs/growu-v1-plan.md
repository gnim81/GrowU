# GrowU V1 Plan

## Product Goal

GrowU V1 is a responsive web application for tracking positive reinforcement and point-based progress for children. It is designed for parents or guardians who want a simple way to record bonus events, penalties, reward redemption, transaction history, edits, statistics, and CSV exports while preserving historical records.

## In Scope

- Database-backed user accounts
- First-run admin setup through `/setup`
- Login at `/login`
- Admin account management at `/settings/accounts`
- Child profile management
- Bonus, penalty, and reward item management
- Point transaction creation
- Reward redemption with balance checks
- Transaction editing with revision audit history
- Statistics and CSV export
- Mobile-friendly and desktop-compatible UI

## Out of Scope

- Child self-service accounts
- Multi-family or multi-tenant support
- Offline mode
- Push notifications
- Attachments or evidence uploads
- Automatic recurring resets
- Deployment automation beyond documented self-hosting flows

## Technical Baseline

- Next.js App Router
- TypeScript
- Tailwind CSS
- Prisma
- PostgreSQL
- Standard Node.js deployment or Docker-based self-hosting

## Current Account Model

GrowU now stores accounts in the database through `UserAccount`.

Rules:

- A fresh installation creates the first admin through `/setup`
- Users sign in at `/login`
- Admins manage accounts at `/settings/accounts`
- At least one enabled admin account must always remain
- `GROWU_ACCOUNTS` exists only as a legacy import source during upgrades

## Data Rules

### `UserAccount`

- Stores login identity, display name, password hash, role, and enabled state
- Supports `ADMIN` and `PARENT` roles
- Must preserve at least one enabled admin

### `Child`

- Children can be created, edited, and disabled
- Normal product flows do not hard-delete children
- Historical transactions must remain visible after a child is disabled

### `PointItem`

- Bonus, penalty, and reward items can be created, edited, and disabled
- Normal product flows do not hard-delete items
- Disabled items should disappear from new-entry pickers but remain meaningful in history

### `PointTransaction`

- Stores all point changes
- Uses integer point values
- Bonus transactions increase balance
- Penalty transactions decrease balance and may go below zero
- Reward transactions decrease balance and must fail when balance would go below zero
- Historical item display relies on `itemNameSnapshot`

### `TransactionRevision`

- Stores before/after snapshots of edits
- Records the reason, editor, and timestamp
- Provides an audit trail for transaction changes

## Functional Acceptance Criteria

### Authentication and setup

- When no account exists, `/setup` allows creation of the initial admin
- Valid credentials can sign in at `/login`
- Invalid or disabled accounts cannot sign in
- Unauthenticated access to protected pages redirects to login
- Admins can manage accounts at `/settings/accounts`
- The app prevents removal or disabling of the last enabled admin

### Dashboard

- Shows active children and current balances
- Reflects transaction totals accurately
- Provides clear navigation to transaction entry, history, and reporting flows

### Child management

- Supports creating, editing, and disabling children
- Disabled children do not appear in new transaction defaults
- Historical data remains visible for disabled children

### Item management

- Supports creating, editing, and disabling bonus, penalty, and reward items
- Disabled items do not appear in new transaction choices
- Historical transaction rendering remains intact after item edits or disablement

### Transaction entry

- Bonus entries increase balance
- Penalty entries decrease balance
- Reward redemption decreases balance only when enough points exist
- Transactions store the child, item, snapshot name, points, note, and occurrence time

### Transaction history and editing

- Transactions are filterable by child, type, and date range
- Editing a transaction updates current balances correctly
- Every edit creates a `TransactionRevision`
- Historical item names remain readable through `itemNameSnapshot`

### Statistics and export

- Aggregated statistics match filtered transaction totals
- CSV export matches the selected transaction set
- Chinese content remains readable in exported CSV files

## Deployment Expectations

- The project should remain deployable with Node.js plus PostgreSQL
- Docker deployment should remain supported through the included `Dockerfile` and `compose.yaml`
- Environment configuration must use explicit `DATABASE_URL`, `AUTH_SECRET`, and related runtime settings

## Translation Prompt

Translate this document into Simplified Chinese for public product-planning documentation. Keep Markdown structure, schema names, role names such as `ADMIN` and `PARENT`, code identifiers, environment variable names, and route paths unchanged. Preserve the distinction between current database-backed accounts and legacy upgrade-only `GROWU_ACCOUNTS`, along with the acceptance criteria and data-retention rules.
