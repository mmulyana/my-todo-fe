export type Subtodo = {
  id: string;
  title: string;
  completed: boolean;
  subtodoCount: number;
  completedTodos: number;
};

export type TodoAncestor = {
  id: string;
  title: string;
};

export type AttachmentType = "IMAGE" | "FILE" | "LINK";
export type TodoPriority = 1 | 2 | 3;

export type Attachment = {
  id: string;
  filename: string;
  url: string;
  mimeType: string | null;
  size: number | null;
  type: AttachmentType;
  todoId: string | null;
  projectId: string | null;
  title: string | null;
  description: string | null;
  image: string | null;
  favicon: string | null;
  siteName: string | null;
};

export type Todo = {
  id: string;
  listId: string | null;
  projectId: string | null;
  title: string;
  note: string;
  parentId: string | null;
  /** Root-first chain of parents. Only populated by the single-todo query. */
  ancestors: TodoAncestor[];
  subtodos: Subtodo[];
  completed: boolean;
  important: boolean;
  priority: TodoPriority | null;
  kanbanColumnId: string | null;
  position: number;
  listPosition: number;
  myDay: boolean;
  dueDate: string | null;
  createdAt: string;
  project: TodoProject | null;
  list: List | null;
  attachments: Attachment[];
  subtodoCount: number;
  completedTodos: number;
};

export type List = {
  id: string;
  projectId: string | null;
  name: string;
};

export type Project = {
  id: string;
  name: string;
  color: string | null;
  description: string | null;
  parentId: string | null;
  code?: string | null;
  archivedAt?: string | null;
  attachments: Attachment[];
};

export type KanbanColumn = {
  id: string;
  name: string;
  position: number;
  projectId: string;
};

export type DocumentContent = Record<string, unknown> | null;

export type ProjectDocument = {
  id: string;
  title: string;
  projectId: string | null;
  updatedAt: string;
};

export type ProjectDocumentDetail = ProjectDocument & {
  content: DocumentContent;
};

export type TodoProject = {
  id: string;
  name: string;
  code: string | null;
  color: string | null;
};

export type SmartListId = "today" | "important" | "all";

export type View =
  | { kind: "smart"; id: SmartListId }
  | { kind: "list"; id: string }
  | { kind: "project"; id: string };

export type TodoFilter = {
  view?: Uppercase<SmartListId>;
  listId?: string;
  projectId?: string;
  q?: string;
  completed?: boolean;
  priority?: TodoPriority;
};

export type User = {
  id: string;
  email: string;
  username: string;
  createdAt: string;
  updatedAt: string;
};

export type AuthPayload = {
  accessToken: string;
  refreshToken: string;
  user: User;
};

export type ApiToken = {
  id: string;
  name: string;
  prefix: string;
  lastUsedAt: string | null;
  expiresAt: string | null;
  revokedAt: string | null;
  createdAt: string;
};

export type NewApiToken = ApiToken & { token: string };
