import { useEffect, useState } from 'react';
import { getSettings, updateSettings } from '../api/setting';

export default function SettingsPage() {
  const [title, setTitle] = useState('HCIE-StudyTracker');
  const [timerDuration, setTimerDuration] = useState(45);

  useEffect(() => {
    getSettings().then(s => {
      if (s.appTitle) setTitle(s.appTitle);
      if (s.timerDuration) setTimerDuration(s.timerDuration);
    }).catch(() => {});
  }, []);

  const save = async () => {
    await updateSettings({ appTitle: title, timerDuration });
    (window as any).__appTitle = title;
    (window as any).__timerDuration = timerDuration;
    alert('设置已保存');
  };

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <div className="text-xs font-semibold uppercase tracking-widest text-gray-400">设置</div>
        <h1 className="text-3xl font-bold tracking-tight">个性化</h1>
      </div>

      <div className="space-y-4">
        <div className="rounded-2xl border bg-white/70 p-5 backdrop-blur dark:border-gray-700 dark:bg-gray-800/70">
          <div className="mb-4 text-sm font-medium text-gray-500">通用</div>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm">应用名称</label>
              <input className="w-full rounded-xl border px-4 py-2 text-sm outline-none focus:border-blue-500 dark:border-gray-600 dark:bg-gray-800" value={title} onChange={e => setTitle(e.target.value)} placeholder="设置标题" />
            </div>
            <div>
              <label className="mb-1 block text-sm">专注时长（分钟）</label>
              <select className="w-full rounded-xl border px-4 py-2 text-sm outline-none focus:border-blue-500 dark:border-gray-600 dark:bg-gray-800" value={timerDuration} onChange={e => setTimerDuration(+e.target.value)}>
                <option value={15}>15 分钟</option><option value={25}>25 分钟</option><option value={30}>30 分钟</option><option value={45}>45 分钟</option><option value={60}>60 分钟</option><option value={90}>90 分钟</option>
              </select>
            </div>
            <button onClick={save} className="rounded-full bg-blue-500 px-6 py-2 text-sm font-medium text-white hover:bg-blue-600">保存设置</button>
          </div>
        </div>
      </div>
    </div>
  );
}
