import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import { Plus, MessageSquare } from 'lucide-react'
import { fetchBoard, fetchPosts } from '../features/board/api'
import { Button } from '../components/Button'

export function BoardPage() {
  const { boardId } = useParams<{ boardId: string }>()
  const boardIdNum = Number(boardId)
  const navigate = useNavigate()
  const [page, setPage] = useState(0)

  const { data: board } = useQuery({ queryKey: ['boards', boardIdNum], queryFn: () => fetchBoard(boardIdNum) })
  const { data: postPage } = useQuery({
    queryKey: ['boards', boardIdNum, 'posts', page],
    queryFn: () => fetchPosts(boardIdNum, page),
  })

  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-ink">{board?.boardName}</h1>
        {board?.canWrite && (
          <Button onClick={() => navigate(`/boards/${boardIdNum}/posts/new`)}>
            <Plus size={15} /> 글쓰기
          </Button>
        )}
      </div>
      {board?.description && <p className="mb-4 text-sm text-ink-muted">{board.description}</p>}

      <div className="overflow-hidden rounded-md border border-line bg-surface shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-canvas text-left text-ink-muted">
            <tr>
              <th className="px-4 py-2 font-medium">제목</th>
              <th className="px-4 py-2 font-medium">작성자</th>
              <th className="px-4 py-2 font-medium">조회수</th>
              <th className="px-4 py-2 font-medium">작성일</th>
            </tr>
          </thead>
          <tbody>
            {(postPage?.content.length ?? 0) === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-ink-muted">
                  등록된 게시글이 없습니다.
                </td>
              </tr>
            )}
            {postPage?.content.map((post) => (
              <tr
                key={post.postId}
                onClick={() => navigate(`/boards/${boardIdNum}/posts/${post.postId}`)}
                className="cursor-pointer border-t border-line hover:bg-canvas"
              >
                <td className="px-4 py-2">
                  <span className="align-middle">{post.title}</span>
                  {post.commentCount > 0 && (
                    <span className="ml-1.5 inline-flex items-center gap-0.5 align-middle text-xs text-accent">
                      <MessageSquare size={12} /> {post.commentCount}
                    </span>
                  )}
                </td>
                <td className="px-4 py-2 text-ink-muted">{post.authorName}</td>
                <td className="px-4 py-2 text-ink-muted">{post.viewCount}</td>
                <td className="whitespace-nowrap px-4 py-2 text-ink-muted">{formatDate(post.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {postPage && postPage.totalPages > 1 && (
        <div className="mt-3 flex gap-2 text-sm">
          {Array.from({ length: postPage.totalPages }).map((_, i) => (
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
    </div>
  )
}

function formatDate(value: string): string {
  return value.slice(0, 10)
}
