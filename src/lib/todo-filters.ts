import { todayISO, toISODate } from "./dates";
import type { Todo } from "../types";

export const NONE = "none";

export type FilterCategory =
  | "completed"
  | "priority"
  | "project"
  | "list"
  | "milestone"
  | "due";

// note: satu kategori = OR antar opsi, antar kategori = AND
export type TodoFilters = Record<FilterCategory, string[]>;

export const EMPTY_FILTERS: TodoFilters = {
  completed: [],
  priority: [],
  project: [],
  list: [],
  milestone: [],
  due: [],
};

export const CATEGORIES = Object.keys(EMPTY_FILTERS) as FilterCategory[];

export function activeFilterCount(filters: TodoFilters): number {
  return CATEGORIES.reduce((sum, category) => sum + filters[category].length, 0);
}

function inNextDays(dueDate: string, days: number): boolean {
  const end = new Date();
  end.setDate(end.getDate() + days);
  return dueDate >= todayISO() && dueDate <= toISODate(end);
}

export function optionMatches(
  todo: Todo,
  category: FilterCategory,
  key: string,
): boolean {
  switch (category) {
    case "completed":
      return key === "done" ? todo.completed : !todo.completed;
    case "priority":
      return key === NONE ? todo.priority == null : String(todo.priority) === key;
    case "project":
      return key === NONE ? !todo.projectId : todo.projectId === key;
    case "list":
      return key === NONE ? !todo.listId : todo.listId === key;
    case "milestone":
      return key === NONE ? !todo.milestoneId : todo.milestoneId === key;
    case "due": {
      if (key === NONE) return !todo.dueDate;
      if (!todo.dueDate) return false;
      if (key === "overdue") return todo.dueDate < todayISO();
      if (key === "today") return todo.dueDate === todayISO();
      return inNextDays(todo.dueDate, 7);
    }
  }
}

export function matchesFilters(todo: Todo, filters: TodoFilters): boolean {
  return CATEGORIES.every((category) => {
    const keys = filters[category];
    return keys.length === 0 || keys.some((key) => optionMatches(todo, category, key));
  });
}

export function applyFilters(todos: Todo[], filters: TodoFilters): Todo[] {
  return activeFilterCount(filters) === 0
    ? todos
    : todos.filter((todo) => matchesFilters(todo, filters));
}

const storageKey = (projectId: string) => `todoFilters:${projectId}`;

export function loadFilters(projectId: string): TodoFilters {
  try {
    const raw = localStorage.getItem(storageKey(projectId));
    if (!raw) return EMPTY_FILTERS;
    const parsed = JSON.parse(raw) as Partial<TodoFilters>;
    return Object.fromEntries(
      CATEGORIES.map((category) => [
        category,
        Array.isArray(parsed[category]) ? parsed[category] : [],
      ]),
    ) as TodoFilters;
  } catch {
    return EMPTY_FILTERS;
  }
}

export function saveFilters(projectId: string, filters: TodoFilters) {
  try {
    localStorage.setItem(storageKey(projectId), JSON.stringify(filters));
  } catch {
    // note: storage bisa diblokir (private mode), abaikan
  }
}
