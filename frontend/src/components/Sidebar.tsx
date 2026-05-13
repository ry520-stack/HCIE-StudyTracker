import { NavLink } from 'react-router-dom';
import { StickyNote, Timer, CheckSquare, LayoutDashboard, CalendarCheck, Settings, X } from 'lucide-react';
import { cn } from '../lib/utils';

const NAV_ITEMS = [
  { to: '/', label: '概览', icon: LayoutDashboard },
  { to: '/tasks', label: '任务', icon: CheckSquare },
  { to: '/notes', label: '笔记', icon: StickyNote },
  { to: '/focus', label: '专注', icon: Timer },
  { to: '/checkin', label: '打卡', icon: CalendarCheck },
  { to: '/settings', label: '设置', icon: Settings },
];

export default function Sidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const sidebar = (
    <aside className="flex h-full w-60 flex-col border-r border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
      <div className="flex h-16 items-center justify-between border-b border-gray-200 px-4 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-sm font-bold text-white">H</div>
          <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">StudyTracker</span>
        </div>
        <button onClick={onClose} className="md:hidden rounded p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800">
          <X size={20} />
        </button>
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} end={to==='/'} onClick={onClose}
            className={({ isActive }) => cn('flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors', isActive ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800')}>
            <Icon size={18} />{label}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-gray-200 p-4 text-center text-xs text-gray-400 dark:border-gray-700 dark:text-gray-500">v0.2</div>
    </aside>
  );

  return (
    <>
      {/* PC 端：固定左侧 */}
      <div className="hidden md:flex md:shrink-0">{sidebar}</div>
      {/* Mobile：抽屉覆盖 */}
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/40 md:hidden" onClick={onClose} />
          <div className="fixed inset-y-0 left-0 z-50 md:hidden">{sidebar}</div>
        </>
      )}
    </>
  );
}
