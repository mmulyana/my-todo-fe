import { useEffect } from 'react'
import { Outlet, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { useAtom } from 'jotai'
import { NuqsAdapter } from 'nuqs/adapters/react-router/v7'
import { DetailPane } from '../components/detail-pane'
import { BulkActionBar } from '@/components/bulk-action-bar'
import { SettingsDialog } from '@/components/settings/settings-dialog'
import { parseSettingsTab, type SettingsTab } from '@/lib/settings-tabs'
import { CommandPalette } from '@/components/command-palette'
import { Sidebar } from '@/components/sidebar'
import { NewTaskDialog } from '@/components/new-task-dialog'
import { NewTaskFab } from '@/components/new-task-fab'
import { DocumentTitleTimer } from '@/components/document-title-timer'
import { isKanbanLocation } from '@/components/project-view-tabs'
import { newTaskAtom, searchOpenAtom, sidebarOpenAtom } from '@/atoms/layout'
import { useIsDesktop } from '@/hooks/useMediaQuery'
import { currentSearchParams } from '@/lib/search-params'

function SidebarEffects() {
  const { pathname } = useLocation()
  const [open, setOpen] = useAtom(sidebarOpenAtom)

  useEffect(() => {
    setOpen(false)
  }, [pathname, setOpen])

  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, setOpen])

  return null
}

function SearchHost() {
  const [open, setOpen] = useAtom(searchOpenAtom)
  const [, setParams] = useSearchParams()
  const navigate = useNavigate()

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen((v) => !v)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [setOpen])

  const openTodo = (id: string) => {
    if (!window.matchMedia('(min-width: 1024px)').matches) {
      navigate(`/todo/${id}`)
      return
    }
    setParams(
      () => {
        const next = currentSearchParams()
        next.set('todo', id)
        return next
      },
      { replace: true },
    )
  }

  return (
    <CommandPalette open={open} onOpenChange={setOpen} onOpenTodo={openTodo} />
  )
}

function NewTaskHost() {
  const [state, setState] = useAtom(newTaskAtom)
  const isDesktop = useIsDesktop()

  if (isDesktop) return null

  return (
    <NewTaskDialog
      open={state.open}
      onOpenChange={(open) => setState((prev) => ({ ...prev, open }))}
      defaultProjectId={state.projectId}
      defaultListId={state.listId}
      defaultMyDay={state.myDay}
      defaultImportant={state.important}
    />
  )
}

function SettingsHost() {
  const [params, setParams] = useSearchParams()
  const tab = parseSettingsTab(params.get('settings'))

  const setTab = (next: SettingsTab | null) =>
    setParams(
      () => {
        const params = currentSearchParams()
        if (next) params.set('settings', next)
        else params.delete('settings')
        return params
      },
      { replace: next === null || tab !== null },
    )

  return (
    <SettingsDialog
      tab={tab}
      onTabChange={setTab}
      onClose={() => setTab(null)}
    />
  )
}

function DetailPaneHost() {
  const [params, setParams] = useSearchParams()
  const { pathname } = useLocation()
  const todoId = params.get('todo')

  if (!todoId || isKanbanLocation(pathname, params.get('view'))) return null

  const close = () =>
    setParams(
      () => {
        const next = currentSearchParams()
        next.delete('todo')
        return next
      },
      { replace: true },
    )

  return <DetailPane todoId={todoId} onClose={close} />
}

export function AppLayout() {
  return (
    <NuqsAdapter>
      <div className="h-dvh w-dvw overflow-hidden bg-bg text-fg text-[15px] leading-normal flex lg:grid lg:grid-cols-[280px_1fr]">
        <DocumentTitleTimer />
        <SidebarEffects />
        <Sidebar />
        <NewTaskHost />
        <NewTaskFab />
        <BulkActionBar />
        <SettingsHost />
        <SearchHost />

        <div className="flex-1 min-w-0 h-full p-2 lg:p-3 lg:pl-0 flex gap-1 overflow-hidden">
          <Outlet />
          <DetailPaneHost />
        </div>
      </div>
    </NuqsAdapter>
  )
}
