import { useSearchParams } from 'react-router-dom'
import { CheckSquare } from 'lucide-react'
import { PageShell } from '../components/page-shell'
import { TodoRow } from '../components/todo-row'
import { AddTodoBar } from '../components/add-todo-bar'
import { CollapsibleSection } from '../components/collapsible-section'
import { useActiveTodos, useCompletedTodos } from '../hooks/useTodos'
import { useLists } from '../hooks/useLists'
import type { View } from '../types'

const view: View = { kind: 'smart', id: 'all' }

export default function AllPage() {
  const [params] = useSearchParams()
  const query = (params.get('q') ?? '').trim()

  const filter = query ? { q: query } : { view: 'ALL' as const }
  const { data: activeTodos = [] } = useActiveTodos(filter)
  const { data: completedTodos = [] } = useCompletedTodos(filter)
  const { data: lists = [] } = useLists()

  return (
    <PageShell
      title={query ? `Searching "${query}"` : 'All'}
      icon={<CheckSquare size={20} className="text-accent" />}
      footer={null}
    >
      {!query && <AddTodoBar view={view} lists={lists} showMobileFab={false} inline />}

      {activeTodos.map((todo) => (
        <TodoRow key={todo.id} todo={todo} showProject skipInvalidate />
      ))}

      <CollapsibleSection className="mt-4" label="Completed" count={completedTodos.length}>
        {completedTodos.map((todo) => (
          <TodoRow key={todo.id} todo={todo} showProject skipInvalidate />
        ))}
      </CollapsibleSection>
    </PageShell>
  )
}
