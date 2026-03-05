export type CliErrorCode =
  | 'AUTH_ERROR'
  | 'TRANSPORT_ERROR'
  | 'TRANSPORT_TIMEOUT'
  | 'MCP_ERROR'
  | 'INVALID_RESPONSE'

export interface CliErrorOptions {
  status?: number
  recoverable?: boolean
  details?: unknown
  cause?: unknown
}

export class CliError extends Error {
  readonly code: CliErrorCode
  readonly status?: number
  readonly recoverable: boolean
  readonly details?: unknown

  constructor(code: CliErrorCode, message: string, options: CliErrorOptions = {}) {
    super(message)
    this.name = 'CliError'
    this.code = code
    this.status = options.status
    this.recoverable = options.recoverable ?? false
    this.details = options.details

    if (options.cause !== undefined) {
      ;(this as Error & { cause?: unknown }).cause = options.cause
    }
  }
}

export function isCliError(error: unknown): error is CliError {
  return error instanceof CliError
}
