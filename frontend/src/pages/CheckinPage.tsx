import React, { useEffect, useState, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { checkinToday, useMakeup, getCheckinStats, getMonthData } from '../api/checkin';
import { cn } from '../lib/utils';

export default function CheckinPage() {
  const [stats, setStats] = useState<any>(null);
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth());
  const [monthData, setMonthData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    const [s, md] = await Promise.all([getCheckinStats(), getMonthData(year, month)]);
    setStats(s);
    setMonthData(md);
  }, [year, month]);

  useEffect(() => { load(); }, [load]);

  const doCheckin = async () => {
    setLoading(true);
    try {
      await checkinToday();
      load();
      showToast('打卡成功！继续加油 🔥');
    } catch (e: any) {
      alert(e?.response?.data?.error || '打卡失败');
    }
    setLoading(false);
  };

  const doMakeup = async (date: string) => {
    try {
      await useMakeup(date);
      load();
      showToast('补签成功！');
      setShowMakeup(false);
    } catch (e: any) {
      alert(e?.response?.data?.error || '补签失败');
    }
  };

  const [showMakeup, setShowMakeup] = useState(false);

  const renderCalendar = () => {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrev = new Date(year, month, 0).getDate();
    const checkedDates = new Set(monthData.map((c: any) => c.date));
    const makeupDates = new Set(monthData.filter((c: any) => c.makeup).map((c: any) => c.date));
    const today = new Date().toISOString().slice(0, 10);

    const cells: React.ReactNode[] = [];
    // Prev month
    for (let i = firstDay - 1; i >= 0; i--) {
      const d = daysInPrev - i;
      const ds = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      cells.push(<div key={'p'+d} className={cn('day-cell text-gray-300 dark:text-gray-600', checkedDates.has(ds) && 'bg-green-400 text-white rounded-full')}>{d}</div>);
    }
    // Current
    for (let d = 1; d <= daysInMonth; d++) {
      const ds = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const checked = checkedDates.has(ds);
      const makeup = makeupDates.has(ds);
      cells.push(<div key={d} className={cn('day-cell', ds===today && 'ring-2 ring-blue-500 font-bold', checked ? (makeup?'bg-amber-400 text-white rounded-full':'bg-green-500 text-white rounded-full'):ds<today?'text-gray-400':'')}>{d}</div>);
    }
    // Next month
    const remaining = 42 - (firstDay + daysInMonth);
    for (let d = 1; d <= remaining; d++) {
      const ds = `${year}-${String(month + 2).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      cells.push(<div key={'n'+d} className={cn('day-cell text-gray-300 dark:text-gray-600', checkedDates.has(ds) && 'bg-green-400 text-white rounded-full')}>{d}</div>);
    }
    return cells;
  };

  // Missed days for makeup
  const getMissedDays = () => {
    if (!stats || stats.makeupLeft <= 0) return [];
    const today = new Date();
    const monday = new Date(today);
    monday.setDate(monday.getDate() - monday.getDay() + (monday.getDay() === 0 ? -6 : 1));
    const checkedDates = new Set(monthData.map((c: any) => c.date));
    const missed: string[] = [];
    for (let d = new Date(monday); d <= today; d.setDate(d.getDate() + 1)) {
      const ds = d.toISOString().slice(0, 10);
      if (!checkedDates.has(ds)) missed.push(ds);
    }
    return missed;
  };

  if (!stats) return <div className="flex h-64 items-center justify-center text-gray-400">加载中...</div>;

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <div className="text-xs font-semibold uppercase tracking-widest text-gray-400">每日打卡</div>
        <h1 className="text-3xl font-bold tracking-tight">坚持学习</h1>
      </div>

      {/* Streak */}
      <div className="flex flex-col items-center rounded-3xl border bg-white/70 p-8 backdrop-blur dark:border-gray-700 dark:bg-gray-800/70">
        <div className={cn('flex h-32 w-32 items-center justify-center rounded-full border-2', stats.streak >= 7 ? 'border-orange-400 shadow-[0_0_30px_rgba(251,146,60,0.2)]' : 'border-gray-200 dark:border-gray-600')}>
          <div className="text-center">
            <div className="text-5xl font-light text-orange-400">{stats.streak}</div>
            <div className="text-xs text-gray-400">连续天数</div>
          </div>
        </div>
        <div className="mt-4 flex gap-8 text-center">
          <div><div className="font-bold">{stats.total}</div><div className="text-xs text-gray-400">总打卡</div></div>
          <div><div className="font-bold">{stats.makeupLeft}</div><div className="text-xs text-gray-400">补签卡</div></div>
          <div><div className="font-bold">{stats.monthCheckins ?? 0}</div><div className="text-xs text-gray-400">本月</div></div>
        </div>
        <button onClick={doCheckin} disabled={loading || stats.todayChecked} className={cn('mt-5 rounded-full px-8 py-3 font-medium text-white transition', stats.todayChecked ? 'bg-green-500' : 'bg-blue-500 hover:bg-blue-600')}>
          {stats.todayChecked ? '今日已打卡 ✓' : loading ? '...' : '今日打卡'}
        </button>
        {!stats.todayChecked && stats.makeupLeft > 0 && (
          <button onClick={() => setShowMakeup(!showMakeup)} className="mt-2 text-sm text-blue-500 hover:underline">使用补签卡</button>
        )}
      </div>

      {/* Makeup panel */}
      {showMakeup && (
        <div className="rounded-2xl border bg-white/70 p-5 backdrop-blur dark:border-gray-700 dark:bg-gray-800/70">
          <div className="mb-3 text-sm font-medium">选择补签日期（本周剩余 {stats.makeupLeft} 张）</div>
          <div className="flex flex-wrap gap-2">
            {getMissedDays().map(ds => (
              <button key={ds} onClick={() => doMakeup(ds)} className="rounded-full border border-red-300 px-3 py-1 text-sm text-red-500 hover:bg-red-50 dark:border-red-700 dark:hover:bg-red-900/30">
                {ds.slice(8)}
              </button>
            ))}
            {getMissedDays().length === 0 && <p className="text-sm text-gray-400">本周无需补签</p>}
          </div>
        </div>
      )}

      {/* Calendar */}
      <div className="rounded-2xl border bg-white/70 p-5 backdrop-blur dark:border-gray-700 dark:bg-gray-800/70">
        <div className="mb-3 flex items-center justify-between">
          <button onClick={() => { if (month===0){setMonth(11);setYear(year-1);} else setMonth(month-1); }}><ChevronLeft size={18} /></button>
          <span className="font-medium">{year} 年 {month+1} 月</span>
          <button onClick={() => { if (month===11){setMonth(0);setYear(year+1);} else setMonth(month+1); }}><ChevronRight size={18} /></button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-400">
          <div>日</div><div>一</div><div>二</div><div>三</div><div>四</div><div>五</div><div>六</div>
          {renderCalendar()}
        </div>
        <div className="mt-3 flex gap-4 text-xs text-gray-400">
          <span>🟢 正常打卡</span><span>🟠 补签</span><span>⚪ 未打卡</span>
        </div>
      </div>
    </div>
  );
}

function showToast(msg: string) {
  const el = document.createElement('div');
  el.className = 'fixed bottom-8 left-1/2 -translate-x-1/2 rounded-full bg-gray-900 px-6 py-3 text-sm font-medium text-white shadow-lg z-50 dark:bg-white dark:text-gray-900';
  el.textContent = msg; document.body.appendChild(el);
  setTimeout(() => el.remove(), 2000);
}
