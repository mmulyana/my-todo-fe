import { todayISO } from './lib/dates'
import type { ApiToken, Attachment, AttachmentType, List, NewApiToken, Project, Subtodo, Todo, TodoFilter } from './types'

const BASE_URL = import.meta.env.VITE_API_URL || 'https://mytodo.mmulyana.com/api/graphql'
export const API_ORIGIN = new URL(BASE_URL, window.location.origin).origin
const REST_BASE_URL = `${API_ORIGIN}/api`

export function resolveAttachmentUrl(url: string): string {
  return url.startsWith('/') ? `${API_ORIGIN}${url}` : url
}

let refreshPromise: Promise<string> | null = null

async function refreshAccessToken(): Promise<string> {
  const refreshToken = localStorage.getItem('refreshToken')
  if (!refreshToken) throw new Error('No refresh token')

  const res = await fetch(BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: `mutation RefreshToken($token: String!) {
        refreshToken(token: $token) {
          accessToken
          refreshToken
        }
      }`,
      variables: { token: refreshToken },
    }),
  })
  const json = await res.json()
  if (json.errors?.length || !json.data?.refreshToken) {
    throw new Error(json.errors?.[0]?.message || 'Failed to refresh token')
  }

  const { accessToken, refreshToken: newRefreshToken } = json.data.refreshToken
  localStorage.setItem('accessToken', accessToken)
  localStorage.setItem('refreshToken', newRefreshToken)
  return accessToken
}

function isUnauthenticated(json: any): boolean {
  return json.errors?.some(
    (e: any) => e.extensions?.code === 'UNAUTHENTICATED' || e.extensions?.originalError?.statusCode === 401,
  )
}

async function gql<T>(
  query: string,
  variables?: Record<string, unknown>,
  signal?: AbortSignal,
  isRetry = false,
): Promise<T> {
  const token = localStorage.getItem('accessToken')
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const res = await fetch(BASE_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify({ query, variables }),
    signal,
  })
  const json = await res.json()

  if (json.errors?.length) {
    if (!isRetry && isUnauthenticated(json) && localStorage.getItem('refreshToken')) {
      try {
        if (!refreshPromise) {
          refreshPromise = refreshAccessToken().finally(() => {
            refreshPromise = null
          })
        }
        await refreshPromise
        return gql<T>(query, variables, signal, true)
      } catch {
        logout()
        throw new Error('Session expired, please sign in again')
      }
    }
    throw new Error(json.errors[0].message)
  }

  return json.data as T
}

type RawSubtodo = { id: string; title: string; completed: boolean }

type RawTodo = {
  id: string
  listId: string | null
  projectId: string | null
  title: string
  note: string
  completed: boolean
  important: boolean
  today: string | null
  dueDate: string | null
  createdAt: string
  subtodos: RawSubtodo[]
  project: Project | null
  list: List | null
  attachments: Attachment[]
  subtodoCount: number | null
  completedTodos: number | null
}

const TODO_FIELDS = `
  id
  listId
  projectId
  title
  note
  completed
  important
  today
  dueDate
  createdAt
  project { id, name, code }
  list { id name projectId }
  subtodos { id title completed }
  attachments { id filename url mimeType size type todoId projectId }
  subtodoCount
  completedTodos
`

const toTodo = (r: RawTodo): Todo => ({
  id: r.id,
  listId: r.listId,
  projectId: r.projectId,
  title: r.title,
  note: r.note ?? '',
  completed: r.completed,
  important: r.important,
  myDay: r.today === todayISO(),
  dueDate: r.dueDate,
  createdAt: r.createdAt,
  subtodos: r.subtodos ?? [],
  project: r.project ?? null,
  list: r.list ?? null,
  attachments: r.attachments ?? [],
  subtodoCount: r.subtodoCount ?? 0,
  completedTodos: r.completedTodos ?? 0,
})

export async function fetchLists(): Promise<List[]> {
  const data = await gql<{ lists: List[] }>(
    `query { lists { id name projectId } }`,
  )
  return data.lists
}

export async function fetchTodos(filter: TodoFilter = {}): Promise<Todo[]> {
  const data = await gql<{ todos: RawTodo[] }>(
    `query Todos($filter: TodoFilterInput) {
       todos(filter: $filter) { ${TODO_FIELDS} }
     }`,
    { filter },
  )
  return data.todos.map(toTodo)
}

export async function fetchTodo(id: string): Promise<Todo | null> {
  const data = await gql<{ todo: RawTodo | null }>(
    `query Todo($id: ID!) { todo(id: $id) { ${TODO_FIELDS} } }`,
    { id },
  )
  return data.todo ? toTodo(data.todo) : null
}

type NewTodoFields = {
  title: string
  listId?: string | null
  projectId?: string | null
  important?: boolean
  myDay?: boolean
  dueDate?: string | null
}

export async function createTodo(fields: NewTodoFields): Promise<Todo> {
  const input: Record<string, unknown> = { title: fields.title }
  if (fields.listId != null) input.listId = fields.listId
  if (fields.projectId != null) input.projectId = fields.projectId
  if (fields.important) input.important = true
  if (fields.dueDate) input.dueDate = fields.dueDate
  if (fields.myDay) input.today = todayISO()

  const data = await gql<{ createTodo: RawTodo }>(
    `mutation ($input: CreateTodoInput!) {
       createTodo(input: $input) { ${TODO_FIELDS} }
     }`,
    { input },
  )
  return toTodo(data.createTodo)
}

export async function updateTodo(
  id: string,
  patch: Partial<Todo>,
  signal?: AbortSignal,
): Promise<void> {
  const input: Record<string, unknown> = { id }
  if (patch.title !== undefined) input.title = patch.title
  if (patch.note !== undefined) input.note = patch.note
  if (patch.completed !== undefined) input.completed = patch.completed
  if (patch.important !== undefined) input.important = patch.important
  if (patch.dueDate !== undefined) input.dueDate = patch.dueDate
  if (patch.listId !== undefined) input.listId = patch.listId
  if (patch.projectId !== undefined) input.projectId = patch.projectId
  if (patch.myDay !== undefined) input.today = patch.myDay ? todayISO() : null

  await gql(
    `mutation ($input: UpdateTodoInput!) { updateTodo(input: $input) { id } }`,
    { input },
    signal,
  )
}

export async function removeTodo(id: string): Promise<void> {
  await gql(`mutation ($id: ID!) { removeTodo(id: $id) { id } }`, { id })
}

export async function createSubtodo(
  parentId: string,
  title: string,
): Promise<Subtodo> {
  const data = await gql<{ createTodo: RawSubtodo }>(
    `mutation ($input: CreateTodoInput!) {
       createTodo(input: $input) { id title completed }
     }`,
    { input: { title, parentId } },
  )
  const { id, title: t, completed } = data.createTodo
  return { id, title: t, completed }
}

export async function updateSubtodo(
  id: string,
  patch: { title?: string; completed?: boolean },
  signal?: AbortSignal,
): Promise<void> {
  await gql(
    `mutation ($input: UpdateTodoInput!) { updateTodo(input: $input) { id } }`,
    { input: { id, ...patch } },
    signal,
  )
}

export const removeSubtodo = removeTodo

const ATTACHMENT_FIELDS = `id filename url mimeType size type todoId projectId`

export async function createAttachment(input: {
  todoId: string
  url: string
  filename: string
  type: AttachmentType
}): Promise<Attachment> {
  const data = await gql<{ createAttachment: Attachment }>(
    `mutation ($input: CreateAttachmentInput!) {
       createAttachment(input: $input) { ${ATTACHMENT_FIELDS} }
     }`,
    { input },
  )
  return data.createAttachment
}

export async function removeAttachment(id: string): Promise<void> {
  await gql(`mutation ($id: ID!) { removeAttachment(id: $id) { id } }`, { id })
}

export async function uploadAttachment(
  file: File,
  todoId: string,
  isRetry = false,
): Promise<Attachment> {
  const token = localStorage.getItem('accessToken')
  const formData = new FormData()
  formData.append('file', file)
  formData.append('todoId', todoId)
  formData.append('type', 'IMAGE')

  const res = await fetch(`${REST_BASE_URL}/attachments/upload`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: formData,
  })

  if (res.status === 401 && !isRetry && localStorage.getItem('refreshToken')) {
    try {
      if (!refreshPromise) {
        refreshPromise = refreshAccessToken().finally(() => {
          refreshPromise = null
        })
      }
      await refreshPromise
      return uploadAttachment(file, todoId, true)
    } catch {
      logout()
      throw new Error('Session expired, please sign in again')
    }
  }

  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new Error(body?.message || 'Failed to upload attachment')
  }

  return res.json()
}

// note: helper buat rest json umum dengan retry setelah refresh jika mendapat 401 endpoint token memakai rest bkn graph
async function restFetch<T>(
  path: string,
  options: RequestInit = {},
  isRetry = false,
): Promise<T> {
  const token = localStorage.getItem('accessToken')
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${REST_BASE_URL}${path}`, { ...options, headers })

  if (res.status === 401 && !isRetry && localStorage.getItem('refreshToken')) {
    try {
      if (!refreshPromise) {
        refreshPromise = refreshAccessToken().finally(() => {
          refreshPromise = null
        })
      }
      await refreshPromise
      return restFetch<T>(path, options, true)
    } catch {
      logout()
      throw new Error('Session expired, please sign in again')
    }
  }

  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new Error(body?.message || `Request failed (${res.status})`)
  }

  if (res.status === 204) return undefined as T
  return res.json()
}

export async function fetchApiTokens(): Promise<ApiToken[]> {
  return restFetch<ApiToken[]>('/tokens')
}

export async function createApiToken(
  name: string,
  expiresInDays?: number | null,
): Promise<NewApiToken> {
  return restFetch<NewApiToken>('/tokens', {
    method: 'POST',
    body: JSON.stringify({ name, expiresInDays }),
  })
}

export async function revokeApiToken(id: string): Promise<void> {
  await restFetch<void>(`/tokens/${id}`, { method: 'DELETE' })
}

export async function createList(
  name: string,
  projectId?: string | null,
): Promise<List> {
  const input: Record<string, unknown> = { name }
  if (projectId != null) input.projectId = projectId

  const data = await gql<{ createList: List }>(
    `mutation ($input: CreateListInput!) {
       createList(input: $input) { id name projectId }
     }`,
    { input },
  )
  return data.createList
}

export async function updateList(
  id: string,
  patch: { name?: string; projectId?: string | null },
): Promise<void> {
  await gql(
    `mutation ($input: UpdateListInput!) { updateList(input: $input) { id } }`,
    { input: { id, ...patch } },
  )
}

export async function removeList(id: string): Promise<void> {
  await gql(`mutation ($id: ID!) { removeList(id: $id) { id } }`, { id })
}

const PROJECT_FIELDS = `id name description parentId`

export async function fetchProjects(): Promise<Project[]> {
  const data = await gql<{ projects: Project[] }>(
    `query { projects { ${PROJECT_FIELDS} } }`,
  )
  return data.projects
}

export async function createProject(
  name: string,
  description?: string | null,
  parentId?: string | null,
  code?: string | null
): Promise<Project> {
  const input: Record<string, unknown> = { name }
  if (description) input.description = description
  if (parentId != null) input.parentId = parentId
  if (code) input.code = code

  const data = await gql<{ createProject: Project }>(
    `mutation ($input: CreateProjectInput!) {
       createProject(input: $input) { ${PROJECT_FIELDS} }
     }`,
    { input },
  )
  return data.createProject
}

export async function updateProject(
  id: string,
  patch: {
    name?: string
    description?: string | null
    parentId?: string | null
    code?: string | null
  },
): Promise<void> {
  await gql(
    `mutation ($input: UpdateProjectInput!) { updateProject(input: $input) { id } }`,
    { input: { id, ...patch } },
  )
}

export async function removeProject(id: string): Promise<void> {
  await gql(`mutation ($id: ID!) { removeProject(id: $id) { id } }`, { id })
}

export async function login(email: string, password: string): Promise<import('./types').AuthPayload> {
  const data = await gql<{ login: import('./types').AuthPayload }>(
    `mutation Login($input: LoginInput!) {
      login(input: $input) {
        accessToken
        refreshToken
        user {
          id
          email
          username
        }
      }
    }`,
    { input: { email, password } }
  )
  localStorage.setItem('accessToken', data.login.accessToken)
  localStorage.setItem('refreshToken', data.login.refreshToken)
  return data.login
}

export async function register(email: string, username: string, password: string): Promise<import('./types').AuthPayload> {
  const data = await gql<{ register: import('./types').AuthPayload }>(
    `mutation Register($input: RegisterInput!) {
      register(input: $input) {
        accessToken
        refreshToken
        user {
          id
          email
          username
          createdAt
        }
      }
    }`,
    { input: { email, username, password } }
  )
  localStorage.setItem('accessToken', data.register.accessToken)
  localStorage.setItem('refreshToken', data.register.refreshToken)
  return data.register
}

export function logout() {
  localStorage.removeItem('accessToken')
  localStorage.removeItem('refreshToken')
  window.location.href = '/login'
}
