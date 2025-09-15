# RexxJS Extras

This directory contains extra components and libraries for RexxJS that extend beyond the core functionality.

## Structure

```
extras/
├── addresses/          # ADDRESS target libraries
│   ├── jq/            # jq JSON processor
│   ├── sqlite3/       # SQLite database
│   ├── system/        # OS/system integration
│   └── anthropic-ai/
│       └── claude/    # Anthropic Claude AI
├── functions/         # Additional function libraries (future)
└── package.json       # Workspace management
```

## Quick Start

Install all extras:
```bash
cd extras
npm run setup
```

Test all extras:
```bash
npm run test:all
```

Build distributable packages:
```bash
npm run build:all
```

## ADDRESS Libraries

### jq - JSON Query Processor
- **Location**: `addresses/jq/`
- **Dependencies**: `jq-wasm`
- **Purpose**: JSON querying and manipulation using jq syntax
- **Usage**: `REQUIRE "jq-address"; ADDRESS JQ; ".items[0].name"`

### SQLite3 - Database
- **Location**: `addresses/sqlite3/`  
- **Dependencies**: `sqlite3`
- **Purpose**: SQLite database operations
- **Usage**: `REQUIRE "sqlite-address"; ADDRESS SQLITE3; LET result = execute sql="SELECT * FROM users"`

### System - OS Integration
- **Location**: `addresses/system/`
- **Dependencies**: None (uses Node.js built-ins)
- **Purpose**: Operating system and filesystem operations
- **Usage**: `REQUIRE "system-address"; ADDRESS SYSTEM; LET files = listfiles path="/tmp"`

### Claude - AI Assistant  
- **Location**: `addresses/anthropic-ai/claude/`
- **Dependencies**: `@anthropic-ai/sdk`
- **Purpose**: Integration with Anthropic's Claude AI
- **Usage**: `REQUIRE "claude-address"; ADDRESS CLAUDE; LET response = ask prompt="Hello, world!"`

## Individual Package Management

Each ADDRESS library is a standalone npm package:

```bash
# Work with individual packages
cd addresses/jq
npm install
npm test
npm run build

cd ../sqlite3  
npm install
npm test

# etc.
```

## Workspace Features

This uses npm workspaces for unified dependency management:

- Shared dependencies are hoisted to the root
- Individual packages maintain their own dependencies
- Cross-package development is simplified
- Testing and building can be done collectively or individually

## Adding New Extras

### New ADDRESS Library

1. Create directory: `addresses/your-library/`
2. Add `package.json` with:
   - Correct relative paths to core: `../../../core/src/interpreter`
   - Test scripts with `pretest: npm run install:core`
   - Appropriate dependencies
3. Add to `extras/package.json` workspaces array
4. Add install/test/build scripts to extras package.json
5. Update this README

### New Function Library  

1. Create directory: `functions/your-library/`
2. Follow same pattern as ADDRESS libraries
3. Update relevant scripts in main package.json

## Core Integration

All extras reference the core RexxJS interpreter relatively:

```javascript
// In test files:
const { Interpreter } = require('../../../core/src/interpreter');
const { parse } = require('../../../core/src/parser');

// In ADDRESS library files:
// No direct imports needed - libraries export their functionality
// for the core interpreter to load via REQUIRE
```

## Development Workflow

1. **Setup**: `npm run setup` (installs all dependencies)
2. **Develop**: Work in individual package directories
3. **Test**: `npm run test:all` or individual `npm run test:library`  
4. **Build**: `npm run build:all` for distribution packages
5. **Clean**: `npm run clean` to remove all node_modules

## Testing

Each library includes comprehensive tests:

- **Unit tests**: Test library functionality in isolation
- **Integration tests**: Test with RexxJS interpreter
- **Mock tests**: Test without external dependencies when possible

Tests automatically install core dependencies via `pretest` scripts.

## Dependencies

- **Core dependency**: All extras depend on `../../core/` RexxJS interpreter
- **External dependencies**: Each library manages its own (sqlite3, jq-wasm, etc.)
- **Dev dependencies**: Jest for testing, webpack for building (where needed)

## Distribution

Built packages are suitable for:
- Direct inclusion in web projects
- npm publication
- CDN distribution
- Local development

The jq library includes both bundled and unbundled builds for different deployment scenarios.