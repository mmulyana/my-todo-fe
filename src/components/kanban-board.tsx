import { DragDropProvider, DragOverlay, useDroppable } from "@dnd-kit/react";
import { move } from "@dnd-kit/helpers";
import { CollisionPriority } from "@dnd-kit/abstract";
import { MoreHorizontal, Plus, Trash2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  useCreateKanbanColumn,
  useDeleteKanbanColumn,
  useKanbanColumns,
  useMoveTodoToKanbanColumn,
  useTodos,
  useUpdateKanbanColumn,
} from "@/hooks/useTodos";
import type { KanbanColumn, Todo } from "@/types";
import { KanbanCard } from "@/components/kanban-card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Columns = Record<string, string[]>;
const makeColumns = (columns: KanbanColumn[], todos: Todo[]): Columns =>
  Object.fromEntries(
    columns.map((column) => [
      column.id,
      todos
        .filter((todo) => todo.kanbanColumnId === column.id)
        .sort((a, b) => a.position - b.position)
        .map((todo) => todo.id),
    ]),
  );

function Column({
  column,
  ids,
  todos,
  onOpen,
}: {
  column: KanbanColumn;
  ids: string[];
  todos: Map<string, Todo>;
  onOpen: (id: string) => void;
}) {
  const { ref, isDropTarget } = useDroppable({
    id: column.id,
    type: "column",
    accept: "item",
    collisionPriority: CollisionPriority.Low,
  });
  const update = useUpdateKanbanColumn();
  const remove = useDeleteKanbanColumn();
  const [name, setName] = useState(column.name);
  useEffect(() => setName(column.name), [column.name]);

  return (
    <section
      className={cn(
        "flex min-h-full w-72 shrink-0 flex-col rounded-2xl border border-line bg-tint/5 p-2",
        isDropTarget && "shadow-[0_0_0_2px_rgb(0_0_0_/_0.12)]",
      )}
    >
      <header className="flex items-center gap-1 px-2 py-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={() =>
            name.trim() &&
            name !== column.name &&
            update.mutate({ id: column.id, name: name.trim() })
          }
          className="min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none"
          aria-label="Column name"
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="p-1 text-muted hover:text-fg cursor-pointer"
              aria-label={`Column actions for ${column.name}`}
            >
              <MoreHorizontal size={15} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => remove.mutate(column.id)}
              className="gap-2 text-danger focus:bg-danger/10 focus:text-danger"
            >
              <Trash2 size={14} /> Delete column
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>
      <div
        ref={ref}
        className={cn(
          "flex min-h-44 flex-1 flex-col gap-2 rounded-xl p-1",
          isDropTarget && "bg-tint/5",
        )}
      >
        {ids.length ? (
          ids.map((id, index) => {
            const todo = todos.get(id);
            return todo ? (
              <KanbanCard
                key={id}
                todo={todo}
                index={index}
                columnId={column.id}
                onOpen={() => onOpen(id)}
              />
            ) : null;
          })
        ) : (
          <div className="flex flex-1 items-center justify-center text-xs text-muted"></div>
        )}
      </div>
    </section>
  );
}
export function KanbanBoard({ projectId }: { projectId: string }) {
  const { data: todos = [] } = useTodos({ projectId });
  const { data: kanbanColumns = [] } = useKanbanColumns(projectId);
  const create = useCreateKanbanColumn();
  const moveTodo = useMoveTodoToKanbanColumn();
  const [, setParams] = useSearchParams();
  const [columns, setColumns] = useState<Columns>({});
  const [activeId, setActiveId] = useState<string | null>(null);
  const [addingColumn, setAddingColumn] = useState(false);
  const [columnName, setColumnName] = useState("");
  const before = useRef<Columns>({});
  useEffect(
    () => setColumns(makeColumns(kanbanColumns, todos)),
    [kanbanColumns, todos],
  );
  const items = useMemo(
    () => new Map(todos.map((todo) => [todo.id, todo])),
    [todos],
  );
  return (
    <>
      <DragDropProvider
        onDragStart={(event) => {
          before.current = structuredClone(columns);
          setActiveId(event.operation.source?.id as string);
        }}
        onDragOver={(event) =>
          setColumns((current) => move(current, event) as Columns)
        }
        onDragEnd={() => {
          if (!activeId) return;
          const target = kanbanColumns.find((column) =>
            columns[column.id]?.includes(activeId),
          );
          if (target)
            moveTodo.mutate(
              {
                id: activeId,
                kanbanColumnId: target.id,
                position: columns[target.id].indexOf(activeId),
              },
              { onError: () => setColumns(before.current) },
            );
          setActiveId(null);
        }}
      >
        <div className="flex pb-4 min-h-[calc(100dvh-88px)] gap-4 overflow-x-auto px-3">
          {kanbanColumns.map((column) => (
            <Column
              key={column.id}
              column={column}
              ids={columns[column.id] ?? []}
              todos={items}
              onOpen={(id) =>
                setParams(
                  (prev) => {
                    prev.set("todo", id);
                    return prev;
                  },
                  { replace: true },
                )
              }
            />
          ))}
          {addingColumn ? (
            <form
              className="flex h-12 w-44 shrink-0 items-center gap-2 text-sm text-muted"
              onSubmit={(event) => {
                event.preventDefault();
                const name = columnName.trim();
                if (!name) return;
                create.mutate(
                  { projectId, name },
                  {
                    onSuccess: () => {
                      setColumnName("");
                      setAddingColumn(false);
                    },
                  },
                );
              }}
            >
              <Plus size={16} />
              <input
                autoFocus
                value={columnName}
                onChange={(event) => setColumnName(event.target.value)}
                onBlur={() => !columnName.trim() && setAddingColumn(false)}
                placeholder="Column name"
                className="min-w-0 flex-1 border-0 bg-transparent outline-none placeholder:text-muted"
              />
            </form>
          ) : (
            <button
              onClick={() => setAddingColumn(true)}
              className="flex h-12 w-44 shrink-0 items-center gap-2 text-sm text-muted hover:text-fg cursor-pointer"
            >
              <Plus size={16} /> Add column
            </button>
          )}
        </div>
        <DragOverlay>
          {activeId && items.get(activeId) ? (
            <div className="w-72 rounded-xl bg-raised p-3 shadow-xl">
              {items.get(activeId)?.title}
            </div>
          ) : null}
        </DragOverlay>
      </DragDropProvider>
    </>
  );
}
