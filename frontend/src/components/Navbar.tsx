import { useEffect, useState, useCallback, useRef } from 'react';
import { Quote, LogOut, Settings2, Plus, Trash2, X, Menu } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import ThemeToggle from './ThemeToggle';
import { getDailyQuote, listQuotes, createQuote, deleteQuote, type QuoteItem } from '../api/quote';

export default function Navbar({ onToggleSidebar }: { onToggleSidebar?: () => void }) {
  const { user, logout, token } = useAuth();
  const [quote, setQuote] = useState('');
  const [showManager, setShowManager] = useState(false);
  const [quotes, setQuotes] = useState<QuoteItem[]>([]);
  const [newContent, setNewContent] = useState('');
  const [newAuthor, setNewAuthor] = useState('');
  const [managerLoading, setManagerLoading] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  const fetchQuote = useCallback(() => {
    if (!token) {
      setQuote('天行健，君子以自强不息');
      return;
    }
    getDailyQuote()
      .then((d) => setQuote(d.content))
      .catch(() => setQuote('天行健，君子以自强不息'));
  }, [token]);

  useEffect(() => { fetchQuote(); }, [fetchQuote]);

  const openManager = () => {
    setShowManager(true);
    setManagerLoading(true);
    listQuotes()
      .then(setQuotes)
      .catch(() => {})
      .finally(() => setManagerLoading(false));
  };

  const handleAdd = async () => {
    if (!newContent.trim()) return;
    try {
      const q = await createQuote(newContent.trim(), newAuthor.trim() || undefined);
      setQuotes((prev) => [...prev, q]);
      setNewContent('');
      setNewAuthor('');
      fetchQuote();
    } catch (e: any) {
      alert(e.message || '添加失败');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteQuote(id);
      setQuotes((prev) => prev.filter((q) => q.id !== id));
      fetchQuote();
    } catch (e: any) {
      alert(e.message || '删除失败');
    }
  };

  // 点击遮罩关闭
  const handleOverlay = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) setShowManager(false);
  };

  return (
    <>
      <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6 dark:border-gray-700 dark:bg-gray-900">
        {/* 每日一言 */}
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <button
            onClick={onToggleSidebar}
            className="md:hidden rounded p-1 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
            aria-label="菜单"
          >
            <Menu size={20} />
          </button>
          <Quote size={16} className="shrink-0 hidden sm:block" />
          <span className="max-w-[180px] sm:max-w-md truncate">{quote || '加载中...'}</span>
          {token && (
            <button
              onClick={openManager}
              className="shrink-0 rounded p-1 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
              title="管理名言"
            >
              <Settings2 size={14} />
            </button>
          )}
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

      {/* 名言管理弹窗 */}
      {showManager && (
        <div
          ref={modalRef}
          onClick={handleOverlay}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
        >
          <div className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-gray-700 dark:bg-gray-900">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">管理名言</h2>
              <button onClick={() => setShowManager(false)} className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800">
                <X size={20} />
              </button>
            </div>

            {/* 添加表单 */}
            <div className="mb-4 space-y-2">
              <input
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                placeholder="名言内容"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
              />
              <div className="flex gap-2">
                <input
                  value={newAuthor}
                  onChange={(e) => setNewAuthor(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                  placeholder="出处（可选）"
                  className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                />
                <button
                  onClick={handleAdd}
                  className="flex items-center gap-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  <Plus size={14} />
                  添加
                </button>
              </div>
            </div>

            {/* 列表 */}
            {managerLoading ? (
              <p className="py-8 text-center text-sm text-gray-400">加载中...</p>
            ) : quotes.length === 0 ? (
              <p className="py-8 text-center text-sm text-gray-400">暂无名言，快去添加吧</p>
            ) : (
              <ul className="max-h-64 space-y-1 overflow-y-auto">
                {quotes.map((q) => (
                  <li key={q.id} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-gray-50 dark:hover:bg-gray-800">
                    <span className="flex-1 truncate text-gray-900 dark:text-gray-100">{q.content}</span>
                    {q.author && <span className="shrink-0 text-xs text-gray-400">—— {q.author}</span>}
                    {q.isDefault && <span className="shrink-0 text-xs text-amber-500">默认</span>}
                    <button
                      onClick={() => handleDelete(q.id)}
                      className="shrink-0 rounded p-1 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
                    >
                      <Trash2 size={14} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </>
  );
}
