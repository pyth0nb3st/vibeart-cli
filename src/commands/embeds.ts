import { Cli, z } from 'incur'
import { connectionOptionsSchema, executeTool, toToolError } from './common'

export function createEmbedsCommandGroup() {
  return Cli.create('embeds', {
    description: 'Embed external content commands.',
  }).command('create', {
    description: 'Embed external content (e.g. a tweet/X post) on a canvas session.',
    options: connectionOptionsSchema.extend({
      sessionId: z.string().describe('Target session ID.'),
      url: z.string().describe('URL to embed (e.g. https://x.com/user/status/123).'),
      label: z.string().optional().describe('Optional label for the embed node.'),
      x: z.coerce.number().optional().describe('X position in canvas coordinates.'),
      y: z.coerce.number().optional().describe('Y position in canvas coordinates.'),
      width: z.coerce.number().optional().describe('Node width in pixels.'),
      height: z.coerce.number().optional().describe('Node height in pixels.'),
    }),
    async run(c) {
      try {
        const result = await executeTool({
          toolName: 'create_embed_node',
          options: c.options,
          args: {
            sessionId: c.options.sessionId,
            url: c.options.url,
            ...(c.options.label ? { label: c.options.label } : {}),
            ...(typeof c.options.x === 'number' ? { x: c.options.x } : {}),
            ...(typeof c.options.y === 'number' ? { y: c.options.y } : {}),
            ...(typeof c.options.width === 'number' ? { width: c.options.width } : {}),
            ...(typeof c.options.height === 'number' ? { height: c.options.height } : {}),
          },
        })

        return c.ok(result)
      } catch (error) {
        return c.error(toToolError(error))
      }
    },
  })
}
