#!/usr/bin/env node

import { Cli } from 'incur'
import { createAuthCommandGroup, getInitCommand } from './commands/auth'
import { createModelsCommandGroup } from './commands/models'
import { createSessionsCommandGroup } from './commands/sessions'
import { createProjectsCommandGroup } from './commands/projects'
import { createImagesCommandGroup } from './commands/images'
import { createVideoCommandGroup } from './commands/video'

Cli.create('vibeart', {
  description: 'Vibeart CLI wrapper for MCP API.',
  version: '0.1.0',
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
  .serve()
