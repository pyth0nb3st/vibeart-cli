import { Cli, z } from 'incur'
import { connectionOptionsSchema, executeTool, toToolError } from './common'

export function createProjectsCommandGroup() {
  return Cli.create('projects', {
    description: 'Project management commands.',
  })
    .command('list', {
      description: 'List projects for the authenticated user.',
      options: connectionOptionsSchema,
      async run(c) {
        try {
          const result = await executeTool({
            toolName: 'list_projects',
            options: c.options,
          })

          return c.ok(result)
        } catch (error) {
          return c.error(toToolError(error))
        }
      },
    })
    .command('get', {
      description: 'Get one project by id.',
      args: z.object({
        projectId: z.string().describe('Project ID.'),
      }),
      options: connectionOptionsSchema,
      async run(c) {
        try {
          const result = await executeTool({
            toolName: 'get_project',
            options: c.options,
            args: {
              projectId: c.args.projectId,
            },
          })

          return c.ok(result)
        } catch (error) {
          return c.error(toToolError(error))
        }
      },
    })
    .command('create', {
      description: 'Create a new project.',
      options: connectionOptionsSchema.extend({
        name: z.string().describe('Project name.'),
        description: z.string().optional().describe('Optional project description.'),
      }),
      async run(c) {
        try {
          const result = await executeTool({
            toolName: 'create_project',
            options: c.options,
            args: {
              name: c.options.name,
              ...(c.options.description ? { description: c.options.description } : {}),
            },
          })

          return c.ok(result)
        } catch (error) {
          return c.error(toToolError(error))
        }
      },
    })
    .command('move-session', {
      description: 'Move a session into a project or unassign it.',
      options: connectionOptionsSchema.extend({
        sessionId: z.string().describe('Session ID to move.'),
        projectId: z.string().optional().describe('Target project ID.'),
        unassign: z.boolean().optional().describe('Remove session from current project.'),
      }),
      async run(c) {
        try {
          if (!c.options.unassign && !c.options.projectId) {
            return c.error({
              code: 'VALIDATION_ERROR',
              message: 'Provide --project-id or --unassign.',
            })
          }

          const result = await executeTool({
            toolName: 'move_session_to_project',
            options: c.options,
            args: {
              sessionId: c.options.sessionId,
              projectId: c.options.unassign ? null : (c.options.projectId ?? null),
            },
          })

          return c.ok(result)
        } catch (error) {
          return c.error(toToolError(error))
        }
      },
    })
}
