# Welcome messages design

Status: agreed design. All fifteen interview decisions are settled. The feature is not implemented.

Implementation specification: [GitHub issue #3](https://github.com/DevShaded/bobwatts-rootapp/issues/3), labeled `ready-for-agent`. The specification includes the agreed testing approach: welcome module integration tests with real temporary SQLite and a fake Root API, plus verification in the real Root client.

## Agreed requirements

### Configuration and access

- Each community has one shared welcome configuration: enabled state, destination text channel, and welcome greeting.
- Welcome messages are disabled by default.
- Destinations are limited to standard Text channels that the app can view and post in. ThreadedText channels and direct messages are excluded.
- Administrators are the community owner and members with Full Control or Manage Apps permission. The server enforces this boundary for reading and changing settings and obtaining channel choices.
- All changes take effect only after a successful whole-form Save and survive application restarts.
- Disabling welcome messages retains the destination and greeting.
- If administrators save concurrently, the last successful save replaces the entire configuration. There is no field merging or conflict-resolution UI in v1.

### Greeting and validation

- The initial greeting is `Welcome {user}! Glad you’re here.`
- Greetings support multiple lines, normal Root text formatting, and links, with a 1,000-character input limit imposed by this application.
- The optional `{user}` placeholder becomes an actual mention of the joining member. Every occurrence is replaced.
- Unknown placeholders, such as `{username}`, prevent saving an enabled configuration.
- Enabling requires an accessible destination where the app can post and a nonempty greeting.
- Disabled configurations may remain incomplete or invalid. An invalid greeting or unavailable destination must not prevent an administrator from disabling welcome messages.

### Delivery

- Only human members qualify for welcome messages. Bots and apps are excluded.
- Every qualifying join can receive a welcome message, including a member leaving and rejoining. There is no permanent record suppressing welcomes to previously welcomed members.
- V1 handles joins observed while the app is running. It logs failed sends without application retries and does not catch up on joins missed during downtime.
- Repeated notifications of the same join may produce duplicate welcome messages. V1 does not promise exactly-once delivery or suppress events solely because the member was welcomed before.
- A join uses the saved configuration available when its processing begins. An already-started send may finish after an administrator disables welcome messages.
- If the destination disappears or the app loses access, retain the saved configuration and skip welcomes. Never silently use another channel.
- The settings editor shows a destination problem when an administrator opens it. Delivery resumes after access is restored or the saved destination is repaired.

### Settings editor

- Replace the Echo demo with the welcome settings editor.
- Include enabled state, destination selection, greeting input, and a Save action.
- Preview the greeting using the administrator as the example member.
- Show save success and failure feedback.
- A real Send test action is deferred.

## Repository and platform findings

- The application currently contains an Echo UI and RPC service. Existing Prisma integration connects to Root-provided SQLite, but the schema has no application models.
- The existing [development setup design](./development-setup-design.md) requires a baseline and a runtime migration step preserving Root-owned tables before the first application schema ships.
- Root's native app settings require Manage Apps permission. Applying that boundary to custom welcome RPCs is an application decision and must be enforced by this app. See [App configuration](https://docs.rootapp.com/docs/app-docs/configure/) and [CommunityPermission](https://docs.rootapp.com/docs/app-api-reference/server/type-aliases/CommunityPermission/).
- The inspected [native settings documentation](https://docs.rootapp.com/docs/app-docs/configure/manifest-global-settings/) marks text, checkbox, and channel controls as unsupported in current Root clients. Use the custom React editor.
- Root exposes community join events separately from client attachment and presence events. The welcome handler must use the community join event. See [Community API](https://docs.rootapp.com/docs/app-docs/develop/server/community-api/get-started/).
- Root distinguishes Person and App user identifiers, making human-only filtering possible. See [GUIDs](https://docs.rootapp.com/docs/app-docs/develop/server/guids/).
- Standard Text and ThreadedText channels are separate channel types. Channel data includes effective channel permissions. See [Channel](https://docs.rootapp.com/docs/app-api-reference/server/type-aliases/Channel/).
- Root provides explicit user mention syntax and a channel message creation API. See [Creating mentions](https://docs.rootapp.com/docs/app-docs/develop/server/community-api/mentions/create-mentions/) and [ChannelMessageClient](https://docs.rootapp.com/docs/app-api-reference/server/type-aliases/ChannelMessageClient/).
- The inspected join payload has no event identifier or timestamp. No exactly-once delivery guarantee was established from the inspected documentation.
- The numeric chat message limit remains unverified. The documented 256 KiB application RPC limit must not be treated as the chat greeting limit.

## Acceptance checks for implementation

- A new community starts with welcomes disabled and the initial greeting available in the editor.
- Only an administrator can read or change settings and obtain destination choices, including through direct server requests.
- Destination choices include only eligible standard Text channels.
- Unsaved edits do not affect delivery. A successful Save persists the whole configuration across restarts; a failed Save leaves the previous configuration active.
- An enabled configuration requires a valid destination, a nonempty greeting within the application limit, and supported placeholders. A disabled configuration may retain invalid or incomplete fields.
- Disabling preserves the destination and greeting and remains possible after the destination becomes unavailable.
- The preview uses the administrator as its example member and does not post a message.
- A qualifying human join uses the saved greeting and destination, replacing every `{user}` with that member's mention. Greetings without `{user}` remain valid.
- A human rejoin can trigger another welcome; bot and app joins do not. Duplicate join notifications may trigger duplicate welcomes.
- Destination loss prevents sending and appears as a problem when the editor opens. Restoring access or repairing the saved destination permits subsequent welcomes.
- Failed sends are logged without application retries. Missed joins during downtime are not replayed by the application.
- Concurrent saves use the last successfully saved whole configuration. A send already started with an earlier configuration may finish after a later Save disables welcomes.

## Remaining implementation verification

- Verify Root's numeric chat message limit and how it applies after user mentions are expanded. The 1,000-character greeting input limit is an application policy, not an assertion about Root's message limit.
- Confirm mention rendering and greeting formatting in the real Root client, along with channel permissions and human join events.
- Verify that the first application database migration preserves existing Root-owned tables and that the saved configuration survives restarts.

## Verification status

Only design documentation has changed. Feature implementation and runtime verification have not started.
