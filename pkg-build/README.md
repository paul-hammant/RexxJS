# RexxJS Standalone Binary (pkg-build)

This directory builds the standalone `rexx` binary using `pkg`.

## Usage

- Run scripts via Node wrapper: `./cli.js script.rexx`
- Run the packaged binary: `./rexx script.rexx`

## Building Bundles and Binary

The standalone binary consumes prebuilt bundles from `extras/addresses`. Build them first, then package the binary.

### One-Step Build

From this directory:

```
npm run build:all
```

This runs:
- Builds extras bundles:
  - `extras/addresses/provisioning-and-orchestration/bundled-container-handlers.bundle.js`
  - `extras/addresses/provisioning-and-orchestration/bundled-remote-handlers.bundle.js`
- Packages the binary via `pkg` (targets from `package.json`).

### Manual Steps

Build extras only:

```
npm run build:extras
```

Then package with `pkg` (adjust targets as needed):

```
pkg -c package.json -t node18-linux-x64 .
```

### Notes

- Shared utilities for address handlers live at `extras/addresses/shared-utils/index.js`.
- Bundles must not inline or duplicate those utilities; they import from the centralized module.
- Do not hand-edit `.bundle.js` outputs; edit sources and rebuild.

