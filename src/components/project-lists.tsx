import { useEffect, useMemo, useRef, useState } from "react";
import { DragDropProvider, DragOverlay, useDroppable } from "@dnd-kit/react";
import { useSortable } from "@dnd-kit/react/sortable";
import { move } from "@dnd-kit/helpers";
import { CollisionPriority } from "@dnd-kit/abstract";
import { TodoRow } from "./todo-row";
import { AddTodoBar } from "./add-todo-bar";
import { useCreateList, useDeleteList, useUpdateList } from "../hooks/useLists";
import { useMoveTodoToList } from "../hooks/useTodos";
import { cn } from "@/lib/utils";
import type { List, Todo } from "../types";
import { ChevronDown, ChevronRight, MoreHorizontal, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const NO_LIST = "__no_list__";

type Groups = Record<string, string[]>;

function toGroups(lists: List[], todos: Todo[]): Groups {
  const groups: Groups = { [NO_LIST]: [] };
  for (const list of lists) groups[list.id] = [];

  const ordered = [...todos].sort(
    (a, b) =>
      a.listPosition - b.listPosition || a.createdAt.localeCompare(b.createdAt),
  );
  for (const todo of ordered) {
    const key = todo.listId && groups[todo.listId] ? todo.listId : NO_LIST;
    groups[key].push(todo.id);
  }
  return groups;
}

function cloneGroups(groups: Groups): Groups {
  return Object.fromEntries(
    Object.entries(groups).map(([key, ids]) => [key, [...ids]]),
  );
}

function SortableTodoRow({
  todo,
  index,
  group,
  showList,
}: {
  todo: Todo;
  index: number;
  group: string;
  showList?: boolean;
}) {
  const { ref, handleRef, isDragging } = useSortable({
    id: todo.id,
    index,
    group,
    type: "todo",
    accept: "todo",
  });

  return (
    <div ref={ref} className="flex flex-col">
      <TodoRow
        todo={todo}
        showList={showList}
        skipInvalidate
        dragHandleRef={handleRef}
        dragging={isDragging}
      />
    </div>
  );
}

function DropZone({
  id,
  className,
  children,
}: {
  id: string;
  className?: string;
  children: React.ReactNode;
}) {
  const { ref, isDropTarget } = useDroppable({
    id,
    type: "list",
    accept: "todo",
    collisionPriority: CollisionPriority.Low,
  });

  return (
    <div
      ref={ref}
      className={cn(
        "flex flex-col rounded-lg transition-colors",
        isDropTarget && "bg-tint/5",
        className,
      )}
    >
      {children}
    </div>
  );
}

const fieldClass =
  "w-full my-1 py-2 px-3 rounded-lg bg-bg text-[15px] outline-none focus:border-accent";

function SectionHeader({
  name,
  collapsed,
  onToggleCollapsed,
  onUpdateName,
  onDelete,
}: {
  name: string;
  collapsed: boolean;
  onToggleCollapsed: () => void;
  onUpdateName: (newName: string) => void;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(name);

  const handleSave = () => {
    const trimmed = editName.trim();
    if (trimmed && trimmed !== name) {
      onUpdateName(trimmed);
    } else {
      setEditName(name);
    }
    setEditing(false);
  };

  return (
    <div className="group/sec flex items-center group">
      <div className="w-5 h-5 flex justify-center items-center">
        <button
          type="button"
          className="hidden group-hover:flex items-center text-muted hover:text-fg transition-colors"
          onClick={onToggleCollapsed}
          aria-expanded={!collapsed}
          aria-label={collapsed ? `Show ${name}` : `Hide ${name}`}
        >
          {collapsed ? (
            <ChevronDown size={15} strokeWidth={2} />
          ) : (
            <ChevronRight size={15} strokeWidth={2} />
          )}
        </button>
      </div>

      <div className="flex-1 min-w-0 flex items-center gap-2">
        {editing ? (
          <form
            className="flex-1 min-w-0"
            onSubmit={(e) => {
              e.preventDefault();
              handleSave();
            }}
          >
            <input
              ref={(node) => {
                if (node) {
                  node.focus();
                }
              }}
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onBlur={handleSave}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  setEditName(name);
                  setEditing(false);
                }
              }}
              className="w-full p-0 bg-transparent border-0 outline-none text-[15px]"
            />
          </form>
        ) : (
          <div className="flex-1 min-w-0 flex items-center gap-1">
            <span
              className="truncate text-[15px] font-medium cursor-pointer"
              onClick={() => {
                setEditName(name);
                setEditing(true);
              }}
              title="Click to edit list name"
            >
              {name}
            </span>
          </div>
        )}

        <div className="flex items-center gap-1 shrink-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="inline-flex items-center justify-center w-7 h-7 rounded-md text-muted opacity-100 sm:opacity-0 sm:group-hover/sec:opacity-100 sm:data-[state=open]:opacity-100 hover:bg-tint/10 hover:text-fg cursor-pointer"
                aria-label={`Actions for list ${name}`}
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-36">
              <DropdownMenuItem
                onClick={onDelete}
                className="gap-2 text-danger focus:bg-danger/10 focus:text-danger cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete List</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}

function ListSection({
  list,
  todos,
  dragging,
  allLists,
}: {
  list: List;
  todos: Todo[];
  dragging: boolean;
  allLists: List[];
}) {
  const updateList = useUpdateList();
  const deleteList = useDeleteList();

  const [collapsedOverride, setCollapsedOverride] = useState<boolean | null>(
    null,
  );

  const collapsed = dragging
    ? false
    : (collapsedOverride ?? todos.length === 0);

  return (
    <div className="flex flex-col mt-2">
      <SectionHeader
        name={list.name}
        collapsed={collapsed}
        onToggleCollapsed={() => setCollapsedOverride(!collapsed)}
        onUpdateName={(newName) =>
          updateList.mutate({ id: list.id, name: newName })
        }
        onDelete={() => deleteList.mutate(list.id)}
      />

      {!collapsed && (
        <>
          <DropZone
            id={list.id}
            className={cn("mb-1", dragging && "min-h-10")}
          >
            {todos.map((todo, index) => (
              <SortableTodoRow
                key={todo.id}
                todo={todo}
                index={index}
                group={list.id}
                showList={false}
              />
            ))}

            {todos.length === 0 && dragging && (
              <p className="py-2.5 text-muted pl-9.5 text-center">
                Drop a todo here
              </p>
            )}
          </DropZone>

          <AddTodoBar
            view={{ kind: "list", id: list.id }}
            defaultProjectId={list.projectId}
            lists={allLists}
            showMobileFab={false}
            inline
          />
        </>
      )}
    </div>
  );
}

type ProjectListsProps = {
  projectId: string;
  lists: List[];
  todos: Todo[];
};

export function ProjectLists({ projectId, lists, todos }: ProjectListsProps) {
  const createList = useCreateList();
  const moveTodoToList = useMoveTodoToList();

  const [listDraft, setListDraft] = useState("");
  const [addingList, setAddingList] = useState(false);

  const [groups, setGroups] = useState<Groups>(() => toGroups(lists, todos));
  const [activeId, setActiveId] = useState<string | null>(null);
  const beforeDrag = useRef<Groups | null>(null);

  const listIds = lists.map((list) => list.id).join(",");
  useEffect(() => {
    setGroups(toGroups(lists, todos));
    // lists is rebuilt by the caller on every render, so key off its ids
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listIds, todos]);

  const items = useMemo(
    () => new Map(todos.map((todo) => [todo.id, todo])),
    [todos],
  );
  const activeTodo = activeId ? items.get(activeId) : null;

  const todosOf = (group: string) =>
    (groups[group] ?? [])
      .map((id) => items.get(id))
      .filter((todo): todo is Todo => Boolean(todo));

  const restore = () => {
    if (beforeDrag.current) setGroups(beforeDrag.current);
  };

  return (
    <DragDropProvider
      onDragStart={(event) => {
        beforeDrag.current = cloneGroups(groups);
        setActiveId(event.operation.source?.id as string);
      }}
      onDragOver={(event) =>
        setGroups((current) => move(current, event) as Groups)
      }
      onDragEnd={(event) => {
        const id = activeId;
        setActiveId(null);
        if (!id) return;

        if (event.canceled) {
          restore();
          beforeDrag.current = null;
          return;
        }

        const previous = beforeDrag.current;
        beforeDrag.current = null;

        const group = Object.keys(groups).find((key) =>
          groups[key].includes(id),
        );
        if (!group) return;

        const position = groups[group].indexOf(id);
        const listId = group === NO_LIST ? null : group;
        const todo = items.get(id);
        const unchanged =
          todo &&
          (todo.listId ?? null) === listId &&
          previous?.[group]?.indexOf(id) === position;
        if (unchanged) return;

        moveTodoToList.mutate(
          { id, listId, position },
          { onError: () => previous && setGroups(previous) },
        );
      }}
    >
      <section>
        <DropZone id={NO_LIST} className={cn("mb-1", activeId && "min-h-10")}>
          {todosOf(NO_LIST).map((todo, index) => (
            <SortableTodoRow
              key={todo.id}
              todo={todo}
              index={index}
              group={NO_LIST}
            />
          ))}
          {activeId && groups[NO_LIST]?.length === 0 && (
            <p className="py-2.5 text-muted pl-9.5 text-center">
              Drop a todo here
            </p>
          )}
        </DropZone>

        <AddTodoBar
          view={{ kind: "project", id: projectId }}
          lists={lists}
          showMobileFab={false}
          inline
        />

        {lists.map((list) => (
          <ListSection
            key={list.id}
            list={list}
            todos={todosOf(list.id)}
            dragging={Boolean(activeId)}
            allLists={lists}
          />
        ))}

        {addingList ? (
          <div className="flex items-center mt-6">
            <span className="w-5 h-5 shrink-0" />
            <form
              className="flex-1 min-w-0"
              onSubmit={(e) => {
                e.preventDefault();
                const name = listDraft.trim();
                if (!name) {
                  setAddingList(false);
                  return;
                }
                createList.mutate({ name, projectId });
                setListDraft("");
              }}
            >
              <input
                autoFocus
                value={listDraft}
                onChange={(e) => setListDraft(e.target.value)}
                onKeyDown={(e) => e.key === "Escape" && setAddingList(false)}
                onBlur={() => !listDraft.trim() && setAddingList(false)}
                placeholder="List name"
                aria-label="New list name"
                className={fieldClass}
              />
            </form>
          </div>
        ) : (
          <div className="flex items-center my-2 max-lg:mt-4">
            <span className="w-5 h-5 shrink-0" />
            <div className="flex-1 min-w-0 flex items-center gap-4 group h-5">
              <div className="flex-1 h-px bg-line flex md:hidden group-hover:flex" />
              <button
                type="button"
                className="text-xs font-medium text-muted hover:text-white transition-colors py-1 cursor-pointer shrink-0 md:hidden group-hover:flex"
                onClick={() => setAddingList(true)}
              >
                + New List
              </button>
              <div className="flex-1 h-px bg-line hover lg:hidden group-hover:flex" />
            </div>
          </div>
        )}
      </section>

      <DragOverlay>
        {activeTodo ? (
          <div className="rounded-xl border border-line bg-raised px-3 py-2 shadow-lg">
            <p className="truncate text-sm font-medium text-fg">
              {activeTodo.title}
            </p>
          </div>
        ) : null}
      </DragOverlay>
    </DragDropProvider>
  );
}
