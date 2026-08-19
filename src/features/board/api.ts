import { httpClient } from '../../lib/httpClient'
import type { Board, Comment, Page, PostDetail, PostSummary } from '../../types/board'

export async function fetchBoard(boardId: number): Promise<Board> {
  const { data } = await httpClient.get<Board>(`/api/boards/${boardId}`)
  return data
}

export async function fetchPosts(boardId: number, page: number, size = 20): Promise<Page<PostSummary>> {
  const { data } = await httpClient.get<Page<PostSummary>>(`/api/boards/${boardId}/posts`, {
    params: { page, size },
  })
  return data
}

export async function fetchPost(boardId: number, postId: number): Promise<PostDetail> {
  const { data } = await httpClient.get<PostDetail>(`/api/boards/${boardId}/posts/${postId}`)
  return data
}

export interface PostInput {
  title: string
  content: string
}

function postFormData(input: PostInput | (PostInput & { removeAttachmentIds: number[] }), files: File[]): FormData {
  const formData = new FormData()
  formData.append('data', new Blob([JSON.stringify(input)], { type: 'application/json' }))
  files.forEach((file) => formData.append('files', file))
  return formData
}

export async function createPost(boardId: number, input: PostInput, files: File[]): Promise<PostDetail> {
  const { data } = await httpClient.post<PostDetail>(
    `/api/boards/${boardId}/posts`,
    postFormData(input, files),
  )
  return data
}

export async function updatePost(
  boardId: number,
  postId: number,
  input: PostInput,
  removeAttachmentIds: number[],
  files: File[],
): Promise<PostDetail> {
  const { data } = await httpClient.put<PostDetail>(
    `/api/boards/${boardId}/posts/${postId}`,
    postFormData({ ...input, removeAttachmentIds }, files),
  )
  return data
}

export async function deletePost(boardId: number, postId: number): Promise<void> {
  await httpClient.delete(`/api/boards/${boardId}/posts/${postId}`)
}

/** Downloads go through axios (not a plain <a href>) so the Authorization header is attached —
 * the response is turned into a blob URL and clicked via a throwaway anchor element. */
export async function downloadAttachment(
  boardId: number,
  postId: number,
  attachmentId: number,
  filename: string,
): Promise<void> {
  const response = await httpClient.get(
    `/api/boards/${boardId}/posts/${postId}/attachments/${attachmentId}`,
    { responseType: 'blob' },
  )
  const url = window.URL.createObjectURL(response.data as Blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)
}

export async function addComment(boardId: number, postId: number, content: string): Promise<Comment> {
  const { data } = await httpClient.post<Comment>(`/api/boards/${boardId}/posts/${postId}/comments`, { content })
  return data
}

export async function deleteComment(boardId: number, postId: number, commentId: number): Promise<void> {
  await httpClient.delete(`/api/boards/${boardId}/posts/${postId}/comments/${commentId}`)
}
