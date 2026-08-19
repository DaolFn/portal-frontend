export interface Board {
  boardId: number
  boardCode: string
  boardName: string
  description: string | null
  menuId: number
  canWrite: boolean
}

export interface BoardWritePermissions {
  roleIds: number[]
  deptCodes: string[]
  userIds: number[]
}

export interface BoardCreateInput {
  boardCode: string
  boardName: string
  description: string | null
}

export interface BoardUpdateInput {
  boardName: string
  description: string | null
}

export interface Attachment {
  attachmentId: number
  originalFilename: string
  fileSize: number
}

export interface Comment {
  commentId: number
  content: string
  authorName: string
  authorLoginId: string | null
  createdAt: string
  canDelete: boolean
}

export interface PostSummary {
  postId: number
  title: string
  authorName: string
  authorLoginId: string | null
  viewCount: number
  commentCount: number
  createdAt: string
}

export interface PostDetail {
  postId: number
  boardId: number
  title: string
  content: string
  authorName: string
  authorLoginId: string | null
  viewCount: number
  createdAt: string
  updatedAt: string
  attachments: Attachment[]
  comments: Comment[]
  canEdit: boolean
  canDelete: boolean
  canWrite: boolean
}

export interface Page<T> {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
  size: number
}
