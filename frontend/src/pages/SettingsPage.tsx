import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import { getSettings, updateSettings, resetAllData } from '../api/setting';

export default function SettingsPage() {
  const [title, setTitle] = useState('StudyTracker');
  const [timerDuration, setTimerDuration] = useState(45);
  const [resetConfirm, setResetConfirm] = useState(0);
  const [resetting, setResetting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    getSettings().then(s => {
      if (s.appTitle) setTitle(s.appTitle);
      if (s.timerDuration) setTimerDuration(s.timerDuration);
    }).catch(() => {});
  }, []);

  const save = async () => {
    try {
      await updateSettings({ appTitle: title, timerDuration });
      alert('设置已保存');
    } catch (e: any) {
      alert(e.message || '保存设置失败，请检查网络连接');
    }
  };

  const handleReset = async () => {
    if (resetConfirm === 0) {
      setResetConfirm(1);
      return;
    }
    if (resetConfirm === 1) {
      setResetConfirm(2);
      return;
    }
    setResetting(true);
    try {
      await resetAllData();
      alert('所有数据已重置');
      navigate('/');
      window.location.reload();
    } catch (e: any) {
      alert(e.message || '重置失败');
      setResetConfirm(0);
    }
    setResetting(false);
  };

  const resetLabels = ['重置所有数据', '再次确认：此操作不可恢复！', '最后一次确认：真的要删除吗？'];

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

        {/* 危险区域 */}
        <div className="rounded-2xl border border-red-200 bg-white/70 p-5 backdrop-blur dark:border-red-800 dark:bg-gray-800/70">
          <div className="mb-4 flex items-center gap-2 text-sm font-medium text-red-600 dark:text-red-400">
            <AlertTriangle size={16} />
            危险区域
          </div>
          <p className="mb-3 text-sm text-gray-500 dark:text-gray-400">
            删除所有任务、笔记、专注记录、打卡数据和成就。账号和名言保留。
          </p>
          <button
            onClick={handleReset}
            disabled={resetting}
            className="rounded-full bg-red-500 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-red-600 disabled:opacity-50"
          >
            {resetting ? '重置中...' : resetLabels[resetConfirm]}
          </button>
          {resetConfirm > 0 && (
            <button
              onClick={() => setResetConfirm(0)}
              className="ml-3 rounded-full border border-gray-300 px-4 py-2 text-sm text-gray-500 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800"
            >
              取消
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
