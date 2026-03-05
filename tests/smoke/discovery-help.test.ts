import { describe, expect, it } from 'vitest'
import { execa } from 'execa'

describe('agent discovery built-ins', () => {
  it('shows help for skills add', async () => {
    const { stdout } = await execa('tsx', ['src/cli.ts', 'skills', 'add', '--help'])

    expect(stdout).toContain('skills add')
    expect(stdout).toContain('Sync skill files')
  })

  it('shows help for mcp add', async () => {
    const { stdout } = await execa('tsx', ['src/cli.ts', 'mcp', 'add', '--help'])

    expect(stdout).toContain('mcp add')
    expect(stdout).toContain('Register as an MCP server')
  })
})
