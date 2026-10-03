import { useState } from "react";
import { addDays, format, subMilliseconds } from "date-fns";
import { ArrowUpRight, Ban, Check, Link2, Trash2, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { TodoPicker, ProjectTag } from "@/components/time-tracker";
import {
  useCreateCalendarEvent,
  useDeleteCalendarEvent,
  useUpdateCalendarEvent,
} from "@/hooks/useCalendarEvents";
import { fromISODate, toISODate } from "@/lib/dates";
import { withClock } from "@/lib/time";
import type { EventDraft } from "@/lib/calendar";
import { cn } from "@/lib/utils";
import type { CalendarEvent } from "@/types";

const EVENT_COLORS = [
  "#2563eb",
  "#0891b2",
  "#16a34a",
  "#d97706",
  "#dc2626",
  "#db2777",
  "#7c3aed",
  "#475569",
];

type EventTodo = CalendarEvent["todo"];

export type EventDialogTarget =
  | { mode: "create"; draft: EventDraft; todo?: EventTodo }
  | { mode: "edit"; event: CalendarEvent };

type FormState = {
  title: string;
  description: string;
  allDay: boolean;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  color: string | null;
  todo: EventTodo;
};

function initialState(target: EventDialogTarget): FormState {
  const source =
    target.mode === "create"
      ? {
          ...target.draft,
          title: "",
          description: "",
          color: null,
          todo: target.todo ?? null,
        }
      : {
          start: new Date(target.event.startAt),
          end: new Date(target.event.endAt),
          allDay: target.event.allDay,
          title: target.event.title,
          description: target.event.description,
          color: target.event.color,
          todo: target.event.todo,
        };
  // note: all-day end is exclusive in storage, the form shows the last day instead
  const shownEnd = source.allDay ? subMilliseconds(source.end, 1) : source.end;
  return {
    title: source.title,
    description: source.description,
    allDay: source.allDay,
    startDate: toISODate(source.start),
    startTime: source.allDay ? "09:00" : format(source.start, "HH:mm"),
    endDate: toISODate(shownEnd),
    endTime: source.allDay ? "10:00" : format(source.end, "HH:mm"),
    color: source.color,
    todo: source.todo,
  };
}

function toRange(form: FormState): { start: Date; end: Date } {
  if (form.allDay) {
    return {
      start: fromISODate(form.startDate),
      end: addDays(fromISODate(form.endDate), 1),
    };
  }
  const at = (date: string, time: string) =>
    new Date(withClock(fromISODate(date).toISOString(), time));
  return {
    start: at(form.startDate, form.startTime),
    end: at(form.endDate, form.endTime),
  };
}

export function EventDialog({
  target,
  onClose,
  onOpenTodo,
}: {
  target: EventDialogTarget | null;
  onClose: () => void;
  onOpenTodo: (todoId: string) => void;
}) {
  return (
    <Dialog open={target !== null} onOpenChange={(open) => !open && onClose()}>
      {target && (
        <EventForm
          key={target.mode === "edit" ? target.event.id : "create"}
          target={target}
          onClose={onClose}
          onOpenTodo={onOpenTodo}
        />
      )}
    </Dialog>
  );
}

const labelClass = "text-xs font-medium text-muted";

function EventForm({
  target,
  onClose,
  onOpenTodo,
}: {
  target: EventDialogTarget;
  onClose: () => void;
  onOpenTodo: (todoId: string) => void;
}) {
  const [form, setForm] = useState(() => initialState(target));
  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const createEvent = useCreateCalendarEvent();
  const updateEvent = useUpdateCalendarEvent();
  const deleteEvent = useDeleteCalendarEvent();

  const { start, end } = toRange(form);
  const invalidRange = !(end > start);
  const title = form.title.trim() || form.todo?.title || "";
  const canSave = Boolean(title) && !invalidRange;

  const save = () => {
    if (!canSave) return;
    const input = {
      title,
      description: form.description.trim(),
      startAt: start.toISOString(),
      endAt: end.toISOString(),
      allDay: form.allDay,
      color: form.color,
      todoId: form.todo?.id ?? null,
    };
    if (target.mode === "create") {
      createEvent.mutate({ input, todo: form.todo });
    } else {
      updateEvent.mutate({
        id: target.event.id,
        patch: input,
        todo: form.todo,
      });
    }
    onClose();
  };

  const remove = () => {
    if (target.mode !== "edit") return;
    deleteEvent.mutate(target.event.id);
    onClose();
  };

  return (
    <DialogContent
      onKeyDown={(e) => {
        if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) save();
      }}
    >
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
      >
        <DialogHeader>
          <DialogTitle>
            {target.mode === "create" ? "New Event" : "Edit Event"}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-3.5 my-1">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="event-title" className={labelClass}>
              Title
            </label>
            <Input
              id="event-title"
              autoFocus
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder={form.todo?.title ?? "Add title"}
            />
          </div>

          {/* linked todo: answers "when will I work on this?" */}
          <div className="flex flex-col gap-1.5">
            <span className={labelClass}>Todo (Optional)</span>
            <div className="flex items-center gap-1 min-w-0">
              <TodoPicker
                selectedId={form.todo?.id}
                onChoose={(todo) => set("todo", todo)}
              >
                <Button
                  type="button"
                  variant="outline"
                  className={cn(
                    "flex-1 min-w-0 justify-start gap-2 px-3 font-normal",
                    !form.todo && "text-muted",
                  )}
                >
                  <Link2 className="w-4 h-4 shrink-0 text-muted" />
                  <span className="flex-1 truncate text-left">
                    {form.todo ? form.todo.title : "Link to a todo…"}
                  </span>
                  {form.todo && (
                    <ProjectTag
                      project={form.todo.project}
                      className="max-w-[40%]"
                    />
                  )}
                </Button>
              </TodoPicker>
              {form.todo && (
                <>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    title="Open todo"
                    onClick={() => {
                      onClose();
                      onOpenTodo(form.todo!.id);
                    }}
                  >
                    <ArrowUpRight className="w-4 h-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    title="Unlink todo"
                    onClick={() => set("todo", null)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className={labelClass}>Time</span>
            <div
              className={cn(
                "grid gap-2",
                form.allDay ? "grid-cols-1" : "grid-cols-[1fr_auto]",
              )}
            >
              <Input
                type="date"
                className="block"
                aria-label="Start date"
                value={form.startDate}
                onChange={(e) => {
                  const value = e.target.value;
                  if (!value) return;
                  const days = Math.round(
                    (fromISODate(value).getTime() -
                      fromISODate(form.startDate).getTime()) /
                      86_400_000,
                  );
                  setForm((f) => ({
                    ...f,
                    startDate: value,
                    endDate: toISODate(addDays(fromISODate(f.endDate), days)),
                  }));
                }}
              />
              {!form.allDay && (
                <Input
                  type="time"
                  aria-label="Start time"
                  step={900}
                  value={form.startTime}
                  onChange={(e) =>
                    e.target.value && set("startTime", e.target.value)
                  }
                  className="block w-28"
                />
              )}
              <Input
                type="date"
                className="block"
                aria-label="End date"
                value={form.endDate}
                onChange={(e) =>
                  e.target.value && set("endDate", e.target.value)
                }
              />
              {!form.allDay && (
                <Input
                  type="time"
                  aria-label="End time"
                  step={900}
                  value={form.endTime}
                  onChange={(e) =>
                    e.target.value && set("endTime", e.target.value)
                  }
                  className="block w-28"
                />
              )}
            </div>
            <label className="flex items-center justify-between text-xs text-muted cursor-pointer select-none">
              All-day
              <Switch
                checked={form.allDay}
                onCheckedChange={(v) => set("allDay", v)}
              />
            </label>
            {invalidRange && (
              <p className="text-xs text-danger">End must be after start.</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <span className={labelClass}>Color</span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                title="Automatic (project color)"
                onClick={() => set("color", null)}
                className={cn(
                  "w-6 h-6 rounded-full border border-line flex items-center justify-center text-muted cursor-pointer",
                  form.color === null &&
                    "ring-2 ring-accent ring-offset-1 ring-offset-raised",
                )}
              >
                <Ban className="w-3.5 h-3.5" />
              </button>
              {EVENT_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  title={color}
                  onClick={() => set("color", color)}
                  className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center cursor-pointer",
                    form.color === color &&
                      "ring-2 ring-accent ring-offset-1 ring-offset-raised",
                  )}
                  style={{ backgroundColor: color }}
                >
                  {form.color === color && (
                    <Check className="w-3.5 h-3.5 text-white" />
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="event-notes" className={labelClass}>
              Notes (Optional)
            </label>
            <textarea
              id="event-notes"
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              rows={3}
              className="w-full rounded-md border border-line bg-raised px-3 py-2 text-sm shadow-xs placeholder:text-muted focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent resize-none"
            />
          </div>
        </div>

        <DialogFooter>
          {target.mode === "edit" && (
            <Button
              type="button"
              variant="ghost"
              onClick={remove}
              className="sm:mr-auto text-danger hover:bg-danger/10"
            >
              <Trash2 className="w-4 h-4 mr-1.5" />
              Delete
            </Button>
          )}
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={!canSave}>
            {target.mode === "create" ? "Create" : "Save"}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
