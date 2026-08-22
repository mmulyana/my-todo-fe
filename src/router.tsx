import { createBrowserRouter, Navigate } from 'react-router-dom'

import { AppLayout } from './layouts/app-layout'
import TodayPage from './pages/today-page'
import ImportantPage from './pages/important-page'
import AllPage from './pages/all-page'
import ProjectPage from './pages/project-page'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <Navigate to="/today" replace /> },
      { path: 'today', element: <TodayPage /> },
      { path: 'important', element: <ImportantPage /> },
      { path: 'all', element: <AllPage /> },
      { path: 'projects/:projectId', element: <ProjectPage /> },
      { path: '*', element: <Navigate to="/today" replace /> },
    ],
  },
])
