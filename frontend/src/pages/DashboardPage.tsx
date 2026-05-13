import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Target, BookOpen, CheckSquare } from 'lucide-react';
import { getDashboard } from '../api/setting';
import { updateDailyJournal, updateDailyGoal } from '../api/setting';
import { cn } from '../lib/utils';

interface DashData {
  tasks: { total: number; done: number; pending: number; recent: any[] };
  notes: { total: number; due: number; dueList: any[] };
  focus: { totalSessions: number; totalMin: number };
  checkin: { total: number; streak: number; todayChecked: boolean; makeupLeft: number };
  goal: { targetMinutes: number };
  journal: { content: string };
  achievements: { id: string; icon: string; name: string; desc: string; unlocked: boolean }[];
  newUnlocks: any[];
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<DashData | null>(null);
  const [journal, setJournal] = useState('');
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    const h = new Date().getHours();
    setGreeting(h < 6 ? '夜深了' : h < 9 ? '早上好' : h < 12 ? '上午好' : h < 14 ? '中午好' : h < 18 ? '下午好' : '晚上好');
  }, []);

  const load = useCallback(async () => {
    const d = await getDashboard();
    setData(d);
    setJournal(d.journal?.content || '');
    // Show unlock toasts
    if (d.newUnlocks?.length) {
      d.newUnlocks.forEach((a: any) => {
        setTimeout(() => showToast(`${a.icon} 成就解锁：${a.name} — ${a.desc}`), 100);
      });
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const saveJournal = async () => {
    await updateDailyJournal(journal);
    showToast('随笔已保存');
  };

  const adjustGoal = () => {
    const mins = prompt('设置每日学习目标（分钟）：', String(data?.goal?.targetMinutes || 120));
    if (mins && !isNaN(+mins) && +mins > 0) {
      updateDailyGoal(+mins).then(() => load());
    }
  };

  if (!data) return <div className="flex h-64 items-center justify-center text-gray-400">加载中...</div>;

  const todayMin = 0; // Will be calculated from focus data
  const goalPct = data.goal?.targetMinutes ? Math.min(100, Math.round(todayMin / data.goal.targetMinutes * 100)) : 0;

  return (
    <div className="max-w-4xl space-y-6">
      {/* Welcome */}
      <div>
        <div className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">{greeting}</div>
        <h1 className="text-3xl font-bold tracking-tight">概览</h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <StatTile color="text-blue-600" num={`${data.tasks.done}/${data.tasks.total}`} label="任务完成" />
        <StatTile color="text-amber-500" num={String(data.notes.due)} label="待复习笔记" />
        <StatTile color="text-orange-500" num={`${data.checkin.streak}天`} label="连续打卡" />
      </div>

      {/* Daily Goal */}
      <div className="rounded-2xl border bg-white/70 p-5 backdrop-blur dark:border-gray-700 dark:bg-gray-800/70">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-medium text-gray-500">今日学习目标</span>
          <span className="text-sm text-gray-500">{todayMin} / {data.goal?.targetMinutes || 120} 分钟</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
          <div className="h-full rounded-full bg-blue-500 transition-all duration-500" style={{ width: `${goalPct}%` }} />
        </div>
        <button onClick={adjustGoal} className="mt-2 text-xs text-blue-500 hover:underline">调整目标</button>
      </div>

      {/* Recent Tasks */}
      <Section title="最近任务" icon={<CheckSquare size={15} />} onClick={() => navigate('/tasks')}>
        {data.tasks.recent.length === 0 ? (
          <p className="py-4 text-center text-sm text-gray-400">暂无任务</p>
        ) : (
          data.tasks.recent.map((t: any) => (
            <div key={t.id} className="flex items-center gap-3 rounded-xl border px-4 py-3 dark:border-gray-700">
              <span className={cn('h-2 w-2 rounded-full', t.priority === 'high' ? 'bg-red-500' : t.priority === 'low' ? 'bg-teal-400' : 'bg-amber-400')} />
              <span className="flex-1 text-sm font-medium">{t.title}</span>
              <span className="text-xs text-gray-400">{t.type === 'LONG_TERM' ? '长期' : '短期'}</span>
            </div>
          ))
        )}
      </Section>

      {/* Due Reviews */}
      <Section title="待复习" icon={<BookOpen size={15} />} onClick={() => navigate('/notes')}>
        {data.notes.dueList.length === 0 ? (
          <p className="py-4 text-center text-sm text-gray-400">没有待复习的笔记</p>
        ) : (
          data.notes.dueList.map((n: any) => (
            <div key={n.id} className="rounded-xl border-l-4 border-l-red-500 border px-4 py-3 dark:border-gray-700">
              <div className="font-medium text-sm">{n.title}</div>
              <div className="text-xs text-gray-400">复习 {n.reviewCount} 次</div>
            </div>
          ))
        )}
      </Section>

      {/* Achievements */}
      <Section title="成就徽章" icon={<Target size={15} />}>
        <div className="flex flex-wrap gap-3">
          {data.achievements.map(a => (
            <div key={a.id} className={cn('flex w-16 flex-col items-center gap-1 rounded-xl border px-2 py-3 text-center transition', a.unlocked ? 'border-blue-200 dark:border-blue-800' : 'border-gray-200 opacity-35 grayscale dark:border-gray-700')} title={a.unlocked ? `${a.name} — ${a.desc}` : '???'}>
              <span className="text-xl">{a.unlocked ? a.icon : '🔒'}</span>
              <span className="text-[10px] leading-tight text-gray-500">{a.unlocked ? a.name : '???'}</span>
            </div>
          ))}
        </div>
      </Section>

      {/* Daily Journal */}
      <div className="rounded-2xl border bg-white/70 p-5 backdrop-blur dark:border-gray-700 dark:bg-gray-800/70">
        <div className="mb-2 text-sm font-medium text-gray-500">今日随笔</div>
        <textarea
          className="w-full resize-none bg-transparent text-sm outline-none placeholder:text-gray-300 dark:placeholder:text-gray-600"
          rows={3}
          placeholder="今天学了什么？有什么收获？"
          value={journal}
          onChange={e => setJournal(e.target.value)}
          onBlur={saveJournal}
        />
      </div>

      <div id="toast-container" className="fixed right-6 top-6 z-50 flex flex-col gap-2" />
    </div>
  );
}

function StatTile({ color, num, label }: { color: string; num: string; label: string }) {
  return (
    <div className="rounded-2xl border bg-white/70 p-5 text-center backdrop-blur transition hover:-translate-y-0.5 hover:shadow-md dark:border-gray-700 dark:bg-gray-800/70">
      <div className={cn('text-2xl font-bold', color)}>{num}</div>
      <div className="mt-1 text-xs text-gray-400">{label}</div>
    </div>
  );
}

function Section({ title, icon, children, onClick }: { title: string; icon: React.ReactNode; children: React.ReactNode; onClick?: () => void }) {
  return (
    <div className="rounded-2xl border bg-white/70 p-5 backdrop-blur dark:border-gray-700 dark:bg-gray-800/70">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-500">{icon}{title}</div>
        {onClick && <button onClick={onClick} className="text-xs text-blue-500 hover:underline">查看全部</button>}
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function showToast(msg: string) {
  const el = document.createElement('div');
  el.className = 'rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 px-4 py-2 text-sm font-medium text-white shadow-lg animate-pulse';
  el.textContent = msg;
  document.getElementById('toast-container')?.appendChild(el);
  setTimeout(() => el.remove(), 4000);
}
