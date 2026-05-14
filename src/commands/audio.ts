import { Cli, z } from 'incur'
import { connectionOptionsSchema, executeTool, toToolError } from './common'

interface DialogueInput {
  text: string
  voiceId: string
}

function parseDialogueInputs(value: string): DialogueInput[] {
  let parsed: unknown
  try {
    parsed = JSON.parse(value)
  } catch {
    throw new Error('Invalid --inputs JSON. Expected an array like [{"text":"Hello","voiceId":"Vivian"}].')
  }

  if (!Array.isArray(parsed)) {
    throw new Error('Invalid --inputs JSON. Expected an array of dialogue line objects.')
  }

  return parsed.map((item, index) => {
    if (!item || typeof item !== 'object') {
      throw new Error(`Invalid dialogue line at index ${index}. Expected an object.`)
    }

    const record = item as Record<string, unknown>
    if (typeof record.text !== 'string' || !record.text.trim()) {
      throw new Error(`Invalid dialogue line at index ${index}. Missing non-empty text.`)
    }
    if (typeof record.voiceId !== 'string' || !record.voiceId.trim()) {
      throw new Error(`Invalid dialogue line at index ${index}. Missing non-empty voiceId.`)
    }

    return {
      text: record.text,
      voiceId: record.voiceId,
    }
  })
}

export function createAudioCommandGroup() {
  return Cli.create('audio', {
    description: 'Text-to-speech and dialogue audio commands.',
  })
    .command('list-voices', {
      description: 'List available text-to-speech voices.',
      options: connectionOptionsSchema.extend({
        provider: z.string().optional().describe('Voice provider filter: qwen, elevenlabs, or all.'),
      }),
      async run(c) {
        try {
          const result = await executeTool({
            toolName: 'list_tts_voices',
            options: c.options,
            args: {
              ...(c.options.provider ? { provider: c.options.provider } : {}),
            },
          })

          return c.ok(result)
        } catch (error) {
          return c.error(toToolError(error))
        }
      },
    })
    .command('speech', {
      description: 'Generate text-to-speech audio on a canvas session.',
      options: connectionOptionsSchema.extend({
        sessionId: z.string().describe('Target session ID.'),
        text: z.string().describe('Text to convert to speech.'),
        voiceId: z.string().optional().describe('Voice ID from audio list-voices.'),
        model: z.string().optional().describe('TTS model ID.'),
        stability: z.coerce.number().optional().describe('ElevenLabs stability from 0 to 1.'),
        speed: z.coerce.number().optional().describe('ElevenLabs speech speed from 0.7 to 1.2.'),
        label: z.string().optional().describe('Optional label for the audio item.'),
        withTimestamps: z.boolean().optional().describe('Return word-level timing data when supported.'),
      }),
      async run(c) {
        try {
          const result = await executeTool({
            toolName: 'generate_speech',
            options: c.options,
            args: {
              sessionId: c.options.sessionId,
              text: c.options.text,
              ...(c.options.voiceId ? { voiceId: c.options.voiceId } : {}),
              ...(c.options.model ? { model: c.options.model } : {}),
              ...(typeof c.options.stability === 'number' ? { stability: c.options.stability } : {}),
              ...(typeof c.options.speed === 'number' ? { speed: c.options.speed } : {}),
              ...(c.options.label ? { label: c.options.label } : {}),
              ...(typeof c.options.withTimestamps === 'boolean' ? { withTimestamps: c.options.withTimestamps } : {}),
            },
          })

          return c.ok(result)
        } catch (error) {
          return c.error(toToolError(error))
        }
      },
    })
    .command('dialogue', {
      description: 'Generate multi-speaker dialogue audio on a canvas session.',
      options: connectionOptionsSchema.extend({
        sessionId: z.string().describe('Target session ID.'),
        inputs: z.string().describe('JSON array of {"text","voiceId"} dialogue lines.'),
        model: z.string().optional().describe('Optional ElevenLabs dialogue model.'),
        label: z.string().optional().describe('Optional label for the audio item.'),
      }),
      async run(c) {
        let inputs: DialogueInput[]
        try {
          inputs = parseDialogueInputs(c.options.inputs)
        } catch (error) {
          return c.error({
            code: 'VALIDATION_ERROR',
            message: error instanceof Error ? error.message : 'Invalid dialogue inputs.',
          })
        }

        if (inputs.length === 0) {
          return c.error({ code: 'VALIDATION_ERROR', message: 'Provide at least one dialogue input.' })
        }

        try {
          const result = await executeTool({
            toolName: 'generate_dialogue',
            options: c.options,
            args: {
              sessionId: c.options.sessionId,
              inputs,
              ...(c.options.model ? { model: c.options.model } : {}),
              ...(c.options.label ? { label: c.options.label } : {}),
            },
          })

          return c.ok(result)
        } catch (error) {
          return c.error(toToolError(error))
        }
      },
    })
}
