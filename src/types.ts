export type Subtodo = {
  id: string
  title: string
  completed: boolean
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
