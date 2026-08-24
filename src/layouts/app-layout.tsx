import { useEffect, useState } from 'react'
import { Outlet, useLocation, useSearchParams } from 'react-router-dom'
import { Menu } from 'lucide-react'
import { DetailPane } from '../components/detail-pane'
import { Sidebar } from '@/components/sidebar'

export function AppLayout() {
  const [params, setParams] = useSearchParams()
  const openTodoId = params.get('todo')

  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { pathname } = useLocation()

  useEffect(() => {
    setSidebarOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!sidebarOpen) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSidebarOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [sidebarOpen])

  const closeTodo = () =>
    setParams(
      (prev) => {
        prev.delete('todo')
        return prev
      },
      { replace: true },
    )

  return (
    <div className="h-screen w-screen overflow-hidden bg-bg text-fg text-[15px] leading-normal grid grid-rows-[auto_1fr] lg:grid-rows-none lg:grid-cols-[280px_1fr]">
      <div className="flex items-center gap-3 h-14 px-4 shrink-0 lg:hidden">
        <button
          type="button"
          onClick={() => setSidebarOpen(true)}
          aria-label="Open menu"
          aria-expanded={sidebarOpen}
          className="p-1.5 -ml-1.5 rounded-lg text-muted hover:text-fg hover:bg-white/5 transition-colors cursor-pointer"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 min-w-0 h-full p-2 lg:p-3 lg:pl-2 flex gap-1 overflow-hidden">
        <Outlet />
        {openTodoId && (
          <DetailPane key={openTodoId} todoId={openTodoId} onClose={closeTodo} />
        )}
      </div>
    </div>
  )
}
