export type Subtodo = {
  id: string
  title: string
  completed: boolean
}

export type AttachmentType = 'IMAGE' | 'FILE' | 'LINK'

export type Attachment = {
  id: string
  filename: string
  url: string
  mimeType: string | null
  size: number | null
  type: AttachmentType
  todoId: string | null
  projectId: string | null
}

export type Todo = {
  id: string
  listId: string | null
  projectId: string | null
  title: string
  note: string
  subtodos: Subtodo[]
  completed: boolean
  important: boolean
  myDay: boolean
  dueDate: string | null
  createdAt: string
  project: Project | null
  list: List | null
  attachments: Attachment[]
  subtodoCount: number
  completedTodos: number
}

export type List = {
  id: string
  projectId: string | null
  name: string
}

export type Project = {
  id: string
  name: string
  description: string | null
  parentId: string | null
  code?: string | null
}

export type SmartListId = 'today' | 'important' | 'all'

export type View =
  | { kind: 'smart'; id: SmartListId }
  | { kind: 'list'; id: string }
  | { kind: 'project'; id: string }

export type TodoFilter = {
  view?: Uppercase<SmartListId>
  listId?: string
  projectId?: string
  q?: string
}

export type User = {
  id: string
  email: string
  username: string
  createdAt: string
  updatedAt: string
}

export type AuthPayload = {
  accessToken: string
  refreshToken: string
  user: User
}
