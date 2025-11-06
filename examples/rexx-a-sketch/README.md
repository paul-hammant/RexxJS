# Rexx-A-Sketch

An Etch-A-Sketch app powered by RexxJS with D3 visualization and Rexx-over-wire control. Inspired by the Toy Story movie moment: *"Hey, Etch. Draw!"*

## Features

- **Interactive Etch-A-Sketch**: Two dials (X and Y) to control drawing
- **D3.js Visualization**: Smooth vector graphics rendering
- **Rexx-over-Wire Control**: Remote control via HTTP API using RexxJS scripts
- **Tauri Desktop App**: Native application for Mac, Windows, and Linux
- **Rapid Drawing Demo**: Automatically draws a stick figure like in Toy Story

## Quick Start

### Development Mode

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Copy RexxJS bundle** (if not already present):
   ```bash
   cp ../../core/src/repl/dist/rexxjs.bundle.js public/
   ```

3. **Start the app with control bus enabled**:
   ```bash
   npm run tauri:dev
   ```

   This will:
   - Start Vite dev server on http://localhost:5174
   - Launch Tauri desktop app
   - Enable control bus HTTP API on http://localhost:8084

### Using the Interactive Dials

1. Launch the app
2. Use the **Left Dial (X)** and **Right Dial (Y)** sliders to control the cursor
3. The cursor automatically draws as you move it
4. Click **Clear Screen** to reset
5. Click **Draw Stick Figure** to see the Toy Story-inspired animation

### Remote Control via Rexx Scripts

With the app running, you can control it from the command line using Rexx scripts:

**Draw the Toy Story stick figure**:
```bash
../../core/rexx draw-stick-figure.rexx
```

**Test the connection**:
```bash
../../core/rexx test-connection.rexx
```

**Draw a custom house**:
```bash
../../core/rexx draw-custom.rexx
```

## Rexx-over-Wire API

The Rexx-A-Sketch exposes a control bus HTTP API that accepts RexxJS commands:

### Available Commands

```rexx
-- Movement commands
MOVE dx dy                    -- Move cursor by delta (can draw)
MOVE_TO x y                   -- Move cursor to absolute position

-- Pen control
PEN_UP                        -- Lift pen (stop drawing)
PEN_DOWN                      -- Lower pen (start drawing)

-- Drawing commands
CLEAR                         -- Clear the canvas
DRAW_STICK_FIGURE            -- Draw stick figure animation
DRAW_LINE x1 y1 x2 y2        -- Draw line from (x1,y1) to (x2,y2)

-- Query commands
GET_POSITION                  -- Get current cursor position
```

### Example Rexx Script

```rexx
/* Connect to Rexx-A-Sketch */
ADDRESS "http://localhost:8084/api/etch" AUTH "dev-token-12345" AS ETCH

-- Clear and draw
"CLEAR"
"MOVE_TO 400 300"
"PEN_DOWN"
"MOVE 50 0"
"MOVE 0 50"
"MOVE -50 0"
"MOVE 0 -50"
"PEN_UP"

SAY "Square drawn!"
```

## Architecture

### Frontend (D3 + Vanilla JS)

- **src/main.js** - Application entry point
- **src/etch-a-sketch.js** - D3-based drawing engine
- **src/control-bus-adapter.js** - Rexx-over-wire communication
- **src/styles.css** - Styling

### Backend (Rust + Tauri)

- **src-tauri/src/lib.rs** - Control bus HTTP server
- **src-tauri/src/main.rs** - Tauri application entry
- **src-tauri/tauri.conf.json** - Tauri configuration

### Control Flow

```
Rexx Script (CLI)
    ↓
HTTP POST to localhost:8084/api/etch
    ↓
Rust Backend (Axum server)
    ↓
COMET-style polling queue
    ↓
JavaScript polls /api/poll
    ↓
Execute command in D3 canvas
    ↓
POST result back to /api/result
    ↓
Response returned to Rexx script
```

## Building

### Development

```bash
npm run tauri:dev
```

### Production Binary

```bash
npm run tauri:build
```

This creates platform-specific installers in `src-tauri/target/release/bundle/`:
- **Mac**: `.dmg` and `.app`
- **Windows**: `.msi` and `.exe`
- **Linux**: `.deb`, `.appimage`

## Testing

### Manual Testing

1. Launch the app: `npm run tauri:dev`
2. In another terminal, run: `../../core/rexx draw-stick-figure.rexx`
3. Watch the stick figure draw rapidly!

### Playwright Tests

```bash
cd ../../core
PLAYWRIGHT_HTML_OPEN=never npx playwright test examples/rexx-a-sketch/tests/
```

## Toy Story Reference

This app recreates the moment from Toy Story where Woody plays with Etch-A-Sketch:

> **Woody**: "Hey, Etch. Draw!"
>
> *(Etch draws a gun at a rapid pace, and makes a ding)*
>
> **Woody**: "Oh! Got me again. Etch, you've been working on that draw. Fastest knobs in the west."

In our version, Etch draws a stick figure instead of a gun, demonstrating the rapid drawing capabilities of the Rexx-over-wire control system.

## Technology Stack

- **Frontend**: Vanilla JavaScript + D3.js v7
- **Backend**: Rust + Tauri v2 + Axum
- **Scripting**: RexxJS interpreter
- **Build**: Vite
- **Communication**: HTTP REST API with COMET-style polling

## License

MIT

---

Built with ❤️ as part of the RexxJS project
