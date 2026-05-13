import { useEffect, useState } from 'react';
import { Clock, Award, List } from 'lucide-react';
import { getTodayStats, type TodayStats } from '../api/focus';

export default function SessionStats() {
  const [stats, setStats] = useState<TodayStats | null>(null);

  useEffect(() => {
    getTodayStats().then(setStats).catch(() => {});
  }, []);

  // 每 10 秒自动刷新（其他会话结束后更新）
  useEffect(() => {
    const id = setInterval(() => getTodayStats().then(setStats).catch(() => {}), 10000);
    return () => clearInterval(id);
  }, []);

  if (!stats) return null;

  const items = [
    { label: '今日专注', value: `${stats.totalMinutes} 分钟`, icon: Clock },
    { label: '完成次数', value: `${stats.completedCount} 次`, icon: Award },
    { label: '总次数', value: `${stats.totalCount} 次`, icon: List },
  ];

  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-4">
      {items.map(({ label, value, icon: Icon }) => (
        <div
          key={label}
          className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
            <Icon size={20} />
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{value}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
