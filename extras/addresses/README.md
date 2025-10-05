# RexxJS ADDRESS Handlers

## What qualifies for Addresses?

1. Something that's a bit of an alien grammar to Rexx

or

2. Something that may have some life to it outside the invocation of it. Like threads, or processes or a wire

## Available ADDRESS Handlers

### AI Services

| Module | ADDRESS Name | Implementation | Dependencies | Description |
|--------|-------------|----------------|--------------|-------------|
| `claude-address` | `ADDRESS CLAUDE` | HTTP-based | node-fetch | Anthropic Claude API via direct HTTP calls |
| `openai-address` | `ADDRESS OPENAI` | HTTP-based | node-fetch | OpenAI ChatGPT API via direct HTTP calls |
| `gemini-address` | `ADDRESS GEMINI` | HTTP-based | node-fetch | Google Gemini API with text + vision (image) support |

### Database & Data

| Module | ADDRESS Name | Implementation | Dependencies | Description |
|--------|-------------|----------------|--------------|-------------|
| `sqlite-address` | `ADDRESS SQL` | Native/WASM | better-sqlite3 / sql.js | SQLite database operations |
| `duckdb-address` | `ADDRESS DUCKDB` | Native | duckdb | DuckDB native for Node.js |
| `duckdb-wasm-address` | `ADDRESS DUCKDB` | WASM | @duckdb/duckdb-wasm | DuckDB WASM for browsers |

### System & Infrastructure

| Module | ADDRESS Name | Implementation | Dependencies | Description |
|--------|-------------|----------------|--------------|-------------|
| `system-address` | `ADDRESS SYSTEM` | Native | child_process | OS shell command execution |
| `docker-address` | `ADDRESS DOCKER` | Native | dockerode | Docker container management |
| `podman-address` | `ADDRESS PODMAN` | Native | child_process | Podman container operations |
| `nspawn-address` | `ADDRESS NSPAWN` | Native | child_process | systemd-nspawn containers |
| `qemu-address` | `ADDRESS QEMU` | Native | child_process | QEMU/KVM virtual machines |
| `virtualbox-address` | `ADDRESS VIRTUALBOX` | Native | child_process | VirtualBox VM management |
| `gcp-address` | `ADDRESS GCP` | HTTP-based | @google-cloud/* | Google Cloud Platform services |

### Python & Scientific

| Module | ADDRESS Name | Implementation | Dependencies | Description |
|--------|-------------|----------------|--------------|-------------|
| `pyodide-address` | `ADDRESS PYTHON` | WASM | pyodide | Python interpreter in browser |

## Usage Pattern

```rexx
// Load the module
REQUIRE "registry:org.rexxjs/claude-address"

// Switch to the ADDRESS context
ADDRESS CLAUDE

// Use heredoc format for operations
<<PROMPT
model=claude-3-5-sonnet-20241022
prompt=What is the meaning of life?
PROMPT

// Access results in RESULT variable
SAY RESULT.message
```