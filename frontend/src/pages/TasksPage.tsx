import { useEffect, useState } from 'react';
import { Plus, Check, Trash2, ListTodo } from 'lucide-react';
import {
  createTask,
  listTasks,
  toggleTask,
  deleteTask,
  getTaskStats,
  type TaskItem,
  type TaskStats,
} from '../api/task';
import { cn } from '../lib/utils';

type FilterType = 'all' | 'SHORT_TERM' | 'LONG_TERM';

export default function TasksPage() {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [stats, setStats] = useState<TaskStats | null>(null);
  const [filter, setFilter] = useState<FilterType>('all');
  const [title, setTitle] = useState('');
  const [taskType, setTaskType] = useState<'SHORT_TERM' | 'LONG_TERM'>('SHORT_TERM');
  const [priority, setPriority] = useState('medium');
  const [showForm, setShowForm] = useState(false);

  const load = () => {
    const params = filter === 'all' ? undefined : { type: filter };
    listTasks(params).then(setTasks).catch(() => {});
    getTaskStats().then(setStats).catch(() => {});
  };

  useEffect(() => { load(); }, [filter]); // eslint-disable-line react-hooks/exhaustive-deps

  // 每 10s 自动刷新（多个 tab 同步）
  useEffect(() => {
    const id = setInterval(load, 10000);
    return () => clearInterval(id);
  }, [filter]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleAdd() {
    if (!title.trim()) return;
    try {
      await createTask({ title: title.trim(), type: taskType, priority });
      setTitle('');
      setShowForm(false);
      load();
    } catch (e: any) {
      alert(e.message || '添加任务失败，请检查网络连接');
    }
  }

  async function handleToggle(id: string) {
    try {
      await toggleTask(id);
      load();
    } catch (e: any) {
      alert(e.message || '操作失败，请检查网络连接');
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteTask(id);
      load();
    } catch (e: any) {
      alert(e.message || '删除失败，请检查网络连接');
    }
  }

  const FILTERS: { key: FilterType; label: string }[] = [
    { key: 'all', label: '全部' },
    { key: 'SHORT_TERM', label: '短期' },
    { key: 'LONG_TERM', label: '长期' },
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* 标题 + 新增按钮 */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">任务打卡</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
        >
          <Plus size={16} />
          新增任务
        </button>
      </div>

      {/* 新增表单（手风琴式展开） */}
      {showForm && (
        <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex-1">
              <label className="mb-1 block text-xs text-gray-500 dark:text-gray-400">任务标题</label>
              <input
                autoFocus
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                placeholder="输入任务内容..."
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-500 dark:text-gray-400">类型</label>
              <select value={taskType} onChange={(e) => setTaskType(e.target.value as 'SHORT_TERM' | 'LONG_TERM')} className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100">
                <option value="SHORT_TERM">短期</option><option value="LONG_TERM">长期</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-500 dark:text-gray-400">优先级</label>
              <select value={priority} onChange={(e) => setPriority(e.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100">
                <option value="high">🔴 高</option><option value="medium">🟡 中</option><option value="low">🟢 低</option>
              </select>
            </div>
            <button
              onClick={handleAdd}
              className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
            >
              添加
            </button>
          </div>
        </div>
      )}

      {/* 统计卡片 */}
      {stats && (
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: '总计', value: stats.total, color: 'text-gray-900 dark:text-gray-100' },
            { label: '已完成', value: stats.completed, color: 'text-green-600 dark:text-green-400' },
            { label: '待办', value: stats.pending, color: 'text-amber-600 dark:text-amber-400' },
            { label: '长期', value: stats.longTerm, color: 'text-blue-600 dark:text-blue-400' },
          ].map(({ label, value, color }) => (
            <div
              key={label}
              className="rounded-xl border border-gray-200 bg-white p-3 text-center dark:border-gray-700 dark:bg-gray-900"
            >
              <p className={cn('text-2xl font-bold', color)}>{value}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* 筛选标签 */}
      <div className="flex gap-2">
        {FILTERS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={cn(
              'rounded-lg px-4 py-1.5 text-sm font-medium transition-colors',
              filter === key
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* 任务列表 */}
      {tasks.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-gray-400 dark:text-gray-500">
          <ListTodo size={40} className="mb-3" />
          <p className="text-sm">暂无任务</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {tasks.map((task) => (
            <li
              key={task.id}
              className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 transition-colors hover:border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:hover:border-gray-600"
            >
              {/* Toggle */}
              <button onClick={() => handleToggle(task.id)} className={cn('flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors', task.completed ? 'border-green-500 bg-green-500 text-white' : 'border-gray-300 hover:border-blue-400 dark:border-gray-600')}>
                {task.completed && <Check size={12} strokeWidth={3} />}
              </button>
              {/* Priority dot */}
              <span className={cn('h-2 w-2 shrink-0 rounded-full', (task.priority || 'medium') === 'high' ? 'bg-red-500' : (task.priority || 'medium') === 'low' ? 'bg-teal-400' : 'bg-amber-400')} />

              {/* 内容 */}
              <div className="flex-1 min-w-0">
                <p
                  className={cn(
                    'text-sm font-medium truncate',
                    task.completed
                      ? 'text-gray-400 line-through dark:text-gray-500'
                      : 'text-gray-900 dark:text-gray-100',
                  )}
                >
                  {task.title}
                </p>
              </div>

              {/* 类型标签 */}
              <span
                className={cn(
                  'shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium',
                  task.type === 'SHORT_TERM'
                    ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                    : 'bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
                )}
              >
                {task.type === 'SHORT_TERM' ? '短期' : '长期'}
              </span>

              {/* 截止日期 */}
              {task.dueDate && (
                <span className="shrink-0 text-xs text-gray-400 dark:text-gray-500">
                  {new Date(task.dueDate).toLocaleDateString('zh-CN')}
                </span>
              )}

              {/* 删除 */}
              <button
                onClick={() => handleDelete(task.id)}
                className="shrink-0 rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
              >
                <Trash2 size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
