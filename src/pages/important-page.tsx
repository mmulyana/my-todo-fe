import { useSearchParams } from 'react-router-dom'
import { Star } from 'lucide-react'
import { PageShell } from '../components/page-shell'
import { TodoRow } from '../components/todo-row'
import { AddTodoBar } from '../components/add-todo-bar'
import { useTodos } from '../hooks/useTodos'
import { useLists } from '../hooks/useLists'
import type { View } from '../types'

const view: View = { kind: 'smart', id: 'important' }

export default function ImportantPage() {
  const [params] = useSearchParams()
  const query = (params.get('q') ?? '').trim()

  const { data: todos = [] } = useTodos(
    query ? { q: query } : { view: 'IMPORTANT' },
  )
  const { data: lists = [] } = useLists()

  return (
    <PageShell
      title={query ? `Searching "${query}"` : 'Important'}
      icon={<Star size={20} className="text-amber-400 fill-amber-400" />}
      footer={query ? null : <AddTodoBar view={view} lists={lists} />}
    >
      {todos.map((todo) => (
        <TodoRow
          key={todo.id}
          todo={todo}
          showProject
        />
      ))}
    </PageShell>
  )
}
