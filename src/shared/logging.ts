export interface Logger {
  debug(message: string, context?: Record<string, unknown>): void
}

export function createLogger(verbose = false): Logger {
  return {
    debug(message, context) {
      if (!verbose) return
      if (!context) {
        console.error(`[vibeart-cli] ${message}`)
        return
      }

      console.error(`[vibeart-cli] ${message}`, context)
    },
  }
}
