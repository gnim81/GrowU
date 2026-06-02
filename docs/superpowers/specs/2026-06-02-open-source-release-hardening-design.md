# GrowU Open Source Release Hardening Design

This is a local planning artifact. It may be kept in local development history, but it must not be included in the GitHub-facing public repository content.

## Goal

Prepare GrowU for a formal public GitHub release as a single-family, self-hosted, open source web app. The release should let an unfamiliar user deploy the app, understand the project, and safely maintain family learning-progress records.

This release is not just a packaging pass. It includes product changes needed for public use:

- database-backed application account management;
- safer data retention behavior;
- Docker and non-Docker deployment paths;
- automated tests for critical business rules;
- upgrade tooling for existing deployments;
- public-facing documentation, translation handoff prompts, and repository hygiene.

The first public release should be stable enough for outside users and contributors, while keeping community process lightweight.

## Non-Goals

This release will not include:

- multi-family or multi-tenant data isolation;
- child-owned accounts;
- public registration;
- password reset by email;
- third-party login;
- mobile native apps;
- automated cloud-provider deployment.

## Current Gaps

The existing app is already usable, but it has gaps that matter before opening the repository:

- `package.json` is still marked `private`.
- Accounts are configured through `GROWU_ACCOUNTS` in environment variables.
- Local setup documentation includes fixed example credentials.
- Current implementation includes hard-delete flows for children and items.
- `docs/growu-v1-plan.md` says children and items should be disabled instead of hard-deleted, which conflicts with current behavior.
- There is no automated test suite for core business rules.
- There is no Docker Compose quick-start path.
- Public project files such as license, contribution guide, security policy, CI, and issue/PR templates are missing.
- Existing deployments need an explicit upgrade path to the new account model.

## Release Approach

Use a release-hardening first approach:

1. Make the product safe and understandable for self-hosted public use.
2. Add essential tests and CI.
3. Add deployment, upgrade, and contributor documentation.
4. Defer larger product and community maturity features until after the first public release.

This balances the formal-release target with manageable scope.

## Architecture

Keep the app as a single Next.js App Router full-stack repository. Do not split frontend and backend.

Recommended module boundaries:

- `src/lib/auth.ts`: session handling, password verification, current-user resolution.
- `src/lib/accounts.ts`: account queries, account creation, updates, disabling, password changes, admin checks.
- `src/app/actions.ts`: server actions for page flows. Account and complex business logic should move into `src/lib/*` helpers where practical so this file does not continue to grow unchecked.
- `prisma/schema.prisma`: database schema for accounts and existing point-tracking models.
- `/setup`: first-run administrator creation.
- `/settings/accounts`: administrator account management.

All existing point, child, item, transaction, revision, stats, and CSV features stay in the same app.

## Account Model

Replace environment-configured login accounts with database-backed accounts for new installs.

Add:

```prisma
model UserAccount {
  id           String   @id @default(cuid())
  username     String   @unique
  displayName  String
  passwordHash String
  role         UserRole @default(PARENT)
  enabled      Boolean  @default(true)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}

enum UserRole {
  ADMIN
  PARENT
}
```

Rules:

- If the database has no accounts, business pages redirect to `/setup`.
- `/setup` is available only while account count is zero.
- The first setup account is created as `ADMIN`.
- Login permits only `enabled=true` accounts.
- `ADMIN` users can manage accounts.
- `PARENT` users can use normal point-recording workflows but cannot manage accounts.
- Session payload should include `userId`, `username`, `displayName`, and `role`.
- Permission checks must consult the current database account state so disabled accounts cannot continue using an old cookie.
- Password hashing can keep the current PBKDF2 format to avoid adding authentication dependencies.
- Historical `createdByUsername` and `editedByUsername` fields remain username snapshots and are not rewritten.

Admin safety rules:

- Do not allow disabling the last enabled administrator.
- Do not allow an administrator to disable their own active account in the normal account-management UI.
- Username uniqueness errors must be shown as user-facing form errors.

## User Flows

### First Run Setup

- Visiting business pages when there are no accounts redirects to `/setup`.
- `/setup` collects username, display name, and password.
- Submitting setup creates the first `ADMIN`, signs the user in, and redirects to the dashboard.
- If accounts already exist, `/setup` redirects to the dashboard or login page.

### Login

- If there are no accounts, `/login` should direct users to `/setup`.
- If accounts exist, login checks database-backed credentials.
- Disabled accounts cannot log in.
- Failed login should show a clear page-level message.

### Account Management

- Add `/settings/accounts`.
- Show account list with username, display name, role, enabled state, and timestamps.
- Allow admins to add parent/admin accounts.
- Allow admins to edit display name, role, enabled state, and password.
- Prevent actions that would leave the system with no enabled admin.
- Add a settings/account link to the authenticated navigation for admins only.

## Data Protection

The public release should prefer preserving long-term family records.

Rules:

- Children are enabled or disabled; remove the normal hard-delete child flow.
- Items are enabled or disabled; remove the normal hard-delete item flow.
- Disabled children and items remain available for historical views and filters where needed.
- Historical point transactions and revision records are not deleted by disabling children or items.
- If data cleanup is needed later, design it separately as a maintenance or danger-zone tool outside this first public-release scope.

This also resolves the current mismatch between the V1 plan and implementation.

## Legacy Upgrade And Migration

Existing deployments must be able to upgrade without losing data.

Use two migration layers:

- Prisma migrations handle database structure changes, including the new `UserAccount` table.
- A separate legacy account import script converts old `GROWU_ACCOUNTS` environment accounts into database accounts.

Add a script such as:

```bash
npm run migrate:legacy-accounts
```

Behavior:

- Read `GROWU_ACCOUNTS` from the environment.
- Import enabled legacy accounts into `UserAccount`.
- If imported accounts do not have roles, make the first enabled account `ADMIN` and the rest `PARENT`.
- Preserve existing password hashes.
- If database accounts already exist, do not import duplicates or overwrite existing accounts.
- If `GROWU_ACCOUNTS` is missing, exit without destructive changes and tell the user to use `/setup`.
- Document that users must back up the database before upgrading.

Upgrade flow:

1. Back up the existing PostgreSQL database.
2. Pull or deploy the new version.
3. Run `npm install` or equivalent deployment dependency install.
4. Run `npm run prisma:deploy`.
5. Run `npm run migrate:legacy-accounts` if upgrading from the environment-account version.
6. Start the new app.
7. Confirm login and inspect existing children, items, transactions, stats, and CSV export.

## Testing

Add automated tests for critical business rules before public release. Full browser E2E coverage is not required for this first release.

Required coverage:

- password hash verification;
- database account login;
- disabled accounts cannot log in;
- setup creates the first admin;
- admins can add and disable accounts;
- the last enabled admin cannot be disabled;
- usernames are unique;
- bonus points are positive;
- penalty and reward transactions are negative;
- penalty can make balance negative;
- reward cannot overdraw balance;
- transaction edits create `TransactionRevision` records with correct before and after snapshots;
- CSV export respects filters and keeps stable Chinese headers/content handling;
- legacy account migration imports `GROWU_ACCOUNTS`;
- legacy migration does not duplicate accounts when accounts already exist;
- missing legacy account config is handled without destructive effects.

Testing should favor business/service functions and route/server-action helpers that can be exercised deterministically. Browser E2E tests can be added later if release risk justifies them.

## CI

Add GitHub Actions for pull requests and pushes.

Recommended jobs:

```bash
npm ci
npm run prisma:generate
npm run typecheck
npm run test
npm run build
```

Add or adjust package scripts:

- `typecheck`
- `test`
- `migrate:legacy-accounts`

The current `lint` script uses `next lint`. Before putting lint into CI, either replace it with a stable ESLint command or leave lint out of the required CI gate. CI should not include commands that are known to be obsolete or unreliable.

## Deployment

Support both:

- Docker Compose quick start for new public users.
- Existing Node.js + PostgreSQL manual deployment for users who prefer or already use that path.

Add:

- `Dockerfile`
- `compose.yaml`
- Docker-focused docs with environment setup, migrations, startup, upgrades, and backups.

Keep and update:

- non-Docker cloud deployment documentation;
- local development setup documentation.

Documentation should remove fixed local passwords and use generated secrets or clearly marked placeholders.

## Public And Local Content Boundary

The project must distinguish public repository content from local development artifacts.

Public GitHub-facing content:

- application source code;
- Prisma schema and migrations;
- public README and deployment documentation;
- public contribution, security, license, and issue/PR template files;
- tests, CI configuration, Docker files, and release scripts needed by outside contributors.

Local-only content:

- Superpowers design specs and implementation plans;
- AI/tool-generated working notes;
- local code graph or analysis directories such as `.codegraph/`;
- private deployment notes, private credentials, local-only troubleshooting notes, and personal workflow documents.

Rules:

- Local-only artifacts can be kept in local development history if useful for development.
- Local-only artifacts must not be pushed to the public GitHub repository.
- Follow the `awi-scan` pattern: use repository-local Git excludes, especially `.git/info/exclude`, for local-only paths such as `docs/superpowers/`, `.codegraph/`, and `.deepseek/`.
- Keep local-only paths out of the GitHub-bound index. If any local-only artifact has already been tracked, remove it from the GitHub-bound commit set before publishing.
- Before the first public push, run a repository-content review that checks both secrets and accidental local-only artifacts.

## Documentation

Rewrite documentation for outside users. The expected initial users are primarily Chinese readers, but public documentation can be drafted in English first. The Chinese versions should be translated and reviewed by the maintainer before public release. English versions are optional in the final public repo unless the maintainer wants to keep bilingual docs.

For each public-facing English documentation draft, provide a translation handoff prompt that the maintainer can use with another AI system. The prompt should specify:

- target audience: Chinese self-hosting users and contributors;
- tone: direct, natural, practical technical Chinese;
- preserve command blocks, paths, environment variable names, code snippets, and headings unless translation requires a clearer Chinese heading;
- avoid marketing language and avoid over-literal translation;
- flag any ambiguous source sentence instead of inventing details.

Required files and updates:

- `README.md`: English draft for project overview, features, screenshots or screen descriptions, quick start, deployment links, upgrade link, test commands, contribution link, plus translation handoff prompt.
- `docs/docker-deployment.md`: English draft for Docker Compose setup and operations, plus translation handoff prompt.
- `docs/cloud-deployment.md`: English draft for non-Docker deployment with no fixed passwords, plus translation handoff prompt.
- `docs/upgrading.md`: English draft for backup, schema migration, legacy account import, verification, rollback guidance, plus translation handoff prompt.
- `docs/developer-guide.md`: English draft for architecture, account model, data protection rules, testing workflow, contribution entry points, plus translation handoff prompt.
- `.env.example`: keep `DATABASE_URL`, `AUTH_SECRET`, `AUTH_COOKIE_SECURE`; document `GROWU_ACCOUNTS` only as a legacy migration input.
- `LICENSE`: use the MIT License for the first public release.
- `CONTRIBUTING.md`: basic contribution workflow.
- `SECURITY.md`: supported versions and vulnerability reporting.
- `.github/ISSUE_TEMPLATE/*`: basic bug report and feature request templates.
- `.github/PULL_REQUEST_TEMPLATE.md`: concise PR checklist.

## Repository Hygiene

Before opening the repository:

- remove or rewrite fixed passwords in docs;
- ensure `.env` and local private files are ignored;
- scan for secrets, IP addresses, family data, and personal deployment details;
- do not publish `.codegraph/`, `.deepseek/`, `docs/superpowers/`, or other local-only development artifacts to GitHub;
- add local-only patterns such as `docs/superpowers/`, `.codegraph/`, and `.deepseek/` to `.git/info/exclude`, following the `awi-scan` pattern;
- verify no local-only tracked files are included in the GitHub-bound commit set before pushing;
- remove `private: true` from `package.json`;
- add a `license` field to `package.json`;
- verify public docs do not describe the app as only a private family project.

## Acceptance Criteria

The public release is ready when:

- a new user can run the app through Docker Compose and create the first admin;
- a new user can follow non-Docker docs to deploy with Node.js and PostgreSQL;
- an existing environment-account deployment can import legacy accounts without losing children, items, transactions, or revisions;
- normal UI no longer exposes hard-delete child/item flows;
- account management is available to admins and hidden from parents;
- critical business tests pass;
- CI passes on GitHub;
- README and deployment docs contain no fixed production-like credentials;
- Chinese public documentation is translated and reviewed by the maintainer before release, with English drafts and translation handoff prompts available as source material;
- license, contribution guide, security policy, and basic issue/PR templates exist;
- a final secret/privacy/local-artifact scan finds no real private data or local-only planning/tool artifacts.
