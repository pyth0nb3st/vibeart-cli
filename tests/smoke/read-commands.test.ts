import http from 'node:http'
import { afterEach, describe, expect, it } from 'vitest'
import { execa } from 'execa'

type ToolMap = Record<string, unknown>

async function startMockMcpServer(toolMap: ToolMap): Promise<{
  baseUrl: string
  calls: string[]
  close: () => Promise<void>
}> {
  const calls: string[] = []

  const server = http.createServer((req, res) => {
    if (req.url !== '/api/mcp' || req.method !== 'POST') {
      res.writeHead(404).end()
      return
    }

    let raw = ''
    req.on('data', (chunk) => {
      raw += chunk
    })

    req.on('end', () => {
      const body = JSON.parse(raw) as {
        id: string
        method: string
        params?: { name?: string }
      }

      const toolName = body.params?.name ?? ''
      calls.push(toolName)
      const result = toolMap[toolName]

      res.writeHead(200, { 'content-type': 'application/json' })
      res.end(
        JSON.stringify({
          jsonrpc: '2.0',
          id: body.id,
          result: {
            structuredContent: {
              contractVersion: '1.0.0',
              success: true,
              result,
              error: null,
            },
          },
        }),
      )
    })
  })

  await new Promise<void>((resolve) => {
    server.listen(0, '127.0.0.1', () => resolve())
  })

  const address = server.address()
  if (!address || typeof address === 'string') {
    throw new Error('Failed to determine test server address')
  }

  return {
    baseUrl: `http://127.0.0.1:${address.port}`,
    calls,
    close: () =>
      new Promise<void>((resolve, reject) => {
        server.close((error) => {
          if (error) reject(error)
          else resolve()
        })
      }),
  }
}

const runningServers: Array<{ close: () => Promise<void> }> = []

afterEach(async () => {
  await Promise.all(runningServers.splice(0).map((s) => s.close()))
})

describe('read commands', () => {
  it('models list maps to list_models', async () => {
    const server = await startMockMcpServer({
      list_models: [{ id: 'flux-schnell' }],
    })
    runningServers.push(server)

    const { stdout } = await execa('tsx', [
      'src/cli.ts',
      'models',
      'list',
      '--base-url',
      server.baseUrl,
      '--api-key',
      'vk_test',
      '--format',
      'json',
    ])

    expect(JSON.parse(stdout)).toEqual([{ id: 'flux-schnell' }])
    expect(server.calls).toContain('list_models')
  })

  it('sessions list maps to list_sessions', async () => {
    const server = await startMockMcpServer({
      list_sessions: [{ id: 's1' }],
    })
    runningServers.push(server)

    const { stdout } = await execa('tsx', [
      'src/cli.ts',
      'sessions',
      'list',
      '--base-url',
      server.baseUrl,
      '--api-key',
      'vk_test',
      '--format',
      'json',
    ])

    expect(JSON.parse(stdout)).toEqual([{ id: 's1' }])
    expect(server.calls).toContain('list_sessions')
  })

  it('sessions get maps to get_session', async () => {
    const server = await startMockMcpServer({
      get_session: { id: 's1', name: 'Demo Session' },
    })
    runningServers.push(server)

    const { stdout } = await execa('tsx', [
      'src/cli.ts',
      'sessions',
      'get',
      's1',
      '--base-url',
      server.baseUrl,
      '--api-key',
      'vk_test',
      '--format',
      'json',
    ])

    expect(JSON.parse(stdout)).toEqual({ id: 's1', name: 'Demo Session' })
    expect(server.calls).toContain('get_session')
  })

  it('projects list maps to list_projects', async () => {
    const server = await startMockMcpServer({
      list_projects: [{ id: 'p1' }],
    })
    runningServers.push(server)

    const { stdout } = await execa('tsx', [
      'src/cli.ts',
      'projects',
      'list',
      '--base-url',
      server.baseUrl,
      '--api-key',
      'vk_test',
      '--format',
      'json',
    ])

    expect(JSON.parse(stdout)).toEqual([{ id: 'p1' }])
    expect(server.calls).toContain('list_projects')
  })

  it('projects get maps to get_project', async () => {
    const server = await startMockMcpServer({
      get_project: { id: 'p1', name: 'Marketing' },
    })
    runningServers.push(server)

    const { stdout } = await execa('tsx', [
      'src/cli.ts',
      'projects',
      'get',
      'p1',
      '--base-url',
      server.baseUrl,
      '--api-key',
      'vk_test',
      '--format',
      'json',
    ])

    expect(JSON.parse(stdout)).toEqual({ id: 'p1', name: 'Marketing' })
    expect(server.calls).toContain('get_project')
  })
})
