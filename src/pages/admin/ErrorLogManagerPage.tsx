import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchErrorLogDetail, fetchErrorLogs } from '../../features/errorLog/api'
import { Modal } from '../../components/Modal'

export function ErrorLogManagerPage() {
  const [page, setPage] = useState(0)
  const [detailId, setDetailId] = useState<number | null>(null)

  const { data: logPage } = useQuery({
    queryKey: ['admin', 'error-logs', page],
    queryFn: () => fetchErrorLogs(page),
  })
  const { data: detail } = useQuery({
    queryKey: ['admin', 'error-logs', detailId],
    queryFn: () => fetchErrorLogDetail(detailId!),
    enabled: detailId != null,
  })

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-ink">에러 내역</h1>
        <span className="text-sm text-ink-muted">
          {logPage ? `전체 ${logPage.totalElements}건` : ''}
        </span>
      </div>

      <div className="overflow-hidden rounded-md border border-line bg-surface shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-canvas text-left text-ink-muted">
            <tr>
              <th className="px-4 py-2 font-medium">발생시각</th>
              <th className="px-4 py-2 font-medium">메소드</th>
              <th className="px-4 py-2 font-medium">요청 경로</th>
              <th className="px-4 py-2 font-medium">사용자</th>
              <th className="px-4 py-2 font-medium">예외 타입</th>
              <th className="px-4 py-2 font-medium">메시지</th>
            </tr>
          </thead>
          <tbody>
            {(logPage?.content.length ?? 0) === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-ink-muted">
                  기록된 에러가 없습니다.
                </td>
              </tr>
            )}
            {logPage?.content.map((entry) => (
              <tr
                key={entry.errorLogId}
                onClick={() => setDetailId(entry.errorLogId)}
                className="cursor-pointer border-t border-line hover:bg-canvas"
              >
                <td className="whitespace-nowrap px-4 py-2 font-mono text-xs">
                  {formatDateTime(entry.occurredAt)}
                </td>
                <td className="px-4 py-2 text-ink-muted">{entry.httpMethod ?? '-'}</td>
                <td className="max-w-xs truncate px-4 py-2">{entry.requestUri ?? '-'}</td>
                <td className="px-4 py-2 text-ink-muted">{entry.loginId ?? '-'}</td>
                <td className="max-w-xs truncate px-4 py-2 text-ink-muted">
                  {shortExceptionType(entry.exceptionType)}
                </td>
                <td className="max-w-sm truncate px-4 py-2 text-ink-muted">{entry.errorMessage ?? '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {logPage && logPage.totalPages > 1 && (
        <div className="mt-3 flex gap-2 text-sm">
          {Array.from({ length: logPage.totalPages }).map((_, i) => (
            <button
              key={i}
              onClick={() => setPage(i)}
              className={`rounded px-2 py-1 ${i === page ? 'bg-accent text-accent-ink' : 'text-ink-muted hover:bg-surface'}`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}

      <Modal title="에러 상세" open={detailId != null} onClose={() => setDetailId(null)} wide>
        {detail && (
          <div className="flex flex-col gap-3">
            <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
              <dt className="text-ink-muted">발생시각</dt>
              <dd>{formatDateTime(detail.occurredAt)}</dd>
              <dt className="text-ink-muted">요청</dt>
              <dd>
                {detail.httpMethod} {detail.requestUri}
              </dd>
              <dt className="text-ink-muted">사용자</dt>
              <dd>{detail.loginId ?? '-'}</dd>
              <dt className="text-ink-muted">예외 타입</dt>
              <dd className="break-all">{detail.exceptionType}</dd>
              <dt className="text-ink-muted">메시지</dt>
              <dd className="break-all">{detail.errorMessage ?? '-'}</dd>
            </dl>
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-ink-muted">스택 트레이스</p>
              <pre className="max-h-[50vh] overflow-auto rounded-md bg-canvas p-3 text-xs leading-relaxed text-ink-muted">
                {detail.stackTrace}
              </pre>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

function formatDateTime(value: string): string {
  return value.replace('T', ' ').slice(0, 19)
}

function shortExceptionType(exceptionType: string | null): string {
  if (!exceptionType) return '-'
  const parts = exceptionType.split('.')
  return parts[parts.length - 1]
}
