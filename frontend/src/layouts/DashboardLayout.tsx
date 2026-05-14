import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import { isOnline, getQueue } from '../api/client';

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [online, setOnline] = useState(isOnline());
  const [pending, setPending] = useState(getQueue().length);

  useEffect(() => {
    const update = () => {
      setOnline(isOnline());
      setPending(getQueue().length);
    };
    window.addEventListener('sync-status-change', update);
    window.addEventListener('sync-complete', update);
    const timer = setInterval(update, 5000);
    return () => {
      window.removeEventListener('sync-status-change', update);
      window.removeEventListener('sync-complete', update);
      clearInterval(timer);
    };
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-950">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex flex-1 flex-col overflow-hidden">
        <Navbar onToggleSidebar={() => setSidebarOpen((v) => !v)} />

        {/* Connection status */}
        {(!online || pending > 0) && (
          <div
            className={`flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-medium text-white ${
              online ? 'bg-amber-500' : 'bg-red-500'
            }`}
          >
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-white" />
            {!online
              ? '离线模式 — 数据保存在本地，联网后自动同步'
              : `同步队列中 ${pending} 项待提交…`}
          </div>
        )}

        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
