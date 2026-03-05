import { Cli, z } from 'incur'
import { connectionOptionsSchema, executeTool, toToolError } from './common'

function splitUrls(value: string): string[] {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

export function createImagesCommandGroup() {
  return Cli.create('images', {
    description: 'Image generation and editing commands.',
  })
    .command('generate', {
      description: 'Generate images on a session.',
      options: connectionOptionsSchema.extend({
        sessionId: z.string().describe('Target session ID.'),
        prompt: z.string().describe('Prompt text.'),
        model: z.string().optional().describe('Model ID.'),
        aspectRatio: z.string().optional().describe('Aspect ratio (e.g. 1:1).'),
        quantity: z.coerce.number().optional().describe('Number of images to generate.'),
        resolution: z.string().optional().describe('Gemini resolution tier (e.g. 1K).'),
        quality: z.string().optional().describe('GPT quality (low/medium/high).'),
        background: z.string().optional().describe('GPT background mode.'),
      }),
      async run(c) {
        try {
          const result = await executeTool({
            toolName: 'generate_images',
            options: c.options,
            args: {
              sessionId: c.options.sessionId,
              prompt: c.options.prompt,
              ...(c.options.model ? { model: c.options.model } : {}),
              ...(c.options.aspectRatio ? { aspectRatio: c.options.aspectRatio } : {}),
              ...(typeof c.options.quantity === 'number' ? { quantity: c.options.quantity } : {}),
              ...(c.options.resolution ? { resolution: c.options.resolution } : {}),
              ...(c.options.quality ? { quality: c.options.quality } : {}),
              ...(c.options.background ? { background: c.options.background } : {}),
            },
          })

          return c.ok(result)
        } catch (error) {
          return c.error(toToolError(error))
        }
      },
    })
    .command('edit', {
      description: 'Edit images with references and a prompt.',
      options: connectionOptionsSchema.extend({
        sessionId: z.string().describe('Target session ID.'),
        prompt: z.string().describe('Edit prompt.'),
        imageUrls: z.string().describe('Comma-separated image URLs.'),
        model: z.string().optional().describe('Edit model.'),
        aspectRatio: z.string().optional().describe('Aspect ratio.'),
        strength: z.coerce.number().optional().describe('Edit strength from 0 to 1.'),
      }),
      async run(c) {
        try {
          const result = await executeTool({
            toolName: 'edit_images',
            options: c.options,
            args: {
              sessionId: c.options.sessionId,
              prompt: c.options.prompt,
              imageUrls: splitUrls(c.options.imageUrls),
              ...(c.options.model ? { model: c.options.model } : {}),
              ...(c.options.aspectRatio ? { aspectRatio: c.options.aspectRatio } : {}),
              ...(typeof c.options.strength === 'number' ? { strength: c.options.strength } : {}),
            },
          })

          return c.ok(result)
        } catch (error) {
          return c.error(toToolError(error))
        }
      },
    })
}
