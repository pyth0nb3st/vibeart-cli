import { Cli, z } from 'incur'
import { connectionOptionsSchema, executeTool, toToolError } from './common'

export function createVideoCommandGroup() {
  return Cli.create('video', {
    description: 'Video generation commands.',
  }).command('generate', {
    description: 'Generate video in a canvas session.',
    options: connectionOptionsSchema.extend({
      sessionId: z.string().describe('Target session ID.'),
      prompt: z.string().describe('Video generation prompt.'),
      model: z.string().optional().describe('Video model ID.'),
      duration: z.coerce.number().optional().describe('Duration in seconds.'),
      mode: z.string().optional().describe('Generation mode.'),
      resolution: z.string().optional().describe('Output resolution.'),
      aspectRatio: z.string().optional().describe('Aspect ratio.'),
      sourceImageUrl: z.string().optional().describe('Optional source image URL.'),
    }),
    async run(c) {
      try {
        const result = await executeTool({
          toolName: 'generate_video',
          options: c.options,
          args: {
            sessionId: c.options.sessionId,
            prompt: c.options.prompt,
            ...(c.options.model ? { model: c.options.model } : {}),
            ...(typeof c.options.duration === 'number' ? { duration: c.options.duration } : {}),
            ...(c.options.mode ? { mode: c.options.mode } : {}),
            ...(c.options.resolution ? { resolution: c.options.resolution } : {}),
            ...(c.options.aspectRatio ? { aspectRatio: c.options.aspectRatio } : {}),
            ...(c.options.sourceImageUrl ? { sourceImageUrl: c.options.sourceImageUrl } : {}),
          },
        })

        return c.ok(result)
      } catch (error) {
        return c.error(toToolError(error))
      }
    },
  })
}
