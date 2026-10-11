# Issue #5 verification

Implemented scope: [Preview and validate welcome greetings](https://github.com/DevShaded/bobwatts-rootapp/issues/5).

## Implementation

Authorized editor loading returns the administrator's trusted user identifier and community nickname. The browser previews its current draft locally, using the same greeting renderer as join delivery. The renderer preserves the greeting and escapes member-controlled Markdown delimiters and HTML entity characters inside Root's user-mention link syntax. Previewing does not call Save or create a channel message.

Enabled saves reject blank greetings, greetings above 1,000 Unicode code points, and unsupported named placeholders. The exact, case-sensitive `{user}` remains optional and can occur repeatedly. The editor uses the same delivery-readiness validation and counts Unicode code points, with field feedback and an input counter. New input cannot exceed the limit; an already-retained over-limit greeting can be shortened gradually. Disabled saves retain incomplete, invalid, and over-limit greeting content and the selected destination.

Preview rendering uses locally bundled CommonMark/GFM support, Root-style spoilers, literal line breaks, and highlighted mentions. It does not execute raw HTML or unsafe link schemes or fetch Markdown images. The welcome editor loads separately from the dashboard so the Markdown renderer is fetched only when needed.

## Automated checks

- `npm test`: protobuf regeneration, Prisma generation, server/client typechecking, production build, and all 18 Node integration tests pass.
- `npm run db:validate --workspace server`: Prisma schema valid.
- `git diff --check`: passes.
- `docker compose up -d --build`: final clean generated-code build on Node 24 / Alpine Linux x64; existing SQLite volume preserved and development services healthy.
- `docker compose exec -T server node --test server/test/*.test.cjs`: all 18 integration tests pass with Alpine's native Prisma engine.

Feature integration tests use the existing public `loadEditor`, `save`, and `handleJoin` operations with real temporary SQLite and a fake Root API. Added coverage includes authorized preview identity, unchanged live configuration while the loaded draft is edited, invalid enabled saves retaining active settings, exact 1,000-code-point limits with ASCII and supplementary-plane emoji, permitted disabled invalid/over-limit saves, and a single logged platform rejection after repeated mentions expand content past 10,000 characters. Existing coverage verifies repeated-placeholder and placeholder-free delivery, multiline formatting and links, escaped member names, authorization, restarts, and no application retries.

## Browser DevHost checks

Environment: 2026-10-11, Linux, Node 24.21.0, Root client/server/dev-tools SDK 0.21.3. The local Vite client used the Docker DevHost connected to the development community. Headless Chromium was used because T3 Code reported that no preview automation host was available. The SDK's closed DevBar shadow root was opened in the test browser only to select the real administrator and change themes; application code was unchanged by that instrumentation.

Verified with the administrator:

- Editor loading supplies the administrator's member identity.
- Unsaved greeting changes immediately update the preview without changing canonical saved settings.
- Repeated mentions, bold, strikethrough, multiline text, an ordinary link, and nested italic text inside a spoiler render in the preview.
- An enabled unknown-placeholder draft displays field feedback and does not alter saved settings.
- Exactly 1,000 emoji can be entered; an additional character is refused without splitting a surrogate pair.
- Saving an invalid disabled greeting succeeds, preserves the greeting, and shows confirmed success.
- A disabled greeting retained above 1,000 code points loads unchanged, can be saved while disabled, shows readiness feedback when enabled, and can be shortened to the input limit.
- Root theme changes update the preview in light and dark modes; the editor fits within 320 CSS pixels in both modes. The SDK's separate fixed DevBar still overflows at that width.
- Keyboard navigation from the greeting reaches Save.
- The production client bundle also renders an authorized draft with repeated mentions, bold text, an ordinary link, and nested spoiler formatting without browser errors. This check did not save settings.

The original saved development configuration was restored after testing.

## Platform message limit

The current official [Root Help Center: Send messages](https://support.rootapp.com/docs/member/text-channels/send-messages/) states that a chat message can contain up to **10,000 characters**. The official [Markdown formatting guide](https://support.rootapp.com/docs/member/text-channels/format-messages/) documents formatting including spoilers, headings, code, and lists. The [mention documentation](https://docs.rootapp.com/docs/bot-docs/develop/community-api/mentions/create-mentions/) specifies standard Markdown links with `root://user/` URIs.

SDK 0.21.3 declares `ChannelMessageCreateRequest.content` as an optional string. Bounded inspection of the installed server implementation found that its conversion forwards content into `root.MessageCreateRequest`; the generated content field has no numeric validation annotation. The current [application API request reference](https://docs.rootapp.com/docs/app-api-reference/server/type-aliases/ChannelMessageCreateRequest/) likewise does not specify a numeric limit or counting rule. The [create operation reference](https://docs.rootapp.com/docs/app-api-reference/server/type-aliases/ChannelMessageClient/) documents `RequestValidationFailed` for invalid requests.

The 10,000-character figure is therefore documented for native chat composition, but its exact enforcement for app-created messages, Unicode counting, and raw versus displayed mention length remains unverified. The application's 1,000-code-point greeting policy is separate. Each `{user}` expands to a mention containing the escaped nickname and user URI; 166 placeholders occupy 996 input code points but can produce more than 10,000 outgoing characters. The application attempts delivery once and logs any rejection without truncation, retries, fallback destinations, or configuration changes. The integration test simulates that rejection; it does not establish the platform's actual boundary. The 256 KiB application RPC payload limit is not used as a chat-content limit.

## Native verification gaps

No native Root client or second human account was available. Actual human-join delivery, clickable mentions, multiline/link/spoiler rendering in a destination channel, and native keyboard/theme/narrow-screen behavior remain unverified. Use the [native verification checklist](native-root-verification.md), plus checks for draft preview, enabled validation feedback, and disabled invalid saves. Record the native version, account prerequisites, observations, and restoration of the original configuration. Browser DevHost checks and simulated delivery are not native evidence.

## Standards

Independent review found no documented-standard violations or actionable baseline code smells.

## Spec

Independent review found no confirmed defects or scope creep. Two verification gaps remain: native Root delivery/rendering and exact platform enforcement of expanded app-created message length, documented above.
