export interface ErrorLogSummary {
  errorLogId: number
  occurredAt: string
  httpMethod: string | null
  requestUri: string | null
  loginId: string | null
  exceptionType: string | null
  errorMessage: string | null
}

export interface ErrorLogDetail extends ErrorLogSummary {
  stackTrace: string | null
}

export interface Page<T> {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
  size: number
}
