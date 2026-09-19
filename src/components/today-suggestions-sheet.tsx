import { Lightbulb, Plus, X } from "lucide-react";
import { TodoRow } from "./todo-row";
import { useUpdateTodo } from "../hooks/useTodos";
import type { Todo } from "../types";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";

type TodaySuggestionsSheetProps = {
  todos: Todo[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function TodaySuggestionsSheet({
  todos,
  open,
  onOpenChange,
}: TodaySuggestionsSheetProps) {
  const updateTodo = useUpdateTodo();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        hideClose
        aria-describedby={undefined}
        className="w-[80dvw] min-w-[80dvw] border-0 bg-transparent p-3 shadow-none sm:w-[540px] sm:min-w-[540px]"
      >
        <SheetTitle className="sr-only">Saran task untuk Today</SheetTitle>
        <div className="flex min-h-0 flex-1 flex-col rounded-2xl bg-surface p-0 shadow-lg">
          <div className="flex h-[46px] px-3 shrink-0 items-center justify-between gap-3 border-b border-line">
            <div className="flex items-center gap-2">
              <Lightbulb size={17} className="text-warn" />
              <h2 className="text-sm font-medium text-fg">Suggestions</h2>
            </div>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-tint/10 hover:text-fg"
              aria-label="Close suggestions"
            >
              <X size={17} />
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto py-2 pl-2">
            {todos.map((todo) => (
              <div
                key={todo.id}
                className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-tint/5"
              >
                <div className="min-w-0 flex-1">
                  <TodoRow todo={todo} hideDueDate hideGrab showList={false} />
                </div>
                <button
                  type="button"
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-line px-2.5 py-1.5 text-xs font-medium text-fg hover:bg-tint/10 disabled:opacity-60"
                  onClick={() =>
                    updateTodo.mutate({ id: todo.id, patch: { myDay: true } })
                  }
                  disabled={updateTodo.isPending}
                >
                  <Plus size={14} />
                  Add
                </button>
              </div>
            ))}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
