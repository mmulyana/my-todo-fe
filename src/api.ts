import { todayISO } from './lib/dates'
import type { List, Project, Subtodo, Todo, TodoFilter } from './types'

const ENDPOINT = 'https://mytodo.mmulyana.com/api/graphql'

async function gql<T>(
  query: string,
  variables?: Record<string, unknown>,
): Promise<T> {
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables }),
  })
  const json = await res.json()
  if (json.errors?.length) throw new Error(json.errors[0].message)
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
  subtodos { id title completed }
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
  project: r.project ?? null
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
): Promise<void> {
  await gql(
    `mutation ($input: UpdateTodoInput!) { updateTodo(input: $input) { id } }`,
    { input: { id, ...patch } },
  )
}

export const removeSubtodo = removeTodo

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
