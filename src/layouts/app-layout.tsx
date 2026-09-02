import { createContext, useContext, useEffect, useState } from 'react'
import { Outlet, useLocation, useSearchParams } from 'react-router-dom'
import { DetailPane } from '../components/detail-pane'
import { Sidebar } from '@/components/sidebar'

type SidebarContextValue = {
  openSidebar: () => void
}

const SidebarContext = createContext<SidebarContextValue | null>(null)

export function useSidebarContext() {
  const ctx = useContext(SidebarContext)
  if (!ctx) throw new Error('useSidebarContext must be used within AppLayout')
  return ctx
}

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
    <SidebarContext.Provider value={{ openSidebar: () => setSidebarOpen(true) }}>
      <div className="h-screen w-screen overflow-hidden bg-bg text-fg text-[15px] leading-normal flex lg:grid lg:grid-cols-[280px_1fr]">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <div className="flex-1 min-w-0 h-full p-2 lg:p-3 lg:pl-2 flex gap-1 overflow-hidden">
          <Outlet />
          {openTodoId && (
            <DetailPane key={openTodoId} todoId={openTodoId} onClose={closeTodo} />
          )}
        </div>
      </div>
    </SidebarContext.Provider>
  )
}
