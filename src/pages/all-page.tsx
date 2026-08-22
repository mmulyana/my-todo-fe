import { useSearchParams } from 'react-router-dom'
import { CheckSquare } from 'lucide-react'
import { PageShell } from '../components/page-shell'
import { TodoRow } from '../components/todo-row'
import { AddTodoBar } from '../components/add-todo-bar'
import { useTodos } from '../hooks/useTodos'
import { useLists } from '../hooks/useLists'
import type { View } from '../types'

const view: View = { kind: 'smart', id: 'all' }

export default function AllPage() {
  const [params] = useSearchParams()
  const query = (params.get('q') ?? '').trim()

  const { data: todos = [] } = useTodos(query ? { q: query } : { view: 'ALL' })
  const { data: lists = [] } = useLists()

  return (
    <PageShell
      title={query ? `Searching "${query}"` : 'All'}
      icon={<CheckSquare size={20} className="text-accent" />}
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
