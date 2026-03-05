import { randomUUID } from 'node:crypto'
import { CliError } from '../shared/errors'
import { createLogger } from '../shared/logging'

export interface McpToolError {
  code: string
  message: string
  recoverable: boolean
}

export interface McpToolEnvelope<TResult = unknown> {
  contractVersion: string
  success: boolean
  result: TResult | null
  error: McpToolError | null
}

export interface CallToolOptions {
  baseUrl: string
  apiKey: string
  toolName: string
  input?: Record<string, unknown>
  timeoutMs?: number
  fetchImpl?: typeof fetch
  verbose?: boolean
}

function normalizeBaseUrl(baseUrl: string): string {
  const trimmed = baseUrl.trim()
  if (!trimmed) {
    throw new CliError('INVALID_RESPONSE', 'Base URL is required.')
  }

  return trimmed.endsWith('/') ? trimmed.slice(0, -1) : trimmed
}

function mcpEndpoint(baseUrl: string): string {
  const normalized = normalizeBaseUrl(baseUrl)
  if (normalized.endsWith('/api/mcp')) {
    return normalized
  }

  return `${normalized}/api/mcp`
}

async function readJson(response: Response): Promise<unknown> {
  const text = await response.text()
  if (!text.trim()) return undefined

  try {
    return JSON.parse(text)
  } catch {
    return { rawText: text }
  }
}

function isMcpToolError(value: unknown): value is McpToolError {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Record<string, unknown>
  return (
    typeof candidate.code === 'string' &&
    typeof candidate.message === 'string' &&
    typeof candidate.recoverable === 'boolean'
  )
}

function parseEnvelope(value: unknown): McpToolEnvelope {
  if (!value || typeof value !== 'object') {
    throw new CliError('INVALID_RESPONSE', 'MCP response missing structuredContent.')
  }

  const record = value as Record<string, unknown>
  const contractVersion = record.contractVersion
  const success = record.success
  const result = record.result
  const error = record.error

  if (typeof contractVersion !== 'string' || typeof success !== 'boolean') {
    throw new CliError('INVALID_RESPONSE', 'MCP envelope has invalid shape.')
  }

  if (error !== null && !isMcpToolError(error)) {
    throw new CliError('INVALID_RESPONSE', 'MCP envelope error field has invalid shape.')
  }

  return {
    contractVersion,
    success,
    result: (result as unknown) ?? null,
    error: (error as McpToolError | null) ?? null,
  }
}

export async function callTool<TResult = unknown>(options: CallToolOptions): Promise<McpToolEnvelope<TResult>> {
  const logger = createLogger(options.verbose)
  const fetchImpl = options.fetchImpl ?? fetch
  const timeoutMs = options.timeoutMs ?? 60_000
  const endpoint = mcpEndpoint(options.baseUrl)
  const requestId = randomUUID()
  const sessionId = randomUUID()

  const controller = new AbortController()
  const timeout = setTimeout(() => {
    controller.abort()
  }, timeoutMs)

  const body = {
    jsonrpc: '2.0',
    id: requestId,
    method: 'tools/call',
    params: {
      name: options.toolName,
      arguments: options.input ?? {},
    },
  }

  logger.debug('Calling MCP tool', {
    endpoint,
    requestId,
    toolName: options.toolName,
    timeoutMs,
  })

  let response: Response
  try {
    response = await fetchImpl(endpoint, {
      method: 'POST',
      headers: {
        accept: 'application/json, text/event-stream',
        'content-type': 'application/json',
        authorization: `Bearer ${options.apiKey}`,
        'mcp-session-id': sessionId,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new CliError('TRANSPORT_TIMEOUT', `Request timed out after ${timeoutMs}ms.`, {
        recoverable: true,
        cause: error,
      })
    }

    throw new CliError('TRANSPORT_ERROR', 'Failed to call MCP endpoint.', {
      recoverable: true,
      cause: error,
    })
  } finally {
    clearTimeout(timeout)
  }

  const payload = await readJson(response)

  if (response.status === 401 || response.status === 403) {
    const message =
      (payload as { error?: { message?: string } } | undefined)?.error?.message ??
      'Authentication failed.'

    throw new CliError('AUTH_ERROR', message, {
      status: response.status,
      recoverable: false,
      details: payload,
    })
  }

  if (!response.ok) {
    throw new CliError('TRANSPORT_ERROR', `HTTP ${response.status} from MCP endpoint.`, {
      status: response.status,
      recoverable: true,
      details: payload,
    })
  }

  if (!payload || typeof payload !== 'object') {
    throw new CliError('INVALID_RESPONSE', 'MCP endpoint returned non-object JSON payload.', {
      details: payload,
    })
  }

  const rpc = payload as {
    error?: { code?: unknown; message?: unknown }
    result?: { structuredContent?: unknown }
  }

  if (rpc.error) {
    const message = typeof rpc.error.message === 'string' ? rpc.error.message : 'MCP request failed.'
    throw new CliError('MCP_ERROR', message, {
      details: rpc.error,
      recoverable: false,
    })
  }

  const envelope = parseEnvelope(rpc.result?.structuredContent) as McpToolEnvelope<TResult>
  if (!envelope.success) {
    throw new CliError('MCP_ERROR', envelope.error?.message ?? 'MCP tool failed.', {
      recoverable: envelope.error?.recoverable ?? false,
      details: envelope.error,
    })
  }

  return envelope
}
