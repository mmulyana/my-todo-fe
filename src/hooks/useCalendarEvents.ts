import { keepPreviousData, useQuery } from "@tanstack/react-query";
import * as api from "../api";
import { patch, tempId, useOptimistic } from "./optimistic";
import { TODOS_KEY } from "./useTodos";
import type { CalendarEvent, TodoFilter } from "../types";

export const CALENDAR_EVENTS_KEY = ["calendar-events"] as const;

const KEYS = [CALENDAR_EVENTS_KEY];

export function useCalendarEvents(from: string, to: string) {
  return useQuery({
    queryKey: [...CALENDAR_EVENTS_KEY, from, to],
    queryFn: () => api.fetchCalendarEvents(from, to),
    placeholderData: keepPreviousData,
  });
}

// note: lives under the todos key so todo mutations (e.g. a new due date) patch it too
export function useDeadlines(dueFrom: string, dueTo: string) {
  const filter: TodoFilter = { dueFrom, dueTo };
  return useQuery({
    queryKey: [...TODOS_KEY, filter],
    queryFn: () => api.fetchTodos(filter),
    placeholderData: keepPreviousData,
  });
}

type EventTodo = CalendarEvent["todo"];

export function useCreateCalendarEvent() {
  return useOptimistic<{ input: api.CalendarEventInput; todo?: EventTodo }>(
    KEYS,
    ({ input }) => api.createCalendarEvent(input),
    (qc, { input, todo }) => {
      // note: every cached range gets the event, views filter by their own days anyway
      patch<CalendarEvent>(qc, CALENDAR_EVENTS_KEY, (events) => [
        ...events,
        {
          id: tempId(),
          title: input.title?.trim() || todo?.title || "",
          description: input.description ?? "",
          startAt: input.startAt,
          endAt: input.endAt,
          allDay: input.allDay ?? false,
          color: input.color ?? null,
          todoId: todo?.id ?? null,
          todo: todo ?? null,
        },
      ]);
    },
  );
}

export function useUpdateCalendarEvent() {
  return useOptimistic<{
    id: string;
    patch: Partial<api.CalendarEventInput>;
    todo?: EventTodo;
  }>(
    KEYS,
    ({ id, patch: changes }) => api.updateCalendarEvent(id, changes),
    (qc, { id, patch: changes, todo }) => {
      patch<CalendarEvent>(qc, CALENDAR_EVENTS_KEY, (events) =>
        events.map((e) => {
          if (e.id !== id) return e;
          const next = { ...e };
          if (changes.title != null) next.title = changes.title;
          if (changes.description != null)
            next.description = changes.description;
          if (changes.startAt) next.startAt = changes.startAt;
          if (changes.endAt) next.endAt = changes.endAt;
          if (changes.allDay != null) next.allDay = changes.allDay;
          if (changes.color !== undefined) next.color = changes.color;
          if (todo !== undefined) {
            next.todo = todo;
            next.todoId = todo?.id ?? null;
          }
          return next;
        }),
      );
    },
  );
}

export function useDeleteCalendarEvent() {
  return useOptimistic<string>(
    KEYS,
    (id) => api.removeCalendarEvent(id),
    (qc, id) =>
      patch<CalendarEvent>(qc, CALENDAR_EVENTS_KEY, (events) =>
        events.filter((e) => e.id !== id),
      ),
  );
}
