import http from 'node:http'
import { afterEach, describe, expect, it } from 'vitest'
import { execa } from 'execa'

type CallRecord = { name: string; args: Record<string, unknown> }

type ToolMap = Record<string, unknown>

async function startMockMcpServer(toolMap: ToolMap): Promise<{
  baseUrl: string
  calls: CallRecord[]
  close: () => Promise<void>
}> {
  const calls: CallRecord[] = []

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
        params?: { name?: string; arguments?: Record<string, unknown> }
      }

      const toolName = body.params?.name ?? ''
      const toolArgs = body.params?.arguments ?? {}
      calls.push({ name: toolName, args: toolArgs })

      res.writeHead(200, { 'content-type': 'application/json' })
      res.end(
        JSON.stringify({
          jsonrpc: '2.0',
          id: body.id,
          result: {
            structuredContent: {
              contractVersion: '1.0.0',
              success: true,
              result: toolMap[toolName],
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

describe('write commands', () => {
  it('sessions create maps to create_session', async () => {
    const server = await startMockMcpServer({
      create_session: { id: 's2', name: 'New Session' },
    })
    runningServers.push(server)

    const { stdout } = await execa('tsx', [
      'src/cli.ts',
      'sessions',
      'create',
      'New Session',
      '--project-id',
      'p1',
      '--base-url',
      server.baseUrl,
      '--api-key',
      'vk_test',
      '--format',
      'json',
    ])

    expect(JSON.parse(stdout)).toEqual({ id: 's2', name: 'New Session' })
    expect(server.calls[0]).toEqual({
      name: 'create_session',
      args: { name: 'New Session', projectId: 'p1' },
    })
  })

  it('projects create maps to create_project', async () => {
    const server = await startMockMcpServer({
      create_project: { id: 'p2', name: 'Brand' },
    })
    runningServers.push(server)

    const { stdout } = await execa('tsx', [
      'src/cli.ts',
      'projects',
      'create',
      '--name',
      'Brand',
      '--description',
      'Design assets',
      '--base-url',
      server.baseUrl,
      '--api-key',
      'vk_test',
      '--format',
      'json',
    ])

    expect(JSON.parse(stdout)).toEqual({ id: 'p2', name: 'Brand' })
    expect(server.calls[0]).toEqual({
      name: 'create_project',
      args: { name: 'Brand', description: 'Design assets' },
    })
  })

  it('projects move-session maps to move_session_to_project', async () => {
    const server = await startMockMcpServer({
      move_session_to_project: { moved: true },
    })
    runningServers.push(server)

    const { stdout } = await execa('tsx', [
      'src/cli.ts',
      'projects',
      'move-session',
      '--session-id',
      's1',
      '--project-id',
      'p1',
      '--base-url',
      server.baseUrl,
      '--api-key',
      'vk_test',
      '--format',
      'json',
    ])

    expect(JSON.parse(stdout)).toEqual({ moved: true })
    expect(server.calls[0]).toEqual({
      name: 'move_session_to_project',
      args: { sessionId: 's1', projectId: 'p1' },
    })
  })

  it('images generate maps to generate_images', async () => {
    const server = await startMockMcpServer({
      generate_images: { items: [{ id: 'i1' }] },
    })
    runningServers.push(server)

    const { stdout } = await execa('tsx', [
      'src/cli.ts',
      'images',
      'generate',
      '--session-id',
      's1',
      '--prompt',
      'A cat astronaut',
      '--model',
      'flux-schnell',
      '--quantity',
      '2',
      '--base-url',
      server.baseUrl,
      '--api-key',
      'vk_test',
      '--format',
      'json',
    ])

    expect(JSON.parse(stdout)).toEqual({ items: [{ id: 'i1' }] })
    expect(server.calls[0]).toEqual({
      name: 'generate_images',
      args: {
        sessionId: 's1',
        prompt: 'A cat astronaut',
        model: 'flux-schnell',
        quantity: 2,
      },
    })
  })

  it('images edit maps to edit_images', async () => {
    const server = await startMockMcpServer({
      edit_images: { items: [{ id: 'i2' }] },
    })
    runningServers.push(server)

    const { stdout } = await execa('tsx', [
      'src/cli.ts',
      'images',
      'edit',
      '--session-id',
      's1',
      '--prompt',
      'Make it watercolor',
      '--image-urls',
      'https://img-1,https://img-2',
      '--base-url',
      server.baseUrl,
      '--api-key',
      'vk_test',
      '--format',
      'json',
    ])

    expect(JSON.parse(stdout)).toEqual({ items: [{ id: 'i2' }] })
    expect(server.calls[0]).toEqual({
      name: 'edit_images',
      args: {
        sessionId: 's1',
        prompt: 'Make it watercolor',
        imageUrls: ['https://img-1', 'https://img-2'],
      },
    })
  })

  it('video generate maps to generate_video', async () => {
    const server = await startMockMcpServer({
      generate_video: { items: [{ id: 'v1' }] },
    })
    runningServers.push(server)

    const { stdout } = await execa('tsx', [
      'src/cli.ts',
      'video',
      'generate',
      '--session-id',
      's1',
      '--prompt',
      'A drone flythrough',
      '--duration',
      '5',
      '--base-url',
      server.baseUrl,
      '--api-key',
      'vk_test',
      '--format',
      'json',
    ])

    expect(JSON.parse(stdout)).toEqual({ items: [{ id: 'v1' }] })
    expect(server.calls[0]).toEqual({
      name: 'generate_video',
      args: {
        sessionId: 's1',
        prompt: 'A drone flythrough',
        duration: 5,
      },
    })
  })
})
