# bobwatts-rootapp

A Root app with a React client, a TypeScript server, and a Protocol Buffers echo service.

## Requirements

- Node.js 24 and npm. If you use nvm, run `nvm use`.
- A Root application and development token to run the app. Building does not require a token.

## Setup

```bash
git clone https://github.com/DevShaded/bobwatts-rootapp.git
cd bobwatts-rootapp
npm ci
npm run build
cp server/.env.example server/.env
```

Set `DEV_TOKEN` in `server/.env` to your development token from the Root developer portal. Replace `your-app-id` in `root-manifest.json` with your application's ID.

Start the development server:

```bash
npm run server --workspace=server
```

In a separate terminal, start the client:

```bash
npm run client --workspace=client
```

## Project structure

- `client/`: React UI and Vite configuration.
- `server/`: Root server and echo service.
- `networking/src/`: Protocol Buffers service definitions.
- `networking/gen/`: Generated packages; recreated by the build and excluded from Git.
- `root-manifest.json`: Root app packaging configuration.

`npm run build` generates the networking packages, compiles the server, and builds the client, in that order. Run it again after changing a protocol definition and before pushing changes.

## Local files and credentials

Keep tokens and credentials in local environment files. `.gitignore` excludes environment files, common credential and key files, databases and their journals, database dumps, backups, dependencies, logs, and build output. Only the blank `server/.env.example` template is committed.

Ignore rules match file paths; they cannot detect secrets embedded in source code. Never put real tokens in source files, documentation, or the example environment file. Review `git diff --cached` before committing.
