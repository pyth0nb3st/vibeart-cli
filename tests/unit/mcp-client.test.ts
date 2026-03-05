import { afterEach, describe, expect, it, vi } from 'vitest'
import { callTool } from '../../src/mcp/client'

function makeSuccessResponse(result: unknown) {
  return new Response(
    JSON.stringify({
      jsonrpc: '2.0',
      id: '1',
      result: {
        structuredContent: {
          contractVersion: '1.0.0',
          success: true,
          result,
          error: null,
        },
      },
    }),
    {
      status: 200,
      headers: { 'content-type': 'application/json' },
    },
  )
}

afterEach(() => {
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

describe('callTool', () => {
  it('returns structured result on success', async () => {
    const fetchMock = vi.fn().mockResolvedValue(makeSuccessResponse({ ok: true }))
    vi.stubGlobal('fetch', fetchMock)

    const result = await callTool({
      baseUrl: 'https://api.example.com',
      apiKey: 'vk_test',
      toolName: 'list_models',
      input: {},
    })

    expect(result.success).toBe(true)
    expect(result.result).toEqual({ ok: true })

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    const headers = init.headers as Record<string, string>
    expect(url).toBe('https://api.example.com/api/mcp')
    expect(headers.accept).toBe('application/json, text/event-stream')
    expect(typeof headers['mcp-session-id']).toBe('string')
    expect(headers['mcp-session-id'].length).toBeGreaterThan(0)
  })

  it('accepts base URL that already includes /api/mcp', async () => {
    const fetchMock = vi.fn().mockResolvedValue(makeSuccessResponse({ ok: true }))
    vi.stubGlobal('fetch', fetchMock)

    await callTool({
      baseUrl: 'https://api.example.com/api/mcp',
      apiKey: 'vk_test',
      toolName: 'list_models',
      input: {},
    })

    const [url] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe('https://api.example.com/api/mcp')
  })

  it('maps 401 response to auth error', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ error: { message: 'Invalid token' } }), {
          status: 401,
          headers: { 'content-type': 'application/json' },
        }),
      ),
    )

    await expect(
      callTool({
        baseUrl: 'https://api.example.com',
        apiKey: 'vk_bad',
        toolName: 'list_models',
      }),
    ).rejects.toMatchObject({ code: 'AUTH_ERROR', status: 401 })
  })

  it('maps timeout to transport timeout error', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn((_url: string, init?: RequestInit) => {
        return new Promise((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => {
            reject(new DOMException('The operation was aborted.', 'AbortError'))
          })
        })
      }),
    )

    await expect(
      callTool({
        baseUrl: 'https://api.example.com',
        apiKey: 'vk_test',
        toolName: 'list_models',
        timeoutMs: 10,
      }),
    ).rejects.toMatchObject({ code: 'TRANSPORT_TIMEOUT' })
  })

  it('maps mcp envelope failure to MCP_ERROR', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            jsonrpc: '2.0',
            id: '1',
            result: {
              structuredContent: {
                contractVersion: '1.0.0',
                success: false,
                result: null,
                error: {
                  code: 'GENERATION_FAILED',
                  message: 'Image generation failed.',
                  recoverable: true,
                },
              },
            },
          }),
          {
            status: 200,
            headers: { 'content-type': 'application/json' },
          },
        ),
      ),
    )

    await expect(
      callTool({
        baseUrl: 'https://api.example.com',
        apiKey: 'vk_test',
        toolName: 'generate_images',
      }),
    ).rejects.toMatchObject({ code: 'MCP_ERROR', recoverable: true })
  })
})
