import { useState } from 'react'
import { Plus } from 'lucide-react'
import { TodoInput } from './todo-input'
import type { List, View } from '../types'

type AddTodoBarProps = {
  view: View
  lists: List[]
}

export function AddTodoBar({ view, lists }: AddTodoBarProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <div className="hidden lg:block shrink-0 p-4 bg-surface border-t border-line/60">
        <TodoInput view={view} lists={lists} />
      </div>

      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Add task"
          className="lg:hidden fixed bottom-6 right-6 z-40 grid place-items-center w-13 h-13 rounded-full bg-accent text-white shadow-lg active:scale-95 transition-transform outline-none focus:outline-none focus-visible:outline-none"
        >
          <Plus size={24} strokeWidth={2.5} />
        </button>
      )}

      {open && (
        <div className="lg:hidden fixed inset-x-0 bottom-0 z-40 p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] bg-surface border-t border-line/60">
          <TodoInput
            view={view}
            lists={lists}
            autoFocus
            onSuccess={() => setOpen(false)}
            onCancel={() => setOpen(false)}
            className="focus-within:border-line outline-none [&_input]:outline-none [&_input]:focus:outline-none [&_input]:focus-visible:outline-none"
          />
        </div>
      )}
    </>
  )
}
