import { Cli, z } from 'incur'
import { createInterface } from 'node:readline/promises'
import { stdin as input, stdout as output } from 'node:process'
import { getConfigPath, readConfig, writeConfig } from '../config/store'
import { maskApiKey, resolveRuntimeConfig } from '../config/resolve'

async function promptValue(label: string, fallback?: string): Promise<string | undefined> {
  const rl = createInterface({ input, output })
  try {
    const suffix = fallback ? ` [${fallback}]` : ''
    const value = await rl.question(`${label}${suffix}: `)
    const trimmed = value.trim()
    if (trimmed) return trimmed
    return fallback
  } finally {
    rl.close()
  }
}

export function createAuthCommandGroup() {
  return Cli.create('auth', {
    description: 'Manage API key authentication settings.',
  })
    .command('set-key', {
      description: 'Set or update API key in local config.',
      options: z.object({
        apiKey: z.string().optional().describe('API key value (vk_...)'),
      }),
      async run(c) {
        let apiKey = c.options.apiKey?.trim()

        if (!apiKey && !c.agent && process.stdin.isTTY) {
          apiKey = await promptValue('API key')
        }

        if (!apiKey) {
          return c.error({ code: 'MISSING_API_KEY', message: 'Provide --api-key or run interactively.' })
        }

        const current = await readConfig()
        const configPath = await writeConfig({ ...current, apiKey })

        return c.ok({
          configPath,
          apiKeyMasked: maskApiKey(apiKey),
        })
      },
    })
    .command('status', {
      description: 'Show current auth/base URL resolution and sources.',
      options: z.object({
        baseUrl: z.string().optional().describe('Override base URL for this command.'),
        apiKey: z.string().optional().describe('Override API key for this command.'),
      }),
      async run(c) {
        const file = await readConfig()
        const resolved = resolveRuntimeConfig({
          flags: {
            baseUrl: c.options.baseUrl,
            apiKey: c.options.apiKey,
          },
          env: process.env,
          file,
        })

        return c.ok({
          configPath: getConfigPath(),
          baseUrl: resolved.baseUrl ?? null,
          baseUrlSource: resolved.sources.baseUrl,
          apiKeySet: Boolean(resolved.apiKey),
          apiKeySource: resolved.sources.apiKey,
          apiKeyMasked: maskApiKey(resolved.apiKey) ?? null,
        })
      },
    })
}

export function getInitCommand() {
  return {
    description: 'Initialize local CLI config (base URL and API key).',
    options: z.object({
      baseUrl: z.string().optional().describe('Vibeart API base URL (e.g. https://vibeart.app).'),
      apiKey: z.string().optional().describe('API key value (vk_...).'),
      nonInteractive: z.boolean().optional().describe('Disable interactive prompts.'),
    }),
    async run(c: {
      options: {
        baseUrl?: string
        apiKey?: string
        nonInteractive?: boolean
      }
      agent: boolean
      ok: (data: unknown) => unknown
      error: (error: { code: string; message: string }) => unknown
    }) {
      const existing = await readConfig()
      let baseUrl = c.options.baseUrl?.trim() || existing.baseUrl
      let apiKey = c.options.apiKey?.trim() || existing.apiKey

      const interactive = !c.options.nonInteractive && !c.agent && process.stdin.isTTY
      if (interactive) {
        if (!baseUrl) baseUrl = await promptValue('Base URL', existing.baseUrl)
        if (!apiKey) apiKey = await promptValue('API key')
      }

      if (!baseUrl) {
        return c.error({
          code: 'MISSING_BASE_URL',
          message: 'Base URL is required. Pass --base-url or set VIBEART_BASE_URL.',
        })
      }

      const configPath = await writeConfig({ baseUrl, apiKey })

      return c.ok({
        configPath,
        baseUrl,
        apiKeySet: Boolean(apiKey),
        apiKeyMasked: maskApiKey(apiKey),
      })
    },
  }
}
