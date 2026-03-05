# vibeart-cli

Standalone CLI wrapper for Vibeart MCP API, built with `incur`.

Agent-focused guide: [README.agent.md](./README.agent.md)

## Install

```bash
npm i -g vibeart-cli
```

Run without installation:

```bash
npx vibeart-cli --help
pnpm dlx vibeart-cli --help
bunx vibeart-cli --help
```

## Quickstart

1. Initialize local config:

```bash
vibeart init --base-url https://vibeart.app --api-key vk_xxx --non-interactive
```

2. Verify auth and config resolution:

```bash
vibeart auth status --format json
```

3. Run commands:

```bash
vibeart models list --format json
vibeart sessions list --format json
vibeart images generate --session-id <id> --prompt "A cinematic portrait" --format json
```

## Agent Discovery

Sync skills to coding agents:

```bash
vibeart skills add
```

Register as MCP server:

```bash
vibeart mcp add --agent codex --agent claude-code --agent cursor
```

## Configuration Priority

For both base URL and API key:

1. CLI flags (`--base-url`, `--api-key`)
2. Environment variables (`VIBEART_BASE_URL`, `VIBEART_API_KEY`)
3. Local config file (`~/.config/vibeart/config.json`)

## V1 Command Surface

- `vibeart init`
- `vibeart auth set-key`
- `vibeart auth status`
- `vibeart models list`
- `vibeart sessions list|get|create`
- `vibeart projects list|get|create|move-session`
- `vibeart images generate|edit`
- `vibeart video generate`
