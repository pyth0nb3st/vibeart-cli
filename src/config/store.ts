import { chmod, mkdir, readFile, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

export interface LocalConfig {
  baseUrl?: string
  apiKey?: string
  updatedAt?: string
}

function normalizeValue(value: string | undefined | null): string | undefined {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : undefined
}

export interface PathOptions {
  env?: NodeJS.ProcessEnv
  homeDir?: string
}

export function getConfigPath(options: PathOptions = {}): string {
  const env = options.env ?? process.env
  const homeDir = options.homeDir ?? os.homedir()

  const directPath = normalizeValue(env.VIBEART_CONFIG_FILE)
  if (directPath) return path.resolve(directPath)

  const xdg = normalizeValue(env.XDG_CONFIG_HOME)
  const configRoot = xdg ?? path.join(homeDir, '.config')
  return path.join(configRoot, 'vibeart', 'config.json')
}

export interface StoreOptions extends PathOptions {
  configPath?: string
}

export async function readConfig(options: StoreOptions = {}): Promise<LocalConfig> {
  const configPath = options.configPath ?? getConfigPath(options)

  try {
    const text = await readFile(configPath, 'utf8')
    const parsed = JSON.parse(text) as LocalConfig

    return {
      baseUrl: normalizeValue(parsed.baseUrl),
      apiKey: normalizeValue(parsed.apiKey),
      updatedAt: normalizeValue(parsed.updatedAt),
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return {}
    }

    throw new Error(`Failed to read config from ${configPath}: ${(error as Error).message}`)
  }
}

export async function writeConfig(
  config: LocalConfig,
  options: StoreOptions = {},
): Promise<string> {
  const configPath = options.configPath ?? getConfigPath(options)
  const normalized: LocalConfig = {
    baseUrl: normalizeValue(config.baseUrl),
    apiKey: normalizeValue(config.apiKey),
    updatedAt: new Date().toISOString(),
  }

  await mkdir(path.dirname(configPath), { recursive: true })
  await writeFile(configPath, `${JSON.stringify(normalized, null, 2)}\n`, { mode: 0o600 })

  // Best effort hardening; some filesystems may ignore chmod semantics.
  try {
    await chmod(configPath, 0o600)
  } catch {
    // noop
  }

  return configPath
}
