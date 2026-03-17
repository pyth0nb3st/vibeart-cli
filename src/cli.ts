#!/usr/bin/env node

import { Cli } from 'incur'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { createAuthCommandGroup, getInitCommand } from './commands/auth'
import { createModelsCommandGroup } from './commands/models'
import { createSessionsCommandGroup } from './commands/sessions'
import { createProjectsCommandGroup } from './commands/projects'
import { createImagesCommandGroup } from './commands/images'
import { createVideoCommandGroup } from './commands/video'
import { createBackgroundCommandGroup } from './commands/background'
import { createTextCommandGroup } from './commands/text'
import { createEmbedsCommandGroup } from './commands/embeds'
import { createCreditsCommandGroup } from './commands/credits'

function resolveCliVersion(): string {
  try {
    const path = fileURLToPath(new URL('../package.json', import.meta.url))
    const raw = readFileSync(path, 'utf8')
    const parsed = JSON.parse(raw) as { version?: unknown }
    if (typeof parsed.version === 'string' && parsed.version.trim()) {
      return parsed.version
    }
  } catch {
    // Fallback keeps CLI usable even if package metadata cannot be read.
  }

  return '0.0.0'
}

Cli.create('vibeart', {
  description: 'Vibeart CLI wrapper for MCP API.',
  version: resolveCliVersion(),
  sync: {
    suggestions: [
      'List my Vibeart sessions',
      'Generate two images in session <session-id> with model flux-schnell',
      'Create a project and move session <session-id> into it',
    ],
  },
})
  .command('init', getInitCommand())
  .command(createAuthCommandGroup())
  .command(createModelsCommandGroup())
  .command(createSessionsCommandGroup())
  .command(createProjectsCommandGroup())
  .command(createImagesCommandGroup())
  .command(createVideoCommandGroup())
  .command(createBackgroundCommandGroup())
  .command(createTextCommandGroup())
  .command(createEmbedsCommandGroup())
  .command(createCreditsCommandGroup())
  .serve()
