# vibeart-cli Agent README

This document is for AI agents (Codex/Claude/Cursor/CI bots) that call `vibeart-cli` non-interactively.

## Links

- Website: https://vibeart.app
- GitHub: https://github.com/pyth0nb3st/vibeart-cli
- npm: https://www.npmjs.com/package/vibeart-cli

## Goals

- Deterministic command execution
- JSON-friendly output parsing
- No secret leakage in logs
- Minimal human interaction

## Requirements

- Node.js `>=20`
- Network access to Vibeart MCP endpoint (`<base-url>/api/mcp`)
- Valid API key (`vk_...`)

## Install

```bash
npm i -g vibeart-cli
```

One-shot execution (no global install):

```bash
npx --yes --package vibeart-cli -- vibeart --help
```

## Non-Interactive Setup

Preferred for agents: use environment variables.

```bash
export VIBEART_BASE_URL="https://vibeart.app"
export VIBEART_API_KEY="vk_xxx"
```

Optional local config bootstrap:

```bash
vibeart init --base-url "$VIBEART_BASE_URL" --api-key "$VIBEART_API_KEY" --non-interactive
```

Resolution priority:

1. CLI flags (`--base-url`, `--api-key`)
2. Environment (`VIBEART_BASE_URL`, `VIBEART_API_KEY`)
3. Local config (`~/.config/vibeart/config.json`)

## Output Strategy For Agents

Use `--format json` for all machine parsing.

```bash
vibeart auth status --format json
vibeart models list --format json
```

## Command Map (CLI -> MCP Tool)

- `vibeart models list` -> `list_models`
- `vibeart sessions list` -> `list_sessions`
- `vibeart sessions get <sessionId>` -> `get_session`
- `vibeart sessions create [name] --project-id <id>` -> `create_session`
- `vibeart projects list` -> `list_projects`
- `vibeart projects get <projectId>` -> `get_project`
- `vibeart projects create --name <name> [--description <text>]` -> `create_project`
- `vibeart projects move-session --session-id <id> (--project-id <id> | --unassign)` -> `move_session_to_project`
- `vibeart images generate --session-id <id> --prompt <text> ...` -> `generate_images`
- `vibeart images edit --session-id <id> --prompt <text> --image-urls <u1,u2,...> ...` -> `edit_images`
- `vibeart video generate --session-id <id> --prompt <text> ...` -> `generate_video`

## Common Agent Flows

Check connectivity/auth:

```bash
vibeart auth status --format json
```

Create session and generate images:

```bash
SESSION_ID=$(vibeart sessions create "agent-run" --format json | jq -r '.id')
vibeart images generate \
  --session-id "$SESSION_ID" \
  --prompt "A cinematic portrait" \
  --quantity 2 \
  --format json
```

Create project and move session:

```bash
PROJECT_ID=$(vibeart projects create --name "Agent Project" --format json | jq -r '.id')
vibeart projects move-session --session-id "$SESSION_ID" --project-id "$PROJECT_ID" --format json
```

## Error Handling Contract

- Non-zero exit code means command failure.
- Parse JSON error payload (when `--format json`) for:
  - `code`
  - `message`

Suggested retry policy:

- Retry: transient network/timeout errors
- Do not retry blindly: auth/validation errors

## Secret Safety

- Never hardcode API keys in prompts/scripts checked into git.
- Prefer env vars over CLI flags in shared logs (flags can appear in process args/history).
- Do not print full API keys; only masked values are safe for logs.

## Agent Discovery

Expose command knowledge to agent ecosystems:

```bash
vibeart skills add
vibeart mcp add --agent codex --agent claude-code --agent cursor
```
