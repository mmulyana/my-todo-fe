import { TodoInput } from './todo-input'
import type { List, View } from '../types'

type AddTodoBarProps = {
  view: View
  lists: List[]
}

export function AddTodoBar({ view, lists }: AddTodoBarProps) {
  return (
    <div className="shrink-0 p-4 bg-surface border-t border-line/60">
      <TodoInput view={view} lists={lists} />
    </div>
  )
}
