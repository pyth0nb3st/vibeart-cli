import { Cli } from 'incur'
import { connectionOptionsSchema, executeTool, toToolError } from './common'

export function createModelsCommandGroup() {
  return Cli.create('models', {
    description: 'Model discovery commands.',
  })
    .command('list', {
      description: 'List available image generation models.',
      options: connectionOptionsSchema,
      async run(c) {
        try {
          const result = await executeTool({
            toolName: 'list_models',
            options: c.options,
          })

          return c.ok(result)
        } catch (error) {
          return c.error(toToolError(error))
        }
      },
    })
    .command('list-edit', {
      description: 'List available image editing models.',
      options: connectionOptionsSchema,
      async run(c) {
        try {
          const result = await executeTool({
            toolName: 'list_edit_models',
            options: c.options,
          })

          return c.ok(result)
        } catch (error) {
          return c.error(toToolError(error))
        }
      },
    })
    .command('list-video', {
      description: 'List available video generation models.',
      options: connectionOptionsSchema,
      async run(c) {
        try {
          const result = await executeTool({
            toolName: 'list_video_models',
            options: c.options,
          })

          return c.ok(result)
        } catch (error) {
          return c.error(toToolError(error))
        }
      },
    })
}
