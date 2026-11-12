import { useSearchParams } from 'react-router-dom'
import { Infinity as InfinityIcon } from 'lucide-react'
import { PageShell } from '../components/page-shell'
import { TodoRow } from '../components/todo-row'
import { TodoListSkeleton } from '../components/todo-list-skeleton'
import { TodoFilterMenu } from '../components/todo-filter-menu'
import {
  CROSS_PROJECT_CATEGORIES,
  useProjectFilterOptions,
  useTodoFilters,
} from '../hooks/useTodoFilters'
import { applyFilters } from '@/lib/todo-filters'
import { CollapsibleSection } from '../components/collapsible-section'
import { useInfiniteTodos } from '../hooks/useTodos'
import { DesktopTodoInput } from '../components/desktop-todo-input'
import type { TodoFilter, View } from '../types'
import type { TodoFilters } from '@/lib/todo-filters'

// note: halaman All memisahkan todo selesai ke section sendiri, jadi tanpa filter completed
const ALL_CATEGORIES = CROSS_PROJECT_CATEGORIES.filter(
  (category) => category !== 'completed',
)

type LoadMoreProps = { hasMore: boolean; loading: boolean; onClick: () => void }

function LoadMore({ hasMore, loading, onClick }: LoadMoreProps) {
  if (!hasMore) return null
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className="self-start ml-5 my-2 text-sm text-muted hover:text-fg transition-colors disabled:opacity-50"
    >
      {loading ? 'Loading…' : 'Load more'}
    </button>
  )
}

// note: baru di-mount saat section dibuka, jadi completed todos tidak di-fetch sebelum itu
function CompletedTodos({
  filter,
  filters,
}: {
  filter: TodoFilter
  filters: TodoFilters
}) {
  const { data = [], hasNextPage, isFetchingNextPage, fetchNextPage, isPending } =
    useInfiniteTodos({ ...filter, completed: true }, { staleTime: 0 })
  const todos = applyFilters(
    data.filter((t) => t.completed),
    filters,
  )

  return (
    <>
      {isPending && <TodoListSkeleton rows={3} />}
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

const ALL_VIEW: View = { kind: 'smart', id: 'all' }

export default function AllPage() {
  const [params] = useSearchParams()
  const query = (params.get('q') ?? '').trim()

  const filter: TodoFilter = {
    ...(query ? { q: query } : { view: 'ALL' }),
    order: 'DESC',
  }
  const {
    data: todos = [],
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    isLoading,
  } = useInfiniteTodos({ ...filter, completed: false })
  const [filters, setFilters] = useTodoFilters('page:all')
  const projectOptions = useProjectFilterOptions()
  // note: filter dijalankan di klien atas todo yang sudah dimuat, todo di halaman yang belum di-load lewat "Load more" belum ikut tersaring
  const openTodos = todos.filter((todo) => !todo.completed)

  return (
    <PageShell
      title={query ? `Searching "${query}"` : 'All'}
      icon={<InfinityIcon size={20} className="text-accent" />}
      footer={null}
      actions={
        !query ? (
          <TodoFilterMenu
            todos={openTodos}
            categories={ALL_CATEGORIES}
            projects={projectOptions}
            filters={filters}
            onChange={setFilters}
          />
        ) : null
      }
    >
      {!query && <DesktopTodoInput view={ALL_VIEW} />}
      {isLoading ? (
        <TodoListSkeleton />
      ) : (
        applyFilters(openTodos, filters).map((todo) => (
          <TodoRow key={todo.id} todo={todo} showProject skipInvalidate />
        ))
      )}
      <LoadMore
        hasMore={Boolean(hasNextPage)}
        loading={isFetchingNextPage}
        onClick={() => fetchNextPage()}
      />

      <CollapsibleSection className="mt-4" label="Completed">
        <CompletedTodos filter={filter} filters={filters} />
      </CollapsibleSection>
    </PageShell>
  )
}
