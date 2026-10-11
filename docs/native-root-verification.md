# Native Root verification

Use this checklist when welcome delivery, rendered mentions, or packaged client
navigation needs verification beyond the fake Root API and browser DevHost.
Store each run's results in the feature's verification document; for issue #4,
use [issue-4-verification.md](issue-4-verification.md).

## Access prerequisites

A human operator must provide:

- A dedicated test community and its owner account, with permission to install
  and configure the app and create a test text channel.
- A second human Person account that can join, leave, and rejoin that community.
  Use a separate signed-in client session; a DevHost virtual user or client
  attachment does not exercise community join delivery.
- A native Root client and a test installation built from the commit under
  review. Record whether the installation uses a packaged build or development
  hosting. Development hosting cannot establish packaged navigation behavior.
- Access to app server logs and the destination channel's message history.

Use the existing [setup and packaging instructions](../README.md) for credentials,
builds, and manifest identity. Keep development tokens in the ignored local
environment file. Register the real App ID before packaging. Provisioning
accounts and installing the app remain operator actions; a prepared checklist
does not mean those prerequisites are available.

## Record the environment

Run these read-only commands from the repository root:

```bash
git rev-parse HEAD
git status --short
node --version
npm ls @rootsdk/client-app @rootsdk/server-app @rootsdk/dev-tools --depth=0
```

Record the native client's exact version/build from its version display, OS,
installation mode, test date, operator, and a non-secret test-community alias.
Note any uncommitted changes affecting the tested build. Link sanitized logs
or screenshots as evidence; keep tokens and personal account details out of
committed artifacts.

## Run the checks

Before starting, record the current welcome configuration for restoration. Use
a dedicated destination channel and a distinctive greeting such as:

```text
Welcome {user}!
**Native verification** — https://example.com — {user}
```

| Check | Action and expected observation |
| --- | --- |
| Packaged navigation | Open the packaged app: Dashboard appears. Open Server management → Welcome, return to Dashboard, then reopen Welcome. Exercise direct `/management/welcome`, refresh, and Back/Forward where the host exposes them. Record unsupported actions separately. |
| Whole-form Save | Select the test channel, enter the greeting, enable, and Save. Reopen the editor and confirm all saved fields. |
| Draft isolation | Edit the greeting without saving. Join with the second account; the destination receives the saved greeting. |
| Actual mention | Inspect the delivered message: both `{user}` occurrences render as mentions; opening each targets the joining account. Confirm multiline text, formatting, and the ordinary link render. |
| Rejoin | Leave and rejoin with the second account. Another welcome is eligible; repeated notifications may produce duplicates under the agreed delivery policy. |
| Disabled delivery | Disable and Save; confirm destination and greeting remain. Leave/rejoin again and inspect messages and logs during the recorded observation window. Report absence only for that window. |
| Restart persistence | Reopen the app and, with operator control of the test installation, restart its server. Confirm saved configuration survives. Mark server restart unavailable if only the client can be restarted. |
| Native usability | Test keyboard navigation and visible focus, light/dark modes, and a 320 CSS-pixel viewport if the native host supports it. Record actual dimensions and unsupported modes. |

Restore the original saved configuration after testing. Record cleanup results
and any remaining test messages; delete messages only when authorized.

## Evidence record

Append a dated record to the feature's verification document:

```markdown
### Native run: <date>

- Commit and relevant local changes:
- Node and installed client/server/dev-tools SDK versions:
- Native Root version/build and OS:
- Installation mode, test-community alias, and operator:
- Prerequisites unavailable:

| Check | Result: pass / fail / not run / unsupported | Evidence or reason |
| --- | --- | --- |

- Observation window for disabled delivery:
- Restored configuration and cleanup:
```

Keep unavailable checks visible. A fake API test or browser DevHost result does
not replace a native result. When official permission documentation disagrees,
record both references and the tested versions; leave the behavior unresolved
until a controlled test or version-specific authoritative evidence settles it.
