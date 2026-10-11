---
name: root-app-design
description: Build, style, or review Root App frontends using Root's official design system. Use for Root dashboards, settings pages, forms, theme integration, responsive layouts, and UI consistency. Exclude text-only bots and unrelated websites.
---

# Root App Design

## Scope

Respect the requested mode:
- For guidance requests, explain the steps without modifying files.
- For implementation requests, make the requested changes.
- Do not scaffold projects, install dependencies, or publish merely to answer a styling question.

## Official references

Read the relevant documentation before implementing:

- Design system:
  https://docs.rootapp.com/docs/app-docs/develop/client/design-system-reference/
- UI components:
  https://docs.rootapp.com/docs/app-docs/develop/client/ui-components/
- Theme handling:
  https://docs.rootapp.com/docs/app-docs/develop/client/theme-mode/

Treat the documentation as evolving. Verify API exports against the installed package types.

Distinguish between CSS examples and packaged components. Do not assume a documented pattern is an importable React component.

If the documentation is unavailable, disclose that current details could not be verified.

## Root styling conventions

- Use Root's injected `--rootsdk-` CSS color variables so the interface follows the active theme.
- Default to 14px body text with 20px line height.
- Use 500-weight headings.
- Default to 12px corners for cards and inputs.
- Keep spacing compact and consistent.
- Use sentence-case section headings and uppercase secondary subgroup labels.
- Prefer inline editing for simple existing items.
- Use dialogs for complex selection or confirmation.
- Make destructive icons visibly red before hover and confirm destructive actions.
- Indicate selected cards with a brand-colored border.
- Ensure layouts remain usable at 320px width.

Consult the reference for exact tokens, component recipes, and exceptions.

## Implementation workflow

1. Inspect the existing components, styles, dependencies, and requested screen.

2. Read the relevant reference sections for colors, spacing, typography,
   component patterns, and responsive behavior.

3. Reuse existing project abstractions. Create shared components when
   multiple features need the same behavior or presentation.

4. Keep styling changes separate from backend behavior. Preserve working
   permissions, state handling, validation, and event subscriptions.

5. Write valid CSS:
   - Normalize malformed copied units such as `12 px` to `12px`.
   - Do not assume a color variable contains raw RGB channels.
   - Avoid overriding Root's injected theme variables globally.
   - Keep any standalone preview theme isolated from production styling.

6. Implement accessible behavior:
   - Use semantic buttons, inputs, and labels.
   - Provide accessible names for icon-only controls.
   - Preserve visible keyboard focus and keyboard navigation.
   - Make disabled, loading, and error states accurate.
   - Treat accessibility as implementation work; CSS recipes do not
     provide it automatically.

7. Verify the changed interface:
   - Light and dark themes.
   - Narrow and wide layouts.
   - Long labels and overflowing content.
   - Loading, empty, success, and error states.
   - Keyboard interaction.
   - Available build and type checks when appropriate.

8. Report what changed, what was verified, and remaining limitations.
   Never claim visual or runtime checks that were not performed.
