# Development setup design

Status: implemented; verification results below.

## Settled requirements

- Use Docker Compose for local development, initially on Linux.
- Run the Root backend and the frontend through Compose. Production remains
  published through Root.
- Keep React and Vite, upgrading to React 19 for Arc UI. Next.js is not required.
- Use Prisma with SQLite for backend persistence.
- Use Arc UI at uiarc.dev instead of Root's UI styling package.
  Keep the Root SDK for platform integration and client-server communication.
- Check technology compatibility through documentation and local verification.
  Contacting Root support is not requested.
- Reload the frontend and backend automatically after source changes, and
  preserve SQLite data across container replacement.
- Limit this milestone to infrastructure, Prisma setup, and styling the echo
  demo. Product features and their database tables come later.

## Verified constraints

- The original starter used React 18 and Vite, a TypeScript backend launched by
  Root DevHost, and a generated Protocol Buffers echo service. It had no
  application persistence or Docker configuration at the start of this work.
- [Root permits third-party frontend frameworks and packages](https://docs.rootapp.com/docs/app-docs/develop/client/client-project-overview/).
  Its packaged client runs in a browser-like environment with networking
  restrictions.
- [Root documents Prisma with SQLite](https://docs.rootapp.com/docs/app-docs/tutorials/tasks-app/prisma/).
  The tutorial uses Prisma 6 and demonstrates initial table creation, not a
  complete versioned migration strategy.
- [SQLite must use Root's runtime-provided database filename](https://docs.rootapp.com/docs/app-docs/develop/server/persistence/persistence-sqlite/):
  `rootServer.dataStore.config.sqlite3.filename`. Root backs up this database;
  the documented storage limit is 500 MB per instance.
- [Root's production backend runtime](https://docs.rootapp.com/docs/app-docs/develop/server/server-project-overview/)
  is Node 24 on Alpine Linux x64 with CommonJS. Native dependencies must match
  that target because packaging does not rebuild them.
- The installed SDK's DevHost starts the backend as a child process. Linux
  container startup and a real echo round trip were verified with SDK 0.21.3;
  this is project verification, not a claim of official Docker support.
  Development requires Root connectivity and a development token.
- The selected UI library is [Arc UI at uiarc.dev](https://uiarc.dev/docs/installation).
  It documents React/Vite support and requires React 19, TypeScript, and a path
  alias. It uses CSS modules and CSS variables.

## Implementation choices

- Pin Prisma 6.19.3, matching the major version in Root's example. Generate a
  client with no application models using `--allow-no-models`.
- Connect Prisma during Root's startup callback and disconnect during shutdown.
  Resolve Root's supplied filename before passing it to Prisma.
- Author future migrations against a separate development SQLite file. Do not
  run migration drift/reset commands against Root's shared database. Before the
  first application schema ships, add a baseline and a runtime migration step
  that preserves Root-owned tables.
- Use Arc's foundation, button, and input source. Root's active theme selects
  Arc's light/dark palette; Arc retains control over visual styling.
- Build development containers for Linux x64 on Node 24 Alpine so native
  dependencies match Root's documented production platform.

## Verification

- Host build, Prisma schema validation, and the database reconnect test pass.
- The Alpine image builds, DevHost attaches to Root, and the same database test
  passes inside the container.
- An isolated SQLite probe in the named volume survived forced replacement of
  both containers. The probe was removed after verification.
- Browser echo and keyboard submission pass through the real local backend.
  Frontend CSS refresh preserves input state; changing an imported backend
  module triggers a successful compilation and backend restart.
- Arc light/dark theme handling and a 320px layout were checked in the browser.
- The updated Arc-focused design skill passes the skill validator.
- `npm audit` reports ten findings in the Root SDK's dependency chains,
  including one critical finding in `tar` through `sqlite3`/`node-gyp`.
  These remain unresolved; the new Prisma CLI dependency finding was removed
  by the scoped `deepmerge-ts` override.
- Local packaging reached manifest validation after adding ICU libraries to
  the image. It cannot complete while `root-manifest.json` contains the
  placeholder App ID. Package size and an actual Root-hosted release remain
  unverified. No upload or release was performed.
