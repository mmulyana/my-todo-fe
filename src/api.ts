import { print } from 'graphql'
import type { TypedDocumentNode } from '@graphql-typed-document-node/core'
import { graphql, readFragment, type ResultOf } from './graphql'
import { todayISO } from './lib/dates'
import type { ApiToken, Attachment, AttachmentType, DocumentContent, List, NewApiToken, Project, ProjectDocument, ProjectDocumentDetail, Subtodo, Todo, TodoFilter } from './types'

const BASE_URL = import.meta.env.VITE_API_URL || 'https://mytodo.mmulyana.com/api/graphql'
export const API_ORIGIN = new URL(BASE_URL, window.location.origin).origin
const REST_BASE_URL = `${API_ORIGIN}/api`

export function resolveAttachmentUrl(url: string): string {
  return url.startsWith('/') ? `${API_ORIGIN}${url}` : url
}

let refreshPromise: Promise<string> | null = null

const RefreshTokenDocument = graphql(`
  mutation RefreshToken($token: String!) {
    refreshToken(token: $token) {
      accessToken
      refreshToken
    }
  }
`)

async function refreshAccessToken(): Promise<string> {
  const refreshToken = localStorage.getItem('refreshToken')
  if (!refreshToken) throw new Error('No refresh token')

  const res = await fetch(BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: print(RefreshTokenDocument),
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

async function gql<TResult, TVariables extends Record<string, unknown> | undefined>(
  document: TypedDocumentNode<TResult, TVariables>,
  variables?: TVariables,
  signal?: AbortSignal,
  isRetry = false,
): Promise<TResult> {
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
    body: JSON.stringify({ query: print(document), variables }),
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
        return gql<TResult, TVariables>(document, variables, signal, true)
      } catch {
        logout()
        throw new Error('Session expired, please sign in again')
      }
    }
    throw new Error(json.errors[0].message)
  }

  return json.data as TResult
}

const todoFieldsFragment = graphql(`
  fragment TodoFields on Todo {
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
    project {
      id
      name
      code
    }
    list {
      id
      name
      projectId
    }
    subtodos {
      id
      title
      completed
    }
    attachments {
      id
      filename
      url
      mimeType
      size
      type
      todoId
      projectId
      title
      description
      image
      favicon
      siteName
    }
    subtodoCount
    completedTodos
  }
`)

type TodoFieldsResult = ResultOf<typeof todoFieldsFragment>

const toTodo = (r: TodoFieldsResult): Todo => ({
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
  subtodos: [...(r.subtodos ?? [])],
  project: r.project ?? null,
  list: r.list ?? null,
  attachments: r.attachments ?? [],
  subtodoCount: r.subtodoCount ?? 0,
  completedTodos: r.completedTodos ?? 0,
})

const ListsDocument = graphql(`
  query Lists {
    lists {
      id
      name
      projectId
    }
  }
`)

export async function fetchLists(): Promise<List[]> {
  const data = await gql(ListsDocument, {})
  return data.lists
}

const TodosDocument = graphql(
  `
    query Todos($filter: TodoFilterInput) {
      todos(filter: $filter) {
        ...TodoFields
      }
    }
  `,
  [todoFieldsFragment],
)

export async function fetchTodos(filter: TodoFilter = {}): Promise<Todo[]> {
  const data = await gql(TodosDocument, { filter })
  return data.todos.map((t) => toTodo(readFragment(todoFieldsFragment, t)))
}

const TodoDocument = graphql(
  `
    query Todo($id: ID!) {
      todo(id: $id) {
        ...TodoFields
      }
    }
  `,
  [todoFieldsFragment],
)

export async function fetchTodo(id: string): Promise<Todo | null> {
  const data = await gql(TodoDocument, { id })
  return data.todo ? toTodo(readFragment(todoFieldsFragment, data.todo)) : null
}

type NewTodoFields = {
  title: string
  listId?: string | null
  projectId?: string | null
  important?: boolean
  myDay?: boolean
  dueDate?: string | null
}

const CreateTodoDocument = graphql(
  `
    mutation CreateTodo($input: CreateTodoInput!) {
      createTodo(input: $input) {
        ...TodoFields
      }
    }
  `,
  [todoFieldsFragment],
)

export async function createTodo(fields: NewTodoFields): Promise<Todo> {
  const input: Record<string, unknown> = { title: fields.title }
  if (fields.listId != null) input.listId = fields.listId
  if (fields.projectId != null) input.projectId = fields.projectId
  if (fields.important) input.important = true
  if (fields.dueDate) input.dueDate = fields.dueDate
  if (fields.myDay) input.today = todayISO()

  const data = await gql(CreateTodoDocument, { input: input as any })
  return toTodo(readFragment(todoFieldsFragment, data.createTodo))
}

const UpdateTodoDocument = graphql(`
  mutation UpdateTodo($input: UpdateTodoInput!) {
    updateTodo(input: $input) {
      id
    }
  }
`)

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

  await gql(UpdateTodoDocument, { input: input as any }, signal)
}

const RemoveTodoDocument = graphql(`
  mutation RemoveTodo($id: ID!) {
    removeTodo(id: $id) {
      id
    }
  }
`)

export async function removeTodo(id: string): Promise<void> {
  await gql(RemoveTodoDocument, { id })
}

const CreateSubtodoDocument = graphql(`
  mutation CreateSubtodo($input: CreateTodoInput!) {
    createTodo(input: $input) {
      id
      title
      completed
    }
  }
`)

export async function createSubtodo(
  parentId: string,
  title: string,
): Promise<Subtodo> {
  const data = await gql(CreateSubtodoDocument, { input: { title, parentId } as any })
  const { id, title: t, completed } = data.createTodo
  return { id, title: t, completed }
}

export async function updateSubtodo(
  id: string,
  patch: { title?: string; completed?: boolean },
  signal?: AbortSignal,
): Promise<void> {
  await gql(UpdateTodoDocument, { input: { id, ...patch } as any }, signal)
}

export const removeSubtodo = removeTodo

const CreateAttachmentDocument = graphql(`
  mutation CreateAttachment($input: CreateAttachmentInput!) {
    createAttachment(input: $input) {
      id
      filename
      url
      mimeType
      size
      type
      todoId
      projectId
      title
      description
      image
      favicon
      siteName
    }
  }
`)

export async function createAttachment(input: {
  todoId: string
  url: string
  filename: string
  type: AttachmentType
}): Promise<Attachment> {
  const data = await gql(CreateAttachmentDocument, { input: input as any })
  return data.createAttachment
}

const RemoveAttachmentDocument = graphql(`
  mutation RemoveAttachment($id: ID!) {
    removeAttachment(id: $id) {
      id
    }
  }
`)

export async function removeAttachment(id: string): Promise<void> {
  await gql(RemoveAttachmentDocument, { id })
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

const CreateListDocument = graphql(`
  mutation CreateList($input: CreateListInput!) {
    createList(input: $input) {
      id
      name
      projectId
    }
  }
`)

export async function createList(
  name: string,
  projectId?: string | null,
): Promise<List> {
  const input: Record<string, unknown> = { name }
  if (projectId != null) input.projectId = projectId

  const data = await gql(CreateListDocument, { input: input as any })
  return data.createList
}

const UpdateListDocument = graphql(`
  mutation UpdateList($input: UpdateListInput!) {
    updateList(input: $input) {
      id
    }
  }
`)

export async function updateList(
  id: string,
  patch: { name?: string; projectId?: string | null },
): Promise<void> {
  await gql(UpdateListDocument, { input: { id, ...patch } as any })
}

const RemoveListDocument = graphql(`
  mutation RemoveList($id: ID!) {
    removeList(id: $id) {
      id
    }
  }
`)

export async function removeList(id: string): Promise<void> {
  await gql(RemoveListDocument, { id })
}

const projectFieldsFragment = graphql(`
  fragment ProjectFields on Project {
    id
    name
    description
    parentId
    code
  }
`)

const ProjectsDocument = graphql(
  `
    query Projects {
      projects {
        ...ProjectFields
      }
    }
  `,
  [projectFieldsFragment],
)

export async function fetchProjects(): Promise<Project[]> {
  const data = await gql(ProjectsDocument, {})
  return data.projects.map((p) => readFragment(projectFieldsFragment, p))
}

const CreateProjectDocument = graphql(
  `
    mutation CreateProject($input: CreateProjectInput!) {
      createProject(input: $input) {
        ...ProjectFields
      }
    }
  `,
  [projectFieldsFragment],
)

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

  const data = await gql(CreateProjectDocument, { input: input as any })
  return readFragment(projectFieldsFragment, data.createProject)
}

const UpdateProjectDocument = graphql(`
  mutation UpdateProject($input: UpdateProjectInput!) {
    updateProject(input: $input) {
      id
    }
  }
`)

export async function updateProject(
  id: string,
  patch: {
    name?: string
    description?: string | null
    parentId?: string | null
    code?: string | null
  },
): Promise<void> {
  await gql(UpdateProjectDocument, { input: { id, ...patch } as any })
}

const RemoveProjectDocument = graphql(`
  mutation RemoveProject($id: ID!) {
    removeProject(id: $id) {
      id
    }
  }
`)

export async function removeProject(id: string): Promise<void> {
  await gql(RemoveProjectDocument, { id })
}

const LoginDocument = graphql(`
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      accessToken
      refreshToken
      user {
        id
        email
        username
        createdAt
        updatedAt
      }
    }
  }
`)

export async function login(email: string, password: string): Promise<import('./types').AuthPayload> {
  const data = await gql(LoginDocument, { input: { email, password } })
  localStorage.setItem('accessToken', data.login.accessToken)
  localStorage.setItem('refreshToken', data.login.refreshToken)
  return data.login
}

const RegisterDocument = graphql(`
  mutation Register($input: RegisterInput!) {
    register(input: $input) {
      accessToken
      refreshToken
      user {
        id
        email
        username
        createdAt
        updatedAt
      }
    }
  }
`)

export async function register(email: string, username: string, password: string): Promise<import('./types').AuthPayload> {
  const data = await gql(RegisterDocument, { input: { email, username, password } })
  localStorage.setItem('accessToken', data.register.accessToken)
  localStorage.setItem('refreshToken', data.register.refreshToken)
  return data.register
}

const MeDocument = graphql(`
  query Me {
    me {
      id
      email
      username
      createdAt
      updatedAt
    }
  }
`)

export async function fetchMe(): Promise<import('./types').User> {
  const data = await gql(MeDocument, {})
  return data.me
}

export function logout() {
  localStorage.removeItem('accessToken')
  localStorage.removeItem('refreshToken')
  window.location.href = '/login'
}

// ---------------------------------------------------------------------------
// Documents
// ---------------------------------------------------------------------------

const documentFieldsFragment = graphql(`
  fragment DocumentFields on Document {
    id
    title
    projectId
    updatedAt
  }
`)

const DocumentsDocument = graphql(
  `
    query Documents($projectId: ID) {
      documents(projectId: $projectId) {
        ...DocumentFields
      }
    }
  `,
  [documentFieldsFragment],
)

export async function fetchDocuments(projectId?: string): Promise<ProjectDocument[]> {
  const data = await gql(DocumentsDocument, { projectId: projectId ?? null })
  return data.documents.map((d) => readFragment(documentFieldsFragment, d))
}

const DocumentDocument = graphql(
  `
    query Document($id: ID!) {
      document(id: $id) {
        ...DocumentFields
        content
      }
    }
  `,
  [documentFieldsFragment],
)

export async function fetchDocument(id: string): Promise<ProjectDocumentDetail | null> {
  const data = await gql(DocumentDocument, { id })
  if (!data.document) return null
  const { content, ...rest } = data.document
  return {
    ...readFragment(documentFieldsFragment, rest),
    content: (content ?? null) as DocumentContent,
  }
}

const CreateDocumentDocument = graphql(
  `
    mutation CreateDocument($input: CreateDocumentInput!) {
      createDocument(input: $input) {
        ...DocumentFields
      }
    }
  `,
  [documentFieldsFragment],
)

export async function createDocument(
  title: string,
  projectId?: string | null,
): Promise<ProjectDocument> {
  const data = await gql(CreateDocumentDocument, {
    input: { title, projectId: projectId ?? null } as any,
  })
  return readFragment(documentFieldsFragment, data.createDocument)
}

const UpdateDocumentDocument = graphql(`
  mutation UpdateDocument($input: UpdateDocumentInput!) {
    updateDocument(input: $input) {
      id
      updatedAt
    }
  }
`)

export async function updateDocument(
  id: string,
  patch: { title?: string; content?: DocumentContent },
  signal?: AbortSignal,
): Promise<void> {
  await gql(UpdateDocumentDocument, { input: { id, ...patch } as any }, signal)
}

const RemoveDocumentDocument = graphql(`
  mutation RemoveDocument($id: ID!) {
    removeDocument(id: $id) {
      id
    }
  }
`)

export async function removeDocument(id: string): Promise<void> {
  await gql(RemoveDocumentDocument, { id })
}
