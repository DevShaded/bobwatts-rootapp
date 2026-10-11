# bobwatts-rootapp

A Root app with a React 19/Vite client styled with [Arc UI](https://uiarc.dev/), a TypeScript backend, and Prisma with SQLite. The echo demo exercises Root's generated Protocol Buffers service; application data models come later.

## Develop with Docker Compose

Install Docker Engine and the Compose plugin. A Root application and a development token for its test community are also required. Local development still connects to Root's servers.

If `server/.env` does not exist, copy the example:

```bash
cp server/.env.example server/.env
```

Set `DEV_TOKEN` in that local file. Keep it out of Git. Set your application ID in `root-manifest.json` before packaging.

```bash
docker compose up --build
```

Open **http://localhost:5174**. Compose runs two services:

- `client`: Vite with React Fast Refresh, exposed on port 5174.
- `server`: Root DevHost and a TypeScript watcher. DevHost uses ports 8180–8182 for browser communication. Its internal gRPC port stays inside the container.

Ports bind to localhost. Source edits under `client/src` and `server/src` reload automatically. A successful server compilation touches the entry point because DevHost watches that file only. Type errors leave the previous backend running.

Override `CLIENT_PORT`, `ROOT_DEV_WS_PORT`, `ROOT_DEV_HTTP_PORT`, or `ROOT_DEV_WS_UPDATE_PORT` in your shell if those ports are occupied. Compose passes the matching DevHost ports to the client automatically. For example: `CLIENT_PORT=5175 docker compose up`.

For a browser on another machine, set `DEV_BIND_ADDRESS` to the development host's private interface address and `DEV_ALLOWED_HOST` to its hostname. Open that hostname on the client port; the SDK uses the same hostname for DevHost connections.

Rebuild after changing dependencies, configuration, the Prisma schema, or networking definitions:

```bash
docker compose up --build
```

Both containers use Node 24 on Alpine Linux x64, matching Root's documented backend runtime. Docker may use emulation on ARM machines; those hosts have not been verified. Dependencies and generated code stay inside the image, separate from host `node_modules`. The image excludes local environment files and databases; only the backend receives the development token at runtime.

Useful commands:

```bash
docker compose logs -f server
docker compose ps
docker compose down
```

The `sqlite-data` named volume stores `/data/rootsdk.sqlite3` and survives `down`, rebuilds, and container replacement. **`docker compose down --volumes` deletes this database.** Docker's database is separate from any existing host database; files are not moved automatically. The server health check checks the DevHost socket, while sending an echo verifies the full connection.

## Prisma and SQLite

The backend opens Prisma during Root's startup callback using `rootServer.dataStore.config.sqlite3.filename`, then disconnects during shutdown. Compose configures that Root filename under `/data`; Root supplies it in production for its persistence and backup system.

`server/prisma/schema.prisma` intentionally contains no application models. Prisma 6.19.3 matches the major version in Root's documented example; `--allow-no-models` generates the initial client without adding placeholder tables. Native engines are generated for the build host and Alpine x64. Generated files are ignored by Git and included in Root packaging.

With local Node.js 24 dependencies installed:

```bash
npm run db:validate --workspace=server
npm run db:generate --workspace=server
```

When a real model is added, author migrations using:

```bash
npm run db:migrate --workspace=server -- --name describe_the_change
```

That command targets a separate, ignored `server/prisma/development.sqlite3` database. **Do not point `migrate dev`, `db push`, or reset commands at Root's database**, which also contains SDK-owned tables. Before deploying the first application model, add a baseline for the existing Root database and apply committed migrations during startup before registering services. This infrastructure-only setup does not yet run application migrations or create application tables.

Prisma's CLI dependency `deepmerge-ts` is overridden to its patched version. Schema validation and generation verify that override. The server skips checking dependency declaration files because Prisma 6's empty-schema output contains an invalid declaration placeholder; application TypeScript remains checked.

## UI components

Arc's foundation, button, input, and motion tokens live in `client/src/components/arc`. These are component source files from the official registry, using CSS modules and Motion. Import the foundation once, and add components only as needed. The `@/*` alias resolves to `client/src`.

Root's light/dark theme selects Arc's palette through `data-theme`. Root's SDK still handles platform integration and service calls. The UI does not use Root's component or styling package. Project guidance lives in `.agents/skills/root-app-design/SKILL.md`.

## Develop without Docker

Use Node.js 24 (`nvm use`) and npm. Keep the same local token file described above.

```bash
npm ci
npm run build
npm run dev --workspace=server
```

In another terminal:

```bash
npm run dev --workspace=client
```

Without `DATABASE_CONFIG`, DevHost uses its default `server/rootsdk.sqlite3`. Production hosting remains with Root; Compose is a development setup.

Without Docker, Vite defaults to port 5173 and DevHost to 8080–8082. If you customize DevHost's ports, set the corresponding `VITE_ROOT_DEV_*` environment variables for Vite too.

## Checks and packaging

[GitHub Actions](.github/workflows/build.yml) runs `npm ci` and `npm run build`
from a clean checkout on pull requests and pushes to `main`, using the Node
version in `.nvmrc`. This generates networking and Prisma code, checks
TypeScript, and builds the client. The workflow runs no integration tests and
requires no Root development token.

Optional local checks:

```bash
npm test
docker compose run --rm --no-deps server node --test server/test/*.test.cjs
```

`npm test` regenerates networking and Prisma code, checks TypeScript, builds the client, and verifies that Prisma uses the supplied database file and retains its data after reconnecting. The container command verifies the database test with Alpine's native engine.

Set the real App ID in `root-manifest.json` before creating a Root package. The manifest includes the generated Prisma client. Build/package on the matching Linux x64 Alpine target; Root does not rebuild native dependencies after upload. See [Root's runtime requirements](https://docs.rootapp.com/docs/app-docs/develop/server/server-project-overview/) and [packaging guide](https://docs.rootapp.com/docs/app-docs/publish/).

Root packages the configured `node_modules` directory. Prune development dependencies in a disposable copy of the built project with `npm prune --omit=dev --ignore-scripts`, then invoke `rootsdk build package` from the original, unpruned workspace against that copy. Do not prune the active development container. Local packaging currently stops at the placeholder App ID; the final package size and hosted runtime remain unverified.

## Project structure

- `client/`: React UI, Arc source, and Vite configuration.
- `server/src/`: Root lifecycle, database connection, and echo service.
- `server/prisma/`: application schema and future migrations.
- `networking/src/`: Protocol Buffers contracts.
- `networking/gen/`, `server/generated/`: generated packages, recreated by the build.
- `compose.yaml`, `Dockerfile`: local container setup.
- `docs/development-setup-design.md`: agreed scope and compatibility findings.

Keep credentials, databases, backups, and generated output out of Git. Ignore rules match paths; they cannot detect secrets embedded in source code. Review staged changes before committing.
