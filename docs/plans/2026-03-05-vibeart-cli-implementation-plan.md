# Vibeart CLI Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a standalone, installable `vibeart-cli` that wraps Vibeart MCP API with API Key auth and agent discovery support.

**Architecture:** Use `incur` as command framework, map each CLI command to one MCP `tools/call`, and keep business logic server-side. Centralize config/auth/transport in shared modules with strict precedence rules and stable error envelopes.

**Tech Stack:** TypeScript, Node.js, `incur`, native `fetch`, Zod, Vitest.

---

### Task 1: Bootstrap project and toolchain

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `vitest.config.ts`
- Create: `src/cli.ts`
- Create: `tests/smoke/version.test.ts`

**Step 1: Write failing smoke test**

```ts
import { describe, it, expect } from 'vitest'
import { execa } from 'execa'

describe('version smoke', () => {
  it('prints version', async () => {
    const { stdout } = await execa('node', ['dist/cli.js', '--version'])
    expect(stdout.trim()).toBe('0.1.0')
  })
})
```

**Step 2: Run test to verify fail**

Run: `npm run test -- tests/smoke/version.test.ts`
Expected: FAIL (missing build output / CLI entry)

**Step 3: Add minimal project config and CLI entry**

- `package.json` with scripts: `build`, `test`, `dev`
- `src/cli.ts` minimal `incur` root command with version

**Step 4: Build and rerun test**

Run:
- `npm run build`
- `npm run test -- tests/smoke/version.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add package.json tsconfig.json vitest.config.ts src/cli.ts tests/smoke/version.test.ts
git commit -m "chore: bootstrap vibeart-cli with incur"
```

### Task 2: Implement config resolution and init/auth commands

**Files:**
- Create: `src/config/store.ts`
- Create: `src/config/resolve.ts`
- Create: `src/commands/auth.ts`
- Modify: `src/cli.ts`
- Create: `tests/unit/config-resolution.test.ts`

**Step 1: Write failing tests for precedence**

Cover:
- flag overrides env/config
- env overrides config
- config fallback

**Step 2: Run tests and confirm fail**

Run: `npm run test -- tests/unit/config-resolution.test.ts`
Expected: FAIL

**Step 3: Implement config storage and resolver**

- file path: `~/.config/vibeart/config.json`
- permission hardening (best effort 0600)
- resolver input: `{ flagBaseUrl, flagApiKey }`

**Step 4: Implement commands**

- `vibeart init`
- `vibeart auth set-key`
- `vibeart auth status`

**Step 5: Run tests**

Run:
- `npm run test -- tests/unit/config-resolution.test.ts`
Expected: PASS

**Step 6: Commit**

```bash
git add src/config src/commands/auth.ts src/cli.ts tests/unit/config-resolution.test.ts
git commit -m "feat: add init and api key configuration flow"
```

### Task 3: Build MCP transport client and error mapping

**Files:**
- Create: `src/mcp/client.ts`
- Create: `src/shared/errors.ts`
- Create: `src/shared/logging.ts`
- Create: `tests/unit/mcp-client.test.ts`

**Step 1: Write failing tests**

Cases:
- successful tool call parses result
- 401 mapped to auth error
- timeout mapped to transport error
- MCP `success=false` mapped to domain error

**Step 2: Verify tests fail**

Run: `npm run test -- tests/unit/mcp-client.test.ts`
Expected: FAIL

**Step 3: Implement MCP client**

- POST `<baseUrl>/api/mcp`
- JSON-RPC request id generation
- timeout with `AbortController`
- header injection with API key

**Step 4: Run tests**

Expected: PASS

**Step 5: Commit**

```bash
git add src/mcp/client.ts src/shared/errors.ts src/shared/logging.ts tests/unit/mcp-client.test.ts
git commit -m "feat: add mcp transport client with error normalization"
```

### Task 4: Add read commands (models/sessions/projects)

**Files:**
- Create: `src/commands/models.ts`
- Create: `src/commands/sessions.ts`
- Create: `src/commands/projects.ts`
- Modify: `src/cli.ts`
- Create: `tests/smoke/read-commands.test.ts`

**Step 1: Write failing smoke tests with mocked MCP client**

Commands:
- `models list`
- `sessions list`
- `sessions get`
- `projects list`
- `projects get`

**Step 2: Verify fail**

Run: `npm run test -- tests/smoke/read-commands.test.ts`
Expected: FAIL

**Step 3: Implement commands and wire to MCP tools**

- ensure arg/options schema explicit with Zod
- map command output to `c.ok(...)`

**Step 4: Run tests**

Expected: PASS

**Step 5: Commit**

```bash
git add src/commands/models.ts src/commands/sessions.ts src/commands/projects.ts src/cli.ts tests/smoke/read-commands.test.ts
git commit -m "feat: add read commands for models sessions and projects"
```

### Task 5: Add write commands for V1 high-frequency operations

**Files:**
- Create: `src/commands/images.ts`
- Create: `src/commands/video.ts`
- Modify: `src/commands/sessions.ts`
- Modify: `src/commands/projects.ts`
- Modify: `src/cli.ts`
- Create: `tests/smoke/write-commands.test.ts`

**Step 1: Write failing tests**

Commands:
- `sessions create`
- `projects create`
- `projects move-session`
- `images generate`
- `images edit`
- `video generate`

**Step 2: Verify fail**

Run: `npm run test -- tests/smoke/write-commands.test.ts`
Expected: FAIL

**Step 3: Implement commands**

- strict input schemas
- pass-through to corresponding MCP tools
- normalized error output

**Step 4: Run tests**

Expected: PASS

**Step 5: Commit**

```bash
git add src/commands/images.ts src/commands/video.ts src/commands/sessions.ts src/commands/projects.ts src/cli.ts tests/smoke/write-commands.test.ts
git commit -m "feat: add v1 high-frequency write commands"
```

### Task 6: Agent discovery and packaging readiness

**Files:**
- Modify: `src/cli.ts`
- Modify: `package.json`
- Modify: `README.md`
- Create: `.env.example`
- Create: `tests/smoke/discovery-help.test.ts`

**Step 1: Write failing tests**

Check:
- `vibeart skills add --help`
- `vibeart mcp add --help`

**Step 2: Verify fail**

Run: `npm run test -- tests/smoke/discovery-help.test.ts`
Expected: FAIL

**Step 3: Configure root CLI metadata**

- add description/version/suggestions
- ensure built-in discovery commands available

**Step 4: Update docs**

- install and quickstart
- `init` + `skills add` + `mcp add` examples

**Step 5: Run tests**

Expected: PASS

**Step 6: Commit**

```bash
git add src/cli.ts package.json README.md .env.example tests/smoke/discovery-help.test.ts
git commit -m "feat: enable agent discovery and packaging docs"
```

### Task 7: End-to-end validation and release prep

**Files:**
- Modify: `README.md`
- Create: `scripts/smoke-release.sh`

**Step 1: Add release smoke script**

Commands:
- `npm run build`
- `node dist/cli.js --version`
- `node dist/cli.js --help`
- `node dist/cli.js models list --base-url ... --api-key ... --format json`

**Step 2: Run full test suite**

Run:
- `npm run test`
- `npm run build`

Expected: PASS

**Step 3: Final docs pass**

- verify all examples reflect real command names

**Step 4: Commit**

```bash
git add scripts/smoke-release.sh README.md
git commit -m "chore: add release smoke validation"
```
