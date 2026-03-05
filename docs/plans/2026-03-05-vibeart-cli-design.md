# Vibeart CLI Design

**Date:** 2026-03-05
**Scope:** Standalone `vibeart-cli` repository using `incur`, wrapping existing Vibeart MCP API.

## 1. Product Intent

Build a production-installable CLI that is:

- independent from the Vibeart web repo,
- API-driven (no local DB/service coupling),
- optimized for AI agents first,
- stable with API Key auth for V1.

## 2. Architecture

The CLI is a thin wrapper over MCP tools exposed by Vibeart backend:

- transport: HTTP JSON-RPC to `<baseUrl>/api/mcp`
- auth: `Authorization: Bearer <apiKey>`
- command layer: `incur` command definitions
- discovery layer: built-in `skills add` and `mcp add`

No business logic duplication in CLI.

## 3. Command Surface (V1 High-Frequency)

Human-readable command groups mapped to MCP tools:

- `models list` -> `list_models`
- `sessions list` -> `list_sessions`
- `sessions get` -> `get_session`
- `sessions create` -> `create_session`
- `projects list` -> `list_projects`
- `projects get` -> `get_project`
- `projects create` -> `create_project`
- `projects move-session` -> `move_session_to_project`
- `images generate` -> `generate_images`
- `images edit` -> `edit_images`
- `video generate` -> `generate_video`

## 4. Configuration Strategy

Resolution priority:

- flags > environment variables > local config file

Keys:

- `baseUrl`: `--base-url` > `VIBEART_BASE_URL` > local config
- `apiKey`: `--api-key` > `VIBEART_API_KEY` > local config

Config file location:

- macOS/Linux: `~/.config/vibeart/config.json`

## 5. Auth Strategy (V1)

API Key only:

- no OAuth flow in V1
- key never logged in full
- status command shows masked prefix only

## 6. Reliability & Error Handling

- default request timeout: 60s (overridable)
- normalized error classes:
  - network/transport
  - auth (401/403)
  - MCP envelope failure (`success=false`)
  - invalid response contract
- `--verbose` prints latency, tool name, request id if available

## 7. Install & Distribution

- npm package with `bin: vibeart`
- supports `npx`, `pnpm dlx`, `bunx`
- first release target: `0.1.0`

## 8. Non-Goals for V1

- OAuth login
- dual REST + MCP transport
- full MCP tool parity
- advanced TUI
