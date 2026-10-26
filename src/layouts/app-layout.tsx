import { createContext, useContext, useEffect, useState } from 'react'
import { Outlet, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { DetailPane } from '../components/detail-pane'
import { BulkActionBar } from '@/components/bulk-action-bar'
import { SettingsDialog } from '@/components/settings/settings-dialog'
import { parseSettingsTab, type SettingsTab } from '@/lib/settings-tabs'
import { CommandPalette } from '@/components/command-palette'
import { Sidebar } from '@/components/sidebar'
import { DocumentTitleTimer } from '@/components/document-title-timer'
import { isKanbanLocation } from '@/components/project-view-tabs'

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
  const [searchOpen, setSearchOpen] = useState(false)
  const navigate = useNavigate()
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

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setSearchOpen((v) => !v)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  const openTodo = (id: string) => {
    if (!window.matchMedia('(min-width: 1024px)').matches) {
      navigate(`/todo/${id}`)
      return
    }
    setParams(
      (prev) => {
        prev.set('todo', id)
        return prev
      },
      { replace: true },
    )
  }

  const settingsTab = parseSettingsTab(params.get('settings'))
  const setSettingsTab = (tab: SettingsTab | null) =>
    setParams(
      (prev) => {
        if (tab) prev.set('settings', tab)
        else prev.delete('settings')
        return prev
      },
      { replace: tab === null || settingsTab !== null },
    )

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
      <div className="h-dvh w-dvw overflow-hidden bg-bg text-fg text-[15px] leading-normal flex lg:grid lg:grid-cols-[280px_1fr]">
        <DocumentTitleTimer />
        <Sidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          onSearch={() => setSearchOpen(true)}
        />
        <BulkActionBar />
        <SettingsDialog
          tab={settingsTab}
          onTabChange={setSettingsTab}
          onClose={() => setSettingsTab(null)}
        />
        <CommandPalette
          open={searchOpen}
          onOpenChange={setSearchOpen}
          onOpenTodo={openTodo}
        />

        <div className="flex-1 min-w-0 h-full p-2 lg:p-3 lg:pl-2 flex gap-1 overflow-hidden">
          <Outlet />
          {openTodoId && !isKanbanLocation(pathname, params.get('view')) && (
            <DetailPane todoId={openTodoId} onClose={closeTodo} />
          )}
        </div>
      </div>
    </SidebarContext.Provider>
  )
}
