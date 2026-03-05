import { describe, expect, it } from 'vitest'
import { execa } from 'execa'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

describe('version smoke', () => {
  it('prints version', async () => {
    const { stdout } = await execa('tsx', ['src/cli.ts', '--version'])
    const packageJson = JSON.parse(readFileSync(join(process.cwd(), 'package.json'), 'utf8')) as {
      version: string
    }

    expect(stdout.trim()).toBe(packageJson.version)
  })
})
