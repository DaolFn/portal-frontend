import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import { Paperclip, Pencil, Trash2 } from 'lucide-react'
import { addComment, deleteComment, deletePost, downloadAttachment, fetchPost } from '../features/board/api'
import type { PostDetail } from '../types/board'
import { Button } from '../components/Button'
import { ConfirmDialog } from '../components/ConfirmDialog'

export function BoardPostDetailPage() {
  const { boardId, postId } = useParams<{ boardId: string; postId: string }>()
  const boardIdNum = Number(boardId)
  const postIdNum = Number(postId)
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const postQueryKey = ['boards', boardIdNum, 'posts', postIdNum]
  const { data: post } = useQuery({
    queryKey: postQueryKey,
    queryFn: () => fetchPost(boardIdNum, postIdNum),
  })

  const [commentText, setCommentText] = useState('')
  const [deletePostConfirmOpen, setDeletePostConfirmOpen] = useState(false)
  const [deleteCommentTarget, setDeleteCommentTarget] = useState<number | null>(null)

  // Comment add/delete patch the cached post in place rather than invalidating it — refetching
  // would call GET /posts/{id} again, and that endpoint increments 조회수 on every call, so a
  // naive invalidate makes leaving a comment on your own post look like an extra "view".
  function patchComments(updater: (comments: PostDetail['comments']) => PostDetail['comments']) {
    queryClient.setQueryData<PostDetail>(postQueryKey, (current) =>
      current ? { ...current, comments: updater(current.comments) } : current,
    )
  }

  const deletePostMutation = useMutation({
    mutationFn: () => deletePost(boardIdNum, postIdNum),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boards', boardIdNum, 'posts'] })
      navigate(`/boards/${boardIdNum}`)
    },
  })

  const addCommentMutation = useMutation({
    mutationFn: () => addComment(boardIdNum, postIdNum, commentText),
    onSuccess: (comment) => {
      setCommentText('')
      patchComments((comments) => [...comments, comment])
    },
  })

  const deleteCommentMutation = useMutation({
    mutationFn: (commentId: number) => deleteComment(boardIdNum, postIdNum, commentId),
    onSuccess: (_void, commentId) => {
      patchComments((comments) => comments.filter((c) => c.commentId !== commentId))
      setDeleteCommentTarget(null)
    },
  })

  function submitComment(e: React.FormEvent) {
    e.preventDefault()
    if (commentText.trim().length === 0) return
    addCommentMutation.mutate()
  }

  if (!post) {
    return null
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-4 flex items-start justify-between border-b border-line pb-4">
        <div>
          <h1 className="text-lg font-semibold text-ink">{post.title}</h1>
          <p className="mt-1 text-sm text-ink-muted">
            {post.authorName} · {formatDateTime(post.createdAt)} · 조회 {post.viewCount}
          </p>
        </div>
        {(post.canEdit || post.canDelete) && (
          <div className="flex shrink-0 gap-2">
            {post.canEdit && (
              <button
                type="button"
                onClick={() => navigate(`/boards/${boardIdNum}/posts/${postIdNum}/edit`)}
                className="text-ink-muted hover:text-ink"
                aria-label="수정"
              >
                <Pencil size={16} />
              </button>
            )}
            {post.canDelete && (
              <button
                type="button"
                onClick={() => setDeletePostConfirmOpen(true)}
                className="text-ink-muted hover:text-danger"
                aria-label="삭제"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        )}
      </div>

      <p className="whitespace-pre-wrap text-sm text-ink">{post.content}</p>

      {post.attachments.length > 0 && (
        <div className="mt-6 flex flex-col gap-1.5 border-t border-line pt-4">
          {post.attachments.map((a) => (
            <button
              key={a.attachmentId}
              type="button"
              onClick={() => downloadAttachment(boardIdNum, postIdNum, a.attachmentId, a.originalFilename)}
              className="flex w-fit items-center gap-1.5 text-sm text-accent hover:underline"
            >
              <Paperclip size={13} />
              {a.originalFilename}
              <span className="text-ink-muted">({formatFileSize(a.fileSize)})</span>
            </button>
          ))}
        </div>
      )}

      <section className="mt-8 border-t border-line pt-4">
        <h2 className="mb-3 text-sm font-semibold text-ink">댓글 {post.comments.length}</h2>
        <div className="flex flex-col gap-3">
          {post.comments.map((c) => (
            <div key={c.commentId} className="flex items-start justify-between gap-2 rounded-md bg-canvas p-3">
              <div>
                <p className="text-sm text-ink">{c.content}</p>
                <p className="mt-1 text-xs text-ink-muted">
                  {c.authorName} · {formatDateTime(c.createdAt)}
                </p>
              </div>
              {c.canDelete && (
                <button
                  type="button"
                  onClick={() => setDeleteCommentTarget(c.commentId)}
                  aria-label="댓글 삭제"
                  className="shrink-0 text-ink-muted hover:text-danger"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          ))}
          {post.comments.length === 0 && <p className="text-sm text-ink-muted">첫 댓글을 남겨보세요.</p>}
        </div>

        <form onSubmit={submitComment} className="mt-4 flex gap-2">
          <input
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="댓글을 입력하세요"
            className="flex-1 rounded-md border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
          />
          <Button type="submit" disabled={addCommentMutation.isPending}>
            등록
          </Button>
        </form>
      </section>

      <ConfirmDialog
        open={deletePostConfirmOpen}
        title="게시글 삭제"
        message="이 게시글과 첨부파일, 댓글이 모두 삭제됩니다. 삭제할까요?"
        confirmLabel="삭제"
        danger
        onCancel={() => setDeletePostConfirmOpen(false)}
        onConfirm={() => deletePostMutation.mutate()}
      />
      <ConfirmDialog
        open={deleteCommentTarget != null}
        title="댓글 삭제"
        message="댓글을 삭제할까요?"
        confirmLabel="삭제"
        danger
        onCancel={() => setDeleteCommentTarget(null)}
        onConfirm={() => deleteCommentTarget != null && deleteCommentMutation.mutate(deleteCommentTarget)}
      />
    </div>
  )
}

function formatDateTime(value: string): string {
  return value.replace('T', ' ').slice(0, 16)
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
}
