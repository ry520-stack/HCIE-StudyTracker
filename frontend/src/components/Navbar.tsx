import { useEffect, useState } from 'react';
import { Quote, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import ThemeToggle from './ThemeToggle';

export default function Navbar() {
  const { user, logout } = useAuth();
  const [quote, setQuote] = useState('');

  useEffect(() => {
    fetch('/api/quote')
      .then((r) => r.json())
      .then((d) => setQuote(d.content))
      .catch(() => setQuote('天行健，君子以自强不息'));
  }, []);

  return (
    <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6 dark:border-gray-700 dark:bg-gray-900">
      {/* 每日一言 */}
      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
        <Quote size={16} className="shrink-0" />
        <span className="max-w-md truncate">{quote || '加载中...'}</span>
      </div>

      {/* 右侧 */}
      <div className="flex items-center gap-3">
        {user && (
          <span className="hidden text-sm text-gray-500 dark:text-gray-400 sm:inline">
            {user.username}
          </span>
        )}
        <ThemeToggle />
        <button
          onClick={logout}
          className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm text-gray-500 transition-colors hover:bg-gray-100 hover:text-red-500 dark:text-gray-400 dark:hover:bg-gray-800"
        >
          <LogOut size={16} />
          退出
        </button>
      </div>
    </header>
  );
}
