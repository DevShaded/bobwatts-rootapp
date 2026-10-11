# Issue #4 verification

Implemented scope: [Configure and send saved welcome messages](https://github.com/DevShaded/bobwatts-rootapp/issues/4).

## Automated checks

- `npm run db:validate --workspace server`: Prisma schema valid.
- `npm test`: regenerates Protocol Buffers bindings and Prisma, typechecks both applications, builds the client, and passes all 14 Node integration tests.
- `docker compose up -d --build`: clean generated-code build on Node 24 / Alpine Linux x64; existing SQLite volume preserved.
- `docker compose exec -T server node --test server/test/*.test.cjs`: all 14 integration tests pass with Alpine's native Prisma engine. Updated test source was copied into the running container after the final membership regression was added.

Tests exercise the welcome module's public settings and join entry points against real temporary SQLite and a fake Root API. Coverage includes defaults; owner, Full Control, Manage Apps, and Everyone-role authority; unauthorized and non-member callers; destination filtering; whole-configuration saves; draft isolation; enabled validation; disabling with incomplete fields; actual outgoing mention syntax and escaped display text; placeholder-free greetings; disabled delivery; rejoins; duplicate notifications; App exclusion; foreign-community events; failed sends without retries; subsequent successful sends; and persistence after repeated reopening. The database reconnect test seeds a Root-owned fixture before the first migration and verifies its survival through repeated startup.

## DevHost browser checks

Verified against the running DevHost connected to the real development community:

- Selecting the actual community owner loads initial defaults and a writable Text channel.
- Changing the toggle, destination, and multiline greeting remains a draft; a direct generated load request still returns the previous disabled configuration.
- Save returns the canonical enabled configuration and displays success.
- Disabling preserves the saved destination and multiline greeting.
- An enabled save without a destination returns application validation code `2`.
- A non-member DevHost virtual user receives application access-denied code `1`, and the editor displays the denied state.
- Keyboard navigation reaches the toggle, native destination select, greeting, and Save. Channel selection and greeting editing work with the keyboard.
- Root DevHost theme changes update Arc's light and dark palettes.
- At 320 CSS pixels, the editor and all controls fit within the viewport. The SDK's separate fixed DevBar overflows at that width; the editor itself remains within its bounds.

The development welcome configuration was returned to disabled defaults after verification.

The live checks exposed a compatibility issue in SDK 0.21.3: server RPC dispatch classifies exceptions by constructor name, while the distributed SDK minifies its exception class name. The welcome module preserves the expected `RootServerException` constructor name, verified through the live validation and access-denied responses. Missing community membership is explicitly denied rather than surfacing a generic Root API error.

## Checks still requiring the native Root client

No native Root client or additional human account was available in this session. A real human community join, the resulting message, the clickable/rendered user mention, and multiline/link rendering in the destination channel were not verified live. Join behavior and outgoing content were verified only through the fake Root API integration tests. DevHost client attachment was not treated as a community join.

Native Root client keyboard, narrow-screen, and light/dark behavior also remain unverified; the editor checks above used the browser DevHost.

The SDK types and inspected official documentation did not establish a numeric chat message-content limit. This slice does not impose the later ticket's greeting limit. Mention expansion can increase message size; any Root rejection is caught and logged under the agreed best-effort send policy. The 256 KiB application RPC limit is not assumed to be the chat message limit.

Full greeting preview/validation, destination recovery, and save/delivery race coverage remain scoped to the subsequent slices in the parent issue.
