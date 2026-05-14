import { Cli, z } from 'incur'
import { connectionOptionsSchema, executeTool, toToolError } from './common'

function buildPosition(x?: number, y?: number): { x: number; y: number } | undefined {
  const hasX = typeof x === 'number'
  const hasY = typeof y === 'number'

  if (!hasX && !hasY) return undefined
  if (hasX && hasY) return { x, y }

  throw new Error('Provide both --x and --y when setting upload position.')
}

export function createMediaCommandGroup() {
  return Cli.create('media', {
    description: 'Media upload commands.',
  }).command('upload', {
    description: 'Upload image, audio, or video media to a canvas session from a URL or data URI.',
    options: connectionOptionsSchema.extend({
      sessionId: z.string().describe('Target session ID.'),
      source: z.string().describe('HTTP/HTTPS URL or data URI (data:<mimeType>;base64,...).'),
      filename: z.string().optional().describe('Optional filename override.'),
      label: z.string().optional().describe('Optional label for the canvas item.'),
      x: z.coerce.number().optional().describe('Optional X position in canvas coordinates. Requires --y.'),
      y: z.coerce.number().optional().describe('Optional Y position in canvas coordinates. Requires --x.'),
    }),
    async run(c) {
      let position: { x: number; y: number } | undefined
      try {
        position = buildPosition(c.options.x, c.options.y)
      } catch (error) {
        return c.error({
          code: 'VALIDATION_ERROR',
          message: error instanceof Error ? error.message : 'Invalid upload position.',
        })
      }

      try {
        const result = await executeTool({
          toolName: 'upload_media',
          options: c.options,
          args: {
            sessionId: c.options.sessionId,
            source: c.options.source,
            ...(c.options.filename ? { filename: c.options.filename } : {}),
            ...(c.options.label ? { label: c.options.label } : {}),
            ...(position ? { position } : {}),
          },
        })

        return c.ok(result)
      } catch (error) {
        return c.error(toToolError(error))
      }
    },
  })
}
