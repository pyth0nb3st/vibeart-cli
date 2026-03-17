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
    .command('merge', {
      description: 'Merge multiple sessions into one with grid, horizontal, or vertical layout.',
      options: connectionOptionsSchema.extend({
        sourceSessionIds: z.string().describe('Comma-separated session IDs to merge (at least 2).'),
        targetSessionId: z.string().optional().describe('Target session to merge into. Creates a new session if omitted.'),
        name: z.string().optional().describe('Name for the new merged session.'),
        projectId: z.string().optional().describe('Project ID for the new session.'),
        layout: z.string().optional().describe('Layout: grid, horizontal, or vertical. Default: grid.'),
        columns: z.coerce.number().optional().describe('Number of columns for grid layout. Default: 3.'),
        gap: z.coerce.number().optional().describe('Gap between items in pixels. Default: 40.'),
        deleteSourceSessions: z.boolean().optional().describe('Delete source sessions after merging.'),
      }),
      async run(c) {
        try {
          const sourceSessionIds = c.options.sourceSessionIds
            .split(',')
            .map((id) => id.trim())
            .filter(Boolean)

          if (sourceSessionIds.length < 2) {
            return c.error({ code: 'VALIDATION_ERROR', message: 'Provide at least 2 session IDs.' })
          }

          const result = await executeTool({
            toolName: 'merge_sessions',
            options: c.options,
            args: {
              sourceSessionIds,
              ...(c.options.targetSessionId ? { targetSessionId: c.options.targetSessionId } : {}),
              ...(c.options.name ? { name: c.options.name } : {}),
              ...(c.options.projectId ? { projectId: c.options.projectId } : {}),
              ...(c.options.layout ? { layout: c.options.layout } : {}),
              ...(typeof c.options.columns === 'number' ? { columns: c.options.columns } : {}),
              ...(typeof c.options.gap === 'number' ? { gap: c.options.gap } : {}),
              ...(typeof c.options.deleteSourceSessions === 'boolean'
                ? { deleteSourceSessions: c.options.deleteSourceSessions }
                : {}),
            },
          })

          return c.ok(result)
        } catch (error) {
          return c.error(toToolError(error))
        }
      },
    })
    .command('protect', {
      description: 'Protect a session from destructive operations (merge/delete).',
      args: z.object({
        sessionId: z.string().describe('Session ID to protect.'),
      }),
      options: connectionOptionsSchema,
      async run(c) {
        try {
          const result = await executeTool({
            toolName: 'protect_session',
            options: c.options,
            args: { sessionId: c.args.sessionId },
          })

          return c.ok(result)
        } catch (error) {
          return c.error(toToolError(error))
        }
      },
    })
    .command('unprotect', {
      description: 'Remove protection from a session, allowing merge/delete again.',
      args: z.object({
        sessionId: z.string().describe('Session ID to unprotect.'),
      }),
      options: connectionOptionsSchema,
      async run(c) {
        try {
          const result = await executeTool({
            toolName: 'unprotect_session',
            options: c.options,
            args: { sessionId: c.args.sessionId },
          })

          return c.ok(result)
        } catch (error) {
          return c.error(toToolError(error))
        }
      },
    })
}
