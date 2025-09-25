# Remote ADDRESS Module

This module provides ADDRESS SSH transport for RexxJS.

## Build

This package self-bundles to a single UMD file for consumption by the RexxJS standalone binary (pkg-build).

- Entry: `bundle-entry.js` (loads SSH handlers and central shared-utils)
- Output: `bundled-remote-handlers.bundle.js`
- Shared utilities: `../shared-utils/index.js` (centralized; no local duplicates)

Commands:
- From this directory: `npm ci && npm run build`

Notes:
- The bundle is consumed by `RexxJS/pkg-build` via its `pkg.assets/scripts` configuration.
- Do not hand-edit generated `.bundle.js` files; make changes in sources and rebuild.

