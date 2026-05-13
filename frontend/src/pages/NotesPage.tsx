import { useEffect, useMemo, useState } from 'react';
import {
  BookOpen,
  Plus,
  Trash2,
  RefreshCw,
  Tag,
  Clock,
  Layers,
} from 'lucide-react';
import {
  createNote,
  listNotes,
  deleteNote,
  reviewNote,
  type NoteItem,
} from '../api/note';
import { cn } from '../lib/utils';

const DAY_MS = 86_400_000;

export default function NotesPage() {
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');

  // 表单字段
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tagInput, setTagInput] = useState('');

  // ---------- 加载 ----------
  const load = () => {
    listNotes(activeTag ?? undefined).then(setNotes).catch(() => {});
  };

  useEffect(() => { load(); }, [activeTag]); // eslint-disable-line react-hooks/exhaustive-deps

  // 每隔 60s 刷新一次（刷新下次复习时间的显示）
  useEffect(() => {
    const id = setInterval(load, 60_000);
    return () => clearInterval(id);
  }, [activeTag]); // eslint-disable-line react-hooks/exhaustive-deps

  // ---------- 提取全部标签 ----------
  const allTags = useMemo(() => {
    const set = new Set<string>();
    notes.forEach((n) => n.tags.forEach((t) => set.add(t)));
    return ['全部', ...Array.from(set).sort()];
  }, [notes]);

  // ---------- 操作 ----------
  async function handleAdd() {
    if (!title.trim() || !content.trim()) return;
    const tags = tagInput
      .split(/[,，、\s]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    try {
      await createNote({ title: title.trim(), content: content.trim(), tags });
      setTitle('');
      setContent('');
      setTagInput('');
      setShowForm(false);
      load();
    } catch (e: any) {
      alert(e.message || '添加笔记失败，请检查网络连接');
    }
  }

  async function handleReview(id: string) {
    try {
      await reviewNote(id);
      load();
    } catch (e: any) {
      alert(e.message || '复习打卡失败，请检查网络连接');
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteNote(id);
      load();
    } catch (e: any) {
      alert(e.message || '删除失败，请检查网络连接');
    }
  }

  // ---------- 工具 ----------
  function isDue(note: NoteItem): boolean {
    if (!note.nextReviewAt) return false;
    return new Date(note.nextReviewAt).getTime() <= Date.now();
  }

  function daysUntil(dateStr: string): number {
    return Math.ceil(
      (new Date(dateStr).getTime() - Date.now()) / DAY_MS,
    );
  }

  // ---------- 渲染 ----------
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* 标题 + 新增 */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">笔记</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
        >
          <Plus size={16} />
          新增笔记
        </button>
      </div>

      {/* 搜索框 */}
      <div className="relative">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="搜索笔记标题、内容、标签..." className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 pl-10 text-sm outline-none focus:border-blue-400 dark:border-gray-700 dark:bg-gray-900" />
        <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
      </div>

      {/* 新增表单 */}
      {showForm && (
        <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
          <div className="space-y-3">
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="笔记标题"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-900 placeholder-gray-400 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
            />
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="正文内容（支持 Markdown）"
              rows={4}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
            />
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <label className="mb-1 block text-xs text-gray-500 dark:text-gray-400">
                  标签（用逗号或空格分隔）
                </label>
                <input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  placeholder="例：OSPF, 路由, 交换"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                />
              </div>
              <button
                onClick={handleAdd}
                className="mt-5 rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 标签筛选 */}
      <div className="flex flex-wrap gap-2">
        {allTags.map((tag) => (
          <button
            key={tag}
            onClick={() => setActiveTag(tag === '全部' ? null : tag)}
            className={cn(
              'flex items-center gap-1 rounded-full px-3 py-1 text-sm font-medium transition-colors',
              (tag === '全部' && activeTag === null) || tag === activeTag
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700',
            )}
          >
            <Tag size={12} />
            {tag}
          </button>
        ))}
      </div>

      {/* 笔记列表 */}
      {(() => {
        const filtered = search ? notes.filter(n => n.title.toLowerCase().includes(search.toLowerCase()) || n.content.toLowerCase().includes(search.toLowerCase()) || (n.tags||[]).some((t: string) => t.toLowerCase().includes(search.toLowerCase()))) : notes;
        if (filtered.length === 0) return (
          <div className="flex flex-col items-center py-20 text-gray-400 dark:text-gray-500">
            <BookOpen size={48} className="mb-3" />
            <p className="text-sm">{search ? '没有匹配的笔记' : '暂无笔记'}</p>
          </div>
        );
        return (
        <div className="space-y-4">
          {filtered.map((note) => {
            const due = isDue(note);
            const days = note.nextReviewAt ? daysUntil(note.nextReviewAt) : null;

            return (
              <div
                key={note.id}
                className={cn(
                  'group rounded-xl border bg-white p-4 transition-all dark:bg-gray-900',
                  due
                    ? 'border-red-200 shadow-[0_0_0_1px_rgba(239,68,68,0.3)] dark:border-red-800'
                    : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600',
                )}
              >
                {/* 第一行：标题 + 操作 */}
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                      {note.title}
                    </h3>
                  </div>
                  <button
                    onClick={() => handleDelete(note.id)}
                    className="shrink-0 rounded-lg p-1.5 text-gray-400 opacity-0 transition-all hover:bg-red-50 hover:text-red-500 group-hover:opacity-100 dark:hover:bg-red-900/20"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                {/* 第二行：正文摘要 */}
                <p className="mt-1 line-clamp-2 text-sm text-gray-500 dark:text-gray-400">
                  {note.content}
                </p>

                {/* 第三行：元信息 + 操作 */}
                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
                  {/* 标签 */}
                  {note.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {note.tags.map((t) => (
                        <span
                          key={t}
                          className="rounded-md bg-gray-100 px-2 py-0.5 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* 复习次数 */}
                  <span className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
                    <Layers size={12} />
                    第 {note.reviewCount} 次复习
                  </span>

                  {/* 下次复习时间 */}
                  {note.nextReviewAt && (
                    <span
                      className={cn(
                        'flex items-center gap-1 text-xs',
                        due
                          ? 'font-medium text-red-500'
                          : 'text-gray-400 dark:text-gray-500',
                      )}
                    >
                      <Clock size={12} />
                      {due
                        ? `已逾期 ${Math.abs(days!)} 天`
                        : days === 0
                          ? '今天'
                          : `${days} 天后复习`}
                    </span>
                  )}

                  {/* 复习打卡按钮 */}
                  {due && (
                    <button
                      onClick={() => handleReview(note.id)}
                      className="ml-auto flex items-center gap-1 rounded-lg bg-green-600 px-3 py-1 text-xs font-medium text-white shadow-sm transition-colors hover:bg-green-700"
                    >
                      <RefreshCw size={12} />
                      复习打卡
                    </button>
                  )}

                  {/* 非逾期时显示下次日期 */}
                  {note.nextReviewAt && !due && (
                    <span className="ml-auto text-xs text-gray-400 dark:text-gray-500">
                      {new Date(note.nextReviewAt).toLocaleDateString('zh-CN')}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      );})()}
    </div>
  );
}
