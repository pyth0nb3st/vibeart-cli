import { Cli, z } from 'incur'
import { connectionOptionsSchema, executeTool, toToolError } from './common'

export function createSessionsCommandGroup() {
  return Cli.create('sessions', {
    description: 'Canvas session commands.',
  })
    .command('list', {
      description: 'List all canvas sessions for the authenticated user.',
      options: connectionOptionsSchema,
      async run(c) {
        try {
          const result = await executeTool({
            toolName: 'list_sessions',
            options: c.options,
          })

          return c.ok(result)
        } catch (error) {
          return c.error(toToolError(error))
        }
      },
    })
    .command('get', {
      description: 'Get one canvas session and its items.',
      args: z.object({
        sessionId: z.string().describe('Canvas session ID.'),
      }),
      options: connectionOptionsSchema,
      async run(c) {
        try {
          const result = await executeTool({
            toolName: 'get_session',
            options: c.options,
            args: {
              sessionId: c.args.sessionId,
            },
          })

          return c.ok(result)
        } catch (error) {
          return c.error(toToolError(error))
        }
      },
    })
    .command('create', {
      description: 'Create a new canvas session.',
      args: z.object({
        name: z.string().optional().describe('Session name. Defaults to "Untitled".'),
      }),
      options: connectionOptionsSchema.extend({
        projectId: z.string().optional().describe('Optional project ID to assign the session to.'),
      }),
      async run(c) {
        try {
          const result = await executeTool({
            toolName: 'create_session',
            options: c.options,
            args: {
              ...(c.args.name ? { name: c.args.name } : {}),
              ...(c.options.projectId ? { projectId: c.options.projectId } : {}),
            },
          })

          return c.ok(result)
        } catch (error) {
          return c.error(toToolError(error))
        }
      },
    })
}
