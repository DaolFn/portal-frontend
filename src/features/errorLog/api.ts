import { httpClient } from '../../lib/httpClient'
import type { ErrorLogDetail, ErrorLogSummary, Page } from '../../types/errorLog'

export async function fetchErrorLogs(page: number, size = 20): Promise<Page<ErrorLogSummary>> {
  const { data } = await httpClient.get<Page<ErrorLogSummary>>('/api/admin/error-logs', {
    params: { page, size },
  })
  return data
}

export async function fetchErrorLogDetail(errorLogId: number): Promise<ErrorLogDetail> {
  const { data } = await httpClient.get<ErrorLogDetail>(`/api/admin/error-logs/${errorLogId}`)
  return data
}
