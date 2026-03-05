import { z } from 'incur'
import { resolveRuntimeConfig } from '../config/resolve'
import { readConfig } from '../config/store'
import { callTool } from '../mcp/client'
import { CliError, isCliError } from '../shared/errors'

export const connectionOptionsSchema = z.object({
  baseUrl: z.string().optional().describe('Vibeart API base URL (overrides env/config).'),
  apiKey: z.string().optional().describe('API key (overrides env/config).'),
  timeoutMs: z.coerce.number().optional().describe('Request timeout in milliseconds. Default 60000.'),
})

export interface ConnectionOptions {
  baseUrl?: string
  apiKey?: string
  timeoutMs?: number
}

export interface ToolErrorShape {
  code: string
  message: string
}

async function resolveConnection(options: ConnectionOptions): Promise<{ baseUrl: string; apiKey: string; timeoutMs?: number }> {
  const file = await readConfig()
  const resolved = resolveRuntimeConfig({
    flags: {
      baseUrl: options.baseUrl,
      apiKey: options.apiKey,
    },
    env: process.env,
    file,
  })

  if (!resolved.baseUrl) {
    throw new CliError(
      'TRANSPORT_ERROR',
      'Missing base URL. Set --base-url, VIBEART_BASE_URL, or run `vibeart init`.',
      { recoverable: false },
    )
  }

  if (!resolved.apiKey) {
    throw new CliError(
      'AUTH_ERROR',
      'Missing API key. Set --api-key, VIBEART_API_KEY, or run `vibeart auth set-key`.',
      { recoverable: false },
    )
  }

  return {
    baseUrl: resolved.baseUrl,
    apiKey: resolved.apiKey,
    timeoutMs: options.timeoutMs,
  }
}

export async function executeTool<TResult = unknown>(input: {
  toolName: string
  options: ConnectionOptions
  args?: Record<string, unknown>
}): Promise<TResult | null> {
  const connection = await resolveConnection(input.options)

  const envelope = await callTool<TResult>({
    baseUrl: connection.baseUrl,
    apiKey: connection.apiKey,
    toolName: input.toolName,
    input: input.args,
    timeoutMs: connection.timeoutMs,
  })

  return envelope.result
}

export function toToolError(error: unknown): ToolErrorShape {
  if (isCliError(error)) {
    return { code: error.code, message: error.message }
  }

  if (error instanceof Error) {
    return { code: 'INTERNAL_ERROR', message: error.message }
  }

  return { code: 'INTERNAL_ERROR', message: 'Unknown error' }
}
