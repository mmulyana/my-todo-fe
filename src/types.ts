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

export type Milestone = {
  id: string;
  name: string;
  description: string | null;
  dueDate: string | null;
  projectId: string | null;
};

export type Todo = {
  id: string;
  listId: string | null;
  projectId: string | null;
  milestoneId: string | null;
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
  milestone: Milestone | null;
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
  includeSubtodos?: boolean;
  listId?: string;
  projectId?: string;
  q?: string;
  completed?: boolean;
  priority?: TodoPriority;
  dueFrom?: string;
  dueTo?: string;
  limit?: number;
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

export type TimeEntry = {
  id: string;
  description: string;
  startedAt: string;
  // note: null means the timer is still running
  endedAt: string | null;
  todoId: string | null;
  todo: {
    id: string;
    title: string;
    completed: boolean;
    project: TodoProject | null;
    list: { id: string; name: string } | null;
  } | null;
};

export type CalendarEvent = {
  id: string;
  title: string;
  description: string;
  startAt: string;
  // note: exclusive end, one-day all-day event ends at the next midnight
  endAt: string;
  allDay: boolean;
  color: string | null;
  todoId: string | null;
  // note: important/priority are missing on a todo just picked in the dialog until the refetch
  todo:
    | (NonNullable<TimeEntry["todo"]> & {
        important?: boolean;
        priority?: TodoPriority | null;
      })
    | null;
};
