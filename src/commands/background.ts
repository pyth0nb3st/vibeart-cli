import { Cli, z } from 'incur'
import { connectionOptionsSchema, executeTool, toToolError } from './common'

function splitUrls(value: string): string[] {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

export function createBackgroundCommandGroup() {
  return Cli.create('background', {
    description: 'Background removal commands.',
  })
    .command('list-providers', {
      description: 'List background removal providers.',
      options: connectionOptionsSchema,
      async run(c) {
        try {
          const result = await executeTool({
            toolName: 'list_background_providers',
            options: c.options,
          })

          return c.ok(result)
        } catch (error) {
          return c.error(toToolError(error))
        }
      },
    })
    .command('remove', {
      description: 'Remove background from a single image.',
      options: connectionOptionsSchema.extend({
        imageUrl: z.string().describe('Image URL to process.'),
        provider: z.string().optional().describe('Provider: fal, local, openai, remove-bg, photoroom, replicate-birefnet, replicate-rembg, replicate-851. Default: fal.'),
      }),
      async run(c) {
        try {
          const result = await executeTool({
            toolName: 'remove_background',
            options: c.options,
            args: {
              imageUrl: c.options.imageUrl,
              ...(c.options.provider ? { provider: c.options.provider } : {}),
            },
          })

          return c.ok(result)
        } catch (error) {
          return c.error(toToolError(error))
        }
      },
    })
    .command('batch-remove', {
      description: 'Remove backgrounds from multiple images (up to 10).',
      options: connectionOptionsSchema.extend({
        imageUrls: z.string().describe('Comma-separated image URLs to process.'),
        provider: z.string().optional().describe('Provider. Default: fal.'),
      }),
      async run(c) {
        try {
          const urls = splitUrls(c.options.imageUrls)

          if (urls.length === 0) {
            return c.error({ code: 'VALIDATION_ERROR', message: 'Provide at least one image URL.' })
          }

          const result = await executeTool({
            toolName: 'batch_remove_background',
            options: c.options,
            args: {
              imageUrls: urls,
              ...(c.options.provider ? { provider: c.options.provider } : {}),
            },
          })

          return c.ok(result)
        } catch (error) {
          return c.error(toToolError(error))
        }
      },
    })
}
