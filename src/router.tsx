import { createBrowserRouter, Navigate } from "react-router-dom";
import { AuthGuard } from "./components/auth-guard";
import { AppLayout } from "./layouts/app-layout";
import ImportantPage from "./pages/important-page";
import RegisterPage from "./pages/register-page";
import ProjectPage from "./pages/project-page";
import TodayPage from "./pages/today-page";
import LoginPage from "./pages/login-page";
import AllPage from "./pages/all-page";
import TodoDetailPage from "./pages/todo-detail-page";
import SettingsPage from "./pages/settings-page";

export const router = createBrowserRouter([
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/register",
    element: <RegisterPage />,
  },
  {
    path: "/",
    element: <AuthGuard />,
    children: [
      {
        path: "/",
        element: <AppLayout />,
        children: [
          { index: true, element: <Navigate to="/today" replace /> },
          { path: "today", element: <TodayPage /> },
          { path: "important", element: <ImportantPage /> },
          { path: "all", element: <AllPage /> },
          { path: "projects/:projectId", element: <ProjectPage /> },
          { path: "todo/:todoId", element: <TodoDetailPage /> },
          { path: "settings", element: <SettingsPage /> },
          { path: "*", element: <Navigate to="/today" replace /> },
        ],
      },
    ],
  },
]);
