import { Cli, z } from 'incur'
import { connectionOptionsSchema, executeTool, toToolError } from './common'

export function createTextCommandGroup() {
  return Cli.create('text', {
    description: 'Text node commands.',
  })
    .command('create', {
      description: 'Create a text node in a canvas session.',
      options: connectionOptionsSchema.extend({
        sessionId: z.string().describe('Target session ID.'),
        textContent: z.string().describe('Text content for the node.'),
        label: z.string().optional().describe('Optional label for the node.'),
        textRole: z.string().optional().describe('Semantic role: normal or system.'),
        x: z.coerce.number().optional().describe('X position in canvas coordinates.'),
        y: z.coerce.number().optional().describe('Y position in canvas coordinates.'),
        width: z.coerce.number().optional().describe('Node width in pixels.'),
        height: z.coerce.number().optional().describe('Node height in pixels.'),
      }),
      async run(c) {
        try {
          const result = await executeTool({
            toolName: 'create_text_node',
            options: c.options,
            args: {
              sessionId: c.options.sessionId,
              textContent: c.options.textContent,
              ...(c.options.label ? { label: c.options.label } : {}),
              ...(c.options.textRole ? { textRole: c.options.textRole } : {}),
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
    .command('update', {
      description: 'Update the content or metadata of an existing text node.',
      options: connectionOptionsSchema.extend({
        sessionId: z.string().describe('Session ID containing the text node.'),
        itemId: z.string().describe('Text node item ID to update.'),
        textContent: z.string().optional().describe('Updated text content.'),
        label: z.string().optional().describe('Updated label.'),
        textRole: z.string().optional().describe('Updated semantic role: normal or system.'),
        x: z.coerce.number().optional().describe('Updated X position.'),
        y: z.coerce.number().optional().describe('Updated Y position.'),
        width: z.coerce.number().optional().describe('Updated width in pixels.'),
        height: z.coerce.number().optional().describe('Updated height in pixels.'),
      }),
      async run(c) {
        try {
          const result = await executeTool({
            toolName: 'update_text_node',
            options: c.options,
            args: {
              sessionId: c.options.sessionId,
              itemId: c.options.itemId,
              ...(c.options.textContent ? { textContent: c.options.textContent } : {}),
              ...(c.options.label ? { label: c.options.label } : {}),
              ...(c.options.textRole ? { textRole: c.options.textRole } : {}),
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
