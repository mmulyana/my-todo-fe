import { useState } from "react";
import { TodoRow } from "./todo-row";
import { TodoInput } from "./todo-input";
import { useCreateList, useDeleteList, useUpdateList } from "../hooks/useLists";
import type { List, Todo } from "../types";
import {
  ChevronDown,
  ChevronRight,
  MoreHorizontal,
  Trash2,
  Plus,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const fieldClass =
  "w-full my-1 py-2 px-3 rounded-lg bg-bg text-[15px] outline-none focus:border-accent";

function SectionHeader({
  name,
  collapsed,
  onToggleCollapsed,
  onUpdateName,
  onDelete,
  onAddTodo,
}: {
  name: string;
  collapsed: boolean;
  onToggleCollapsed: () => void;
  onUpdateName: (newName: string) => void;
  onDelete: () => void;
  onAddTodo: () => void;
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
          className="hidden group-hover:flex items-center w-4 h-4 text-muted hover:text-fg transition-colors"
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
          <button
            type="button"
            className="inline-flex items-center justify-center w-7 h-7 rounded-md text-muted opacity-0 group-hover/sec:opacity-100 focus-visible:opacity-100 hover:bg-white/10 hover:text-fg cursor-pointer"
            onClick={onAddTodo}
            aria-label={`Add a todo in ${name}`}
            title={`Add a todo in ${name}`}
          >
            <Plus className="w-4 h-4" />
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="inline-flex items-center justify-center w-7 h-7 rounded-md text-muted opacity-0 group-hover/sec:opacity-100 data-[state=open]:opacity-100 hover:bg-white/10 hover:text-fg cursor-pointer"
                aria-label={`Actions for list ${name}`}
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-36">
              <DropdownMenuItem
                onClick={onDelete}
                className="gap-2 text-red-400 focus:bg-red-500/10 focus:text-red-400 cursor-pointer"
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

function ListSection({ list, todos }: { list: List; todos: Todo[] }) {
  const updateList = useUpdateList();
  const deleteList = useDeleteList();

  const [collapsed, setCollapsed] = useState(false);
  const [adding, setAdding] = useState(false);

  const openTodoField = () => {
    setCollapsed(false);
    setAdding(true);
  };

  return (
    <div className="flex flex-col mt-2">
      <SectionHeader
        name={list.name}
        collapsed={collapsed}
        onToggleCollapsed={() => setCollapsed((v) => !v)}
        onUpdateName={(newName) =>
          updateList.mutate({ id: list.id, name: newName })
        }
        onDelete={() => deleteList.mutate(list.id)}
        onAddTodo={openTodoField}
      />

      {!collapsed && (
        <div className="flex flex-col">
          {todos.map((todo) => (
            <TodoRow key={todo.id} todo={todo} />
          ))}

          {adding && (
            <div className="py-1 pl-5">
              <TodoInput
                defaultProjectId={list.projectId}
                defaultListId={list.id}
                autoFocus
                hideComboboxes
                onCancel={() => setAdding(false)}
                onSuccess={() => setAdding(false)}
                placeholder={`Add a task to ${list.name}`}
                className="p-0 focus-within:border-none bg-transparent border-none shadow-none"
              />
            </div>
          )}

          {todos.length === 0 && !adding && (
            <p className="py-2.5 text-muted pl-9.5 text-center">
              No todos in this list yet.
            </p>
          )}
        </div>
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

  const [listDraft, setListDraft] = useState("");
  const [addingList, setAddingList] = useState(false);

  return (
    <section className="space-y-5">
      {lists.map((list) => (
        <ListSection
          key={list.id}
          list={list}
          todos={todos.filter((t) => t.listId === list.id && !t.completed)}
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
        <div className="flex items-center my-2">
          <span className="w-5 h-5 shrink-0" />
          <div className="flex-1 min-w-0 flex items-center gap-4 group h-5">
            <div className="flex-1 h-px bg-line hidden group-hover:flex" />
            <button
              type="button"
              className="text-xs font-medium text-muted hover:text-accent transition-colors py-1 cursor-pointer shrink-0 hidden group-hover:flex"
              onClick={() => setAddingList(true)}
            >
              + New List
            </button>
            <div className="flex-1 h-px bg-line hidden group-hover:flex" />
          </div>
        </div>
      )}
    </section>
  );
}
