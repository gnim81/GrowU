# Contributing to GrowU

Thanks for contributing to GrowU. This guide covers the minimum expectations for public contributions so changes are reviewable, reproducible, and safe to release.

## Development setup

Install dependencies and start the local development workflow:

```bash
npm install
npm run prisma:generate
npm run prisma:migrate
npm run dev
```

## Before opening a pull request

Run the standard checks before asking for review:

```bash
npm run typecheck
npm test
npm run build
```

## Pull request guidance

- Keep changes focused. Prefer small pull requests with one clear purpose.
- Add or update tests when business rules, validation, access control, or other user-visible logic changes.
- Update documentation when behavior, configuration, setup, or deployment expectations change.
- Describe any schema, environment, or rollout considerations in the pull request.

## Public contribution safety

Do not include any of the following in commits, issues, pull requests, screenshots, or generated artifacts:

- Credentials, secrets, tokens, passwords, or connection strings
- Personal data or other sensitive real-world records
- Local planning docs, including anything kept only for internal workflows
- Generated tool artifacts that are not intended for the public repository

If you are unsure whether something is safe to publish, remove it first and ask a maintainer through the repository's preferred communication channels.

## Translation Prompt

For a Simplified Chinese translation, translate this document accurately, keep command names unchanged, preserve Markdown structure, and retain all safety warnings.
