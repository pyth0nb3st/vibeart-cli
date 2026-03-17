import { Cli } from 'incur'
import { connectionOptionsSchema, executeTool, toToolError } from './common'

export function createCreditsCommandGroup() {
  return Cli.create('credits', {
    description: 'Credit balance commands.',
  }).command('balance', {
    description: 'Get current credit balance for the authenticated user.',
    options: connectionOptionsSchema,
    async run(c) {
      try {
        const result = await executeTool({
          toolName: 'get_balance',
          options: c.options,
        })

        return c.ok(result)
      } catch (error) {
        return c.error(toToolError(error))
      }
    },
  })
}
