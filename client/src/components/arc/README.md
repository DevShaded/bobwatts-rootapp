# Arc UI components

These files come from the official [Arc UI registry](https://uiarc.dev/docs/installation):
`arc-foundation`, `arc-motion-tokens`, `button`, and `input`, retrieved on
2026-10-11. Their registry targets are mapped into this directory.
The button's click-event parameter has an explicit React type for this
project's strict TypeScript configuration.
The `textarea` component and its CSS module were retrieved from the same
registry on 2026-10-11 for the welcome greeting editor.

The application imports `foundation.css` once. Components use CSS modules and
Motion; no Tailwind or Root UI styling package is required. Root's theme events
select Arc's light or dark palette through `data-theme`.

Add only the components needed by a screen, following Arc's registry or manual
installation instructions. Keep upstream comments when adapting component
source.
