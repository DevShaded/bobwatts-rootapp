---
name: root-app-persistence
description: Design, implement, or review persistent state for Root Apps. Use for SQLite, key-value storage, settings, XP, moderation records, migrations, retention, and scheduled work that must survive restarts.
---

# Root App Persistence

## Scope

Explain storage choices for guidance requests. Create schemas, migrations,
or code only when implementation is requested.

## Official references

- https://docs.rootapp.com/docs/app-docs/develop/server/persistence/
- https://docs.rootapp.com/docs/app-docs/develop/server/persistence/persistence-sqlite/
- https://docs.rootapp.com/docs/app-docs/develop/server/

Follow the server guide's Job scheduler section for durable scheduling.

Verify database configuration, supported libraries, and scheduler signatures
against the current SDK. Do not invent paths or connection options.

## Choose storage

Root provides key-value storage and SQLite persistence.

As a project recommendation:
- Prefer key-value storage for small independent settings.
- Prefer SQLite for searchable histories, relationships, rankings,
  constraints, and transactional updates.

Inspect existing storage before introducing another database or ORM.

## Data design

1. Identify durable state, temporary caches, and derived values.
2. Define ownership, identifiers, timestamps, and access rules.
3. Add only the indexes and constraints needed by actual queries.
4. Define retention and deletion behavior.
5. Implement versioned migrations before dependent handlers run.

Treat each installed community's data as isolated. Do not assume a shared
cross-community database or automatic migration between Bot and App IDs.

## Reliable writes

- Use parameterized queries or a suitable query builder.
- Use transactions for related local changes.
- Make XP increments atomic and define cooldown behavior explicitly.
- Deduplicate repeated work when a stable operation or event key exists.
- Do not assume event delivery is exactly once or ordered unless documented.
- Keep transactions short; avoid holding them across network calls.
- Recognize that a local transaction cannot roll back a Root API action.
- Record operation outcomes and reconcile partial failures where necessary.

## Scheduled work

Use Root's job scheduler for work that must survive restarts.

Persist the job's target and intent. Recheck current configuration and
authorization when it runs. Make handlers safe to retry, and handle targets
that were deleted or changed after scheduling.

Do not use in-memory timers as the sole record of durable work.

## Verification

For material changes, check migration behavior, concurrent updates,
duplicate execution, restart persistence, retention, and query pagination.

Never delete a user's database merely to resolve a development mismatch
without explaining the data loss and obtaining authorization.

Report migration requirements and verification limits.
