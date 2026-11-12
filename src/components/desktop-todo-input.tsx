import { INLINE_INPUT_CLASS, TodoInput } from "./todo-input";
import type { View } from "../types";

export function DesktopTodoInput({ view }: { view: View }) {
  return (
    <div className="hidden lg:block mb-1">
      <TodoInput view={view} hideComboboxes className={INLINE_INPUT_CLASS} />
    </div>
  );
}
