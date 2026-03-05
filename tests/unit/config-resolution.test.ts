import { describe, expect, it } from 'vitest'
import { resolveRuntimeConfig } from '../../src/config/resolve'

describe('resolveRuntimeConfig', () => {
  it('prefers flags over env and config', () => {
    const resolved = resolveRuntimeConfig({
      flags: { baseUrl: 'https://flag.example', apiKey: 'vk_flag' },
      env: {
        VIBEART_BASE_URL: 'https://env.example',
        VIBEART_API_KEY: 'vk_env',
      },
      file: { baseUrl: 'https://file.example', apiKey: 'vk_file' },
    })

    expect(resolved.baseUrl).toBe('https://flag.example')
    expect(resolved.apiKey).toBe('vk_flag')
    expect(resolved.sources.baseUrl).toBe('flag')
    expect(resolved.sources.apiKey).toBe('flag')
  })

  it('prefers env over config when flags are missing', () => {
    const resolved = resolveRuntimeConfig({
      env: {
        VIBEART_BASE_URL: 'https://env.example',
        VIBEART_API_KEY: 'vk_env',
      },
      file: { baseUrl: 'https://file.example', apiKey: 'vk_file' },
    })

    expect(resolved.baseUrl).toBe('https://env.example')
    expect(resolved.apiKey).toBe('vk_env')
    expect(resolved.sources.baseUrl).toBe('env')
    expect(resolved.sources.apiKey).toBe('env')
  })

  it('falls back to config values', () => {
    const resolved = resolveRuntimeConfig({
      file: { baseUrl: 'https://file.example', apiKey: 'vk_file' },
    })

    expect(resolved.baseUrl).toBe('https://file.example')
    expect(resolved.apiKey).toBe('vk_file')
    expect(resolved.sources.baseUrl).toBe('config')
    expect(resolved.sources.apiKey).toBe('config')
  })

  it('treats blank values as missing', () => {
    const resolved = resolveRuntimeConfig({
      flags: { baseUrl: '   ', apiKey: '' },
      env: {
        VIBEART_BASE_URL: 'https://env.example',
        VIBEART_API_KEY: 'vk_env',
      },
    })

    expect(resolved.baseUrl).toBe('https://env.example')
    expect(resolved.apiKey).toBe('vk_env')
    expect(resolved.sources.baseUrl).toBe('env')
    expect(resolved.sources.apiKey).toBe('env')
  })
})
