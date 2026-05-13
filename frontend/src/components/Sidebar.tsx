import { NavLink } from 'react-router-dom';
import { StickyNote, Timer, CheckSquare, LayoutDashboard, CalendarCheck, Settings } from 'lucide-react';
import { cn } from '../lib/utils';

const NAV_ITEMS = [
  { to: '/', label: '概览', icon: LayoutDashboard },
  { to: '/tasks', label: '任务', icon: CheckSquare },
  { to: '/notes', label: '笔记', icon: StickyNote },
  { to: '/focus', label: '专注', icon: Timer },
  { to: '/checkin', label: '打卡', icon: CalendarCheck },
  { to: '/settings', label: '设置', icon: Settings },
];

export default function Sidebar() {
  return (
    <aside className="flex h-full w-60 flex-col border-r border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
      <div className="flex h-16 items-center gap-2 border-b border-gray-200 px-6 dark:border-gray-700">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-sm font-bold text-white">H</div>
        <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">HCIE Tracker</span>
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} end={to==='/'}
            className={({ isActive }) => cn('flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors', isActive ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800')}>
            <Icon size={18} />{label}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-gray-200 p-4 text-center text-xs text-gray-400 dark:border-gray-700 dark:text-gray-500">v0.2</div>
    </aside>
  );
}
