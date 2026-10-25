import { useSearchParams } from 'react-router-dom'
import { CheckSquare } from 'lucide-react'
import { PageShell } from '../components/page-shell'
import { TodoRow } from '../components/todo-row'
import { AddTodoBar } from '../components/add-todo-bar'
import { CollapsibleSection } from '../components/collapsible-section'
import { useInfiniteTodos } from '../hooks/useTodos'
import { useLists } from '../hooks/useLists'
import type { TodoFilter, View } from '../types'

const view: View = { kind: 'smart', id: 'all' }

type LoadMoreProps = { hasMore: boolean; loading: boolean; onClick: () => void }

function LoadMore({ hasMore, loading, onClick }: LoadMoreProps) {
  if (!hasMore) return null
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className="mx-5 my-2 text-sm text-muted hover:text-fg transition-colors disabled:opacity-50"
    >
      {loading ? 'Loading…' : 'Load more'}
    </button>
  )
}

// note: baru di-mount saat section dibuka, jadi completed todos tidak di-fetch sebelum itu
function CompletedTodos({ filter }: { filter: TodoFilter }) {
  const { data = [], hasNextPage, isFetchingNextPage, fetchNextPage, isPending } =
    useInfiniteTodos({ ...filter, completed: true }, { staleTime: 0 })
  const todos = data.filter((t) => t.completed)

  return (
    <>
      {isPending && <p className="mx-5 my-2 text-sm text-muted">Loading…</p>}
      {todos.map((todo) => (
        <TodoRow key={todo.id} todo={todo} showProject skipInvalidate />
      ))}
      <LoadMore
        hasMore={Boolean(hasNextPage)}
        loading={isFetchingNextPage}
        onClick={() => fetchNextPage()}
      />
    </>
  )
}

export default function AllPage() {
  const [params] = useSearchParams()
  const query = (params.get('q') ?? '').trim()

  const filter: TodoFilter = query ? { q: query } : { view: 'ALL' }
  const {
    data: todos = [],
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useInfiniteTodos({ ...filter, completed: false })
  const { data: lists = [] } = useLists()

  return (
    <PageShell
      selectable
      title={query ? `Searching "${query}"` : 'All'}
      icon={<CheckSquare size={20} className="text-accent" />}
      footer={null}
    >
      {!query && <AddTodoBar view={view} lists={lists} showMobileFab={false} inline />}

      {todos
        .filter((todo) => !todo.completed)
        .map((todo) => (
          <TodoRow key={todo.id} todo={todo} showProject skipInvalidate />
        ))}
      <LoadMore
        hasMore={Boolean(hasNextPage)}
        loading={isFetchingNextPage}
        onClick={() => fetchNextPage()}
      />

      <CollapsibleSection className="mt-4" label="Completed">
        <CompletedTodos filter={filter} />
      </CollapsibleSection>
    </PageShell>
  )
}
