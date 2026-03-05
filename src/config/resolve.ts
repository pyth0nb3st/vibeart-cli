import type { LocalConfig } from './store'

export type ConfigSource = 'flag' | 'env' | 'config' | 'none'

export interface ConfigValues {
  baseUrl?: string
  apiKey?: string
}

export interface ResolvedConfig extends ConfigValues {
  sources: {
    baseUrl: ConfigSource
    apiKey: ConfigSource
  }
}

export interface ResolveInput {
  flags?: ConfigValues
  env?: NodeJS.ProcessEnv
  file?: LocalConfig
}

function normalizeValue(value: string | undefined | null): string | undefined {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : undefined
}

function resolveValue(
  flagValue: string | undefined,
  envValue: string | undefined,
  fileValue: string | undefined,
): { value: string | undefined; source: ConfigSource } {
  if (flagValue) return { value: flagValue, source: 'flag' }
  if (envValue) return { value: envValue, source: 'env' }
  if (fileValue) return { value: fileValue, source: 'config' }
  return { value: undefined, source: 'none' }
}

export function resolveRuntimeConfig(input: ResolveInput): ResolvedConfig {
  const flags = input.flags ?? {}
  const env = input.env ?? process.env
  const file = input.file ?? {}

  const baseUrl = resolveValue(
    normalizeValue(flags.baseUrl),
    normalizeValue(env.VIBEART_BASE_URL),
    normalizeValue(file.baseUrl),
  )

  const apiKey = resolveValue(
    normalizeValue(flags.apiKey),
    normalizeValue(env.VIBEART_API_KEY),
    normalizeValue(file.apiKey),
  )

  return {
    baseUrl: baseUrl.value,
    apiKey: apiKey.value,
    sources: {
      baseUrl: baseUrl.source,
      apiKey: apiKey.source,
    },
  }
}

export function maskApiKey(apiKey: string | undefined): string | undefined {
  if (!apiKey) return undefined
  if (apiKey.length <= 8) return `${apiKey.slice(0, 2)}***`
  return `${apiKey.slice(0, 6)}...${apiKey.slice(-4)}`
}
