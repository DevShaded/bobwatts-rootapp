---
name: root-app-development
description: Guide setup, builds, local testing, configuration, troubleshooting, and packaging for Root Apps. Use for create-root, development tokens, workspace scripts, manifests, generated networking code, and release preparation.
---

# Root App Development

## User-controlled setup

Default to instructions the user runs on their own PC.

Do not scaffold projects, install packages, edit files, start services, or
publish unless the user explicitly requests those actions.

Ask for the operating system when commands or tooling support depend on it.
Do not claim that commands were executed when only providing instructions.

## Official references

- https://docs.rootapp.com/docs/app-docs/get-started/
- https://docs.rootapp.com/docs/app-docs/configure/
- https://docs.rootapp.com/docs/app-docs/debug/
- https://docs.rootapp.com/docs/app-docs/publish/

Read the relevant current instructions before advising on versions, platform
support, manifests, or release commands.

## Initial setup

Explain these steps in small, runnable groups:

1. Install the documented Node.js version and Root desktop client.
2. Sign in to the Root Developer Portal and register an App.
3. Generate a development token for its test community.
4. Run `npx create-root --app ProjectName`.
5. Put the private token in the generated server/.env file.
6. Install dependencies and run the project build.
7. Start the server and frontend using their package.json scripts.

The official starter uses TypeScript and separate client, server, and
networking workspaces.

Treat the generated files and scripts as authoritative for that project.

## Secrets and identity

- Never ask the user to paste a development token into chat.
- Keep local environment files out of version control.
- Use placeholders in examples.
- Distinguish development tokens from publishing credentials.
- Verify the manifest App ID against the intended portal project before
  packaging or uploading.

## Troubleshooting

Find the first failing stage:

1. Package installation.
2. Protobuf generation.
3. Server compilation.
4. Frontend compilation.
5. DevHost startup.
6. Authentication or community connection.
7. Runtime behavior.

Fix the earliest cause before treating downstream missing generated modules
as independent code problems.

Request relevant error output with secrets removed. Preserve lockfiles and
user data; do not recommend blanket deletion as the default repair.

Distinguish network restrictions from source-code or SDK failures.

## Local verification

Use the starter connection example before adding features.

During development, the frontend runs in a browser and the backend uses
Root DevHost. A valid token and connectivity to Root are still required.

Explain which terminal and working directory each command needs.

## Release preparation

Check the current publishing guide, manifest identity, version, permissions,
package contents, and deployment runtime compatibility.

Keep publishing separate from building. Obtain explicit authorization before
uploading or releasing when the user requested only setup or guidance.

Report exactly what was built, tested, uploaded, or left unverified.
