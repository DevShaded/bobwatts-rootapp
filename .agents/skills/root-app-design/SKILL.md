---
name: root-app-design
description: Build, style, or review this project's React frontend with Arc UI (uiarc.dev), including Root theme integration and responsive layouts. Use for components, forms, and visual consistency; exclude backend-only work.
---

# Root App Design with Arc UI

## Project choice

Use [Arc UI](https://uiarc.dev/) for components and visual styling. This is
uiarc.dev, not Ark UI or arcui.dev. The frontend uses React and Vite.
Root's SDK remains responsible for platform integration and networking;
Root's component package and design-system colors are not the styling source.

## Component work

Inspect existing Arc components before adding another. Read the relevant
[installation guide](https://uiarc.dev/docs/installation) and component page
before importing new source. Verify requirements against the project's React
version and installed types.

Arc distributes component source through its registry and manual installation
instructions. Keep the source in the project, add only needed components and
their dependencies, and preserve upstream comments. Do not assume a component
is an export from an npm package named after Arc.

Use Arc's shared foundation, CSS modules, and semantic variables. Import the
foundation once at the application entry point. Arc does not require Tailwind
or Next.js; keep Vite and the existing CSS approach. Bundle assets locally when
needed because Root's client runtime restricts network access.

## Theme integration

Use [Arc's theme tokens](https://uiarc.dev/docs/theming) for colors, typography,
spacing, and shape. Follow Root's active light/dark mode by setting Arc's
`data-theme` on the document element, while retaining Arc's palette.

Read [Root's theme integration guide](https://docs.rootapp.com/docs/app-docs/develop/client/theme-mode/)
when wiring theme detection. Check the installed SDK's exports and event types;
documentation examples may differ from the installed version. Subscribe to
theme changes and remove listeners during cleanup.

## Verification

Preserve existing service calls and event subscriptions while changing UI.
Check keyboard operation, visible focus, labels, reduced motion, loading and
error states, and long content. Verify light/dark themes and layouts down to
320px, then run the relevant build and type checks. Report any runtime or visual
checks that remain unverified.
