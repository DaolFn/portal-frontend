import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import { Paperclip, X } from 'lucide-react'
import { createPost, fetchPost, updatePost } from '../features/board/api'
import { Button } from '../components/Button'

export function BoardPostFormPage() {
  const { boardId, postId } = useParams<{ boardId: string; postId?: string }>()
  const boardIdNum = Number(boardId)
  const postIdNum = postId ? Number(postId) : null
  const isEdit = postIdNum != null
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: existing } = useQuery({
    queryKey: ['boards', boardIdNum, 'posts', postIdNum],
    queryFn: () => fetchPost(boardIdNum, postIdNum!),
    enabled: isEdit,
  })

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [newFiles, setNewFiles] = useState<File[]>([])
  const [removeAttachmentIds, setRemoveAttachmentIds] = useState<number[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (existing) {
      setTitle(existing.title)
      setContent(existing.content)
    }
  }, [existing])

  function invalidatePostQueries() {
    queryClient.invalidateQueries({ queryKey: ['boards', boardIdNum, 'posts'] })
  }

  const createMutation = useMutation({
    mutationFn: () => createPost(boardIdNum, { title, content }, newFiles),
    onSuccess: (post) => {
      invalidatePostQueries()
      navigate(`/boards/${boardIdNum}/posts/${post.postId}`)
    },
    onError: () => setError('저장에 실패했습니다.'),
  })

  const updateMutation = useMutation({
    mutationFn: () => updatePost(boardIdNum, postIdNum!, { title, content }, removeAttachmentIds, newFiles),
    onSuccess: (post) => {
      invalidatePostQueries()
      navigate(`/boards/${boardIdNum}/posts/${post.postId}`)
    },
    onError: () => setError('저장에 실패했습니다.'),
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (isEdit) {
      updateMutation.mutate()
    } else {
      createMutation.mutate()
    }
  }

  function addFiles(fileList: FileList | null) {
    if (!fileList) return
    setNewFiles((prev) => [...prev, ...Array.from(fileList)])
  }

  function removeNewFile(index: number) {
    setNewFiles((prev) => prev.filter((_, i) => i !== index))
  }

  function toggleRemoveExisting(attachmentId: number) {
    setRemoveAttachmentIds((prev) =>
      prev.includes(attachmentId) ? prev.filter((id) => id !== attachmentId) : [...prev, attachmentId],
    )
  }

  const saving = createMutation.isPending || updateMutation.isPending

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-4 text-lg font-semibold text-ink">{isEdit ? '게시글 수정' : '게시글 작성'}</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-ink">제목</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full rounded-md border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-ink">내용</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
            rows={12}
            className="w-full rounded-md border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
          />
        </div>

        {isEdit && (existing?.attachments.length ?? 0) > 0 && (
          <div>
            <label className="mb-1 block text-sm font-medium text-ink">기존 첨부파일</label>
            <div className="flex flex-col gap-1.5">
              {existing!.attachments.map((a) => (
                <label
                  key={a.attachmentId}
                  className={`flex items-center gap-2 text-sm ${removeAttachmentIds.includes(a.attachmentId) ? 'text-danger line-through' : 'text-ink'}`}
                >
                  <input
                    type="checkbox"
                    checked={removeAttachmentIds.includes(a.attachmentId)}
                    onChange={() => toggleRemoveExisting(a.attachmentId)}
                  />
                  <Paperclip size={13} className="shrink-0" />
                  {a.originalFilename}
                </label>
              ))}
            </div>
            <p className="mt-1 text-xs text-ink-muted">체크하면 저장 시 삭제됩니다.</p>
          </div>
        )}

        <div>
          <label className="mb-1 block text-sm font-medium text-ink">파일 첨부</label>
          <input
            type="file"
            multiple
            onChange={(e) => {
              addFiles(e.target.files)
              e.target.value = ''
            }}
            className="block w-full text-sm text-ink-muted file:mr-3 file:rounded-md file:border file:border-line file:bg-surface file:px-3 file:py-1.5 file:text-sm file:text-ink"
          />
          {newFiles.length > 0 && (
            <div className="mt-2 flex flex-col gap-1.5">
              {newFiles.map((file, i) => (
                <div key={i} className="flex items-center justify-between rounded-md bg-canvas px-3 py-1.5 text-sm">
                  <span className="flex items-center gap-1.5 text-ink">
                    <Paperclip size={13} /> {file.name}
                  </span>
                  <button type="button" onClick={() => removeNewFile(i)} aria-label="제거" className="text-ink-muted hover:text-danger">
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {error && <p className="text-sm text-danger">{error}</p>}

        <div className="flex gap-2">
          <Button type="submit" disabled={saving}>
            {isEdit ? '수정 완료' : '등록'}
          </Button>
          <Button type="button" variant="secondary" onClick={() => navigate(-1)}>
            취소
          </Button>
        </div>
      </form>
    </div>
  )
}
