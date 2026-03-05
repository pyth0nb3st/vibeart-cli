import { describe, expect, it } from 'vitest'
import { execa } from 'execa'

describe('version smoke', () => {
  it('prints version', async () => {
    const { stdout } = await execa('node', ['dist/cli.js', '--version'])
    expect(stdout.trim()).toBe('0.1.0')
  })
})
