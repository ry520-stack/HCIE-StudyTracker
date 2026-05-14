import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import RequireAuth from './components/RequireAuth';
import DashboardLayout from './layouts/DashboardLayout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import NotesPage from './pages/NotesPage';
import FocusPage from './pages/FocusPage';
import TasksPage from './pages/TasksPage';
import CheckinPage from './pages/CheckinPage';
import SettingsPage from './pages/SettingsPage';

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <HashRouter>
          <Routes>
            {/* 公开路由 */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* 受保护路由 */}
            <Route element={<RequireAuth />}>
              <Route element={<DashboardLayout />}>
                <Route index element={<DashboardPage />} />
                <Route path="/notes" element={<NotesPage />} />
                <Route path="/focus" element={<FocusPage />} />
                <Route path="/tasks" element={<TasksPage />} />
                <Route path="/checkin" element={<CheckinPage />} />
                <Route path="/settings" element={<SettingsPage />} />
              </Route>
            </Route>

            {/* 兜底 */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </HashRouter>
      </ThemeProvider>
    </AuthProvider>
  );
}
