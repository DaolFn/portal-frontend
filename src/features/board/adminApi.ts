import { httpClient } from '../../lib/httpClient'
import type { Board, BoardCreateInput, BoardUpdateInput, BoardWritePermissions } from '../../types/board'

export async function fetchBoards(): Promise<Board[]> {
  const { data } = await httpClient.get<Board[]>('/api/admin/boards')
  return data
}

export async function createBoard(input: BoardCreateInput): Promise<Board> {
  const { data } = await httpClient.post<Board>('/api/admin/boards', input)
  return data
}

export async function updateBoard(boardId: number, input: BoardUpdateInput): Promise<Board> {
  const { data } = await httpClient.put<Board>(`/api/admin/boards/${boardId}`, input)
  return data
}

export async function deleteBoard(boardId: number): Promise<void> {
  await httpClient.delete(`/api/admin/boards/${boardId}`)
}

export async function fetchBoardWritePermissions(boardId: number): Promise<BoardWritePermissions> {
  const { data } = await httpClient.get<BoardWritePermissions>(`/api/admin/boards/${boardId}/write-permissions`)
  return data
}

export async function updateBoardWritePermissions(
  boardId: number,
  permissions: BoardWritePermissions,
): Promise<BoardWritePermissions> {
  const { data } = await httpClient.put<BoardWritePermissions>(
    `/api/admin/boards/${boardId}/write-permissions`,
    permissions,
  )
  return data
}
