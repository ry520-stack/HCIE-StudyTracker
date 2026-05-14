import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AlertTriangle, Cloud, CloudOff, Download, Upload, LogOut, RefreshCw } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getSettings, updateSettings, resetAllData } from '../api/setting';
import { isOnline, getQueue, processQueue, invalidateCache, getServerUrl, setServerUrl } from '../api/client';
import { api } from '../api/client';

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [title, setTitle] = useState('StudyTracker');
  const [timerDuration, setTimerDuration] = useState(45);
  const [resetConfirm, setResetConfirm] = useState(0);
  const [resetting, setResetting] = useState(false);
  const [online, setOnline] = useState(isOnline());
  const [pending, setPending] = useState(getQueue().length);
  const [syncing, setSyncing] = useState(false);
  const [pulling, setPulling] = useState(false);
  const [serverUrl, setLocalServerUrl] = useState(getServerUrl());

  useEffect(() => {
    getSettings().then(s => {
      if (s.appTitle) setTitle(s.appTitle);
      if (s.timerDuration) setTimerDuration(s.timerDuration);
    }).catch(() => {});

    const update = () => {
      setOnline(isOnline());
      setPending(getQueue().length);
    };
    const timer = setInterval(update, 3000);
    return () => clearInterval(timer);
  }, []);

  const save = async () => {
    try {
      await updateSettings({ appTitle: title, timerDuration });
      alert('设置已保存');
    } catch (e: any) {
      alert(e.message || '保存设置失败');
    }
  };

  const handlePull = async () => {
    if (!user) return;
    setPulling(true);
    try {
      // Invalidate all caches and reload from server
      invalidateCache('/api/');
      await Promise.all([
        api('GET', '/api/tasks'),
        api('GET', '/api/notes'),
        api('GET', '/api/focus-sessions?limit=200&offset=0'),
        api('GET', '/api/checkin/stats'),
      ]);
      alert('数据已从服务器恢复');
      window.dispatchEvent(new CustomEvent('sync-complete'));
    } catch (e: any) {
      alert(e.message || '恢复失败，请检查网络');
    }
    setPulling(false);
  };

  const handleForceSync = async () => {
    setSyncing(true);
    try {
      await processQueue(api);
      setPending(getQueue().length);
      if (getQueue().length === 0) {
        alert('同步队列已清空');
      } else {
        alert('部分数据同步失败，请稍后重试');
      }
    } catch {
      alert('同步失败，请检查网络');
    }
    setSyncing(false);
  };

  const handleExport = () => {
    const data: Record<string, string> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && (k.startsWith('st-') || k.startsWith('st_'))) {
        data[k] = localStorage.getItem(k) || '';
      }
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'studytracker-' + new Date().toISOString().slice(0, 10) + '.json';
    a.click();
  };

  const handleImport = () => {
    const inp = document.createElement('input');
    inp.type = 'file';
    inp.accept = '.json';
    inp.onchange = async (e: any) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = async (ev) => {
        try {
          const data = JSON.parse(ev.target?.result as string);
          if (!confirm('导入将覆盖当前缓存数据，确定继续？')) return;
          Object.keys(data).forEach(k => {
            if (k.startsWith('st-') || k.startsWith('st_')) {
              localStorage.setItem(k, data[k]);
            }
          });
          alert('已导入，页面将刷新');
          window.location.reload();
        } catch {
          alert('文件格式错误');
        }
      };
      reader.readAsText(file);
    };
    inp.click();
  };

  const handleReset = async () => {
    if (resetConfirm === 0) { setResetConfirm(1); return; }
    if (resetConfirm === 1) { setResetConfirm(2); return; }
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

  const handleSaveServerUrl = () => {
    setServerUrl(serverUrl);
    alert('服务器地址已保存，建议刷新页面');
  };

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <div className="text-xs font-semibold uppercase tracking-widest text-gray-400">设置</div>
        <h1 className="text-3xl font-bold tracking-tight">个性化</h1>
      </div>

      {/* 通用 */}
      <div className="rounded-2xl border bg-white/70 p-5 backdrop-blur dark:border-gray-700 dark:bg-gray-800/70">
        <div className="mb-4 text-sm font-medium text-gray-500">通用</div>
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm">应用名称</label>
            <input className="w-full rounded-xl border px-4 py-2 text-sm outline-none focus:border-blue-500 dark:border-gray-600 dark:bg-gray-800" value={title} onChange={e => setTitle(e.target.value)} />
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

      {/* 服务器同步 */}
      <div className="rounded-2xl border bg-white/70 p-5 backdrop-blur dark:border-gray-700 dark:bg-gray-800/70">
        <div className="mb-4 flex items-center gap-2 text-sm font-medium text-gray-500">
          {online ? <Cloud size={16} className="text-emerald-500" /> : <CloudOff size={16} className="text-red-500" />}
          服务器同步
        </div>

        <div className="space-y-3 text-sm">
          <div className="text-gray-500">
            <div className="flex items-center gap-2 mb-1 text-sm">服务器地址</div>
            <div className="flex gap-2">
              <input
                className="flex-1 rounded-xl border px-4 py-2 text-sm outline-none focus:border-blue-500 dark:border-gray-600 dark:bg-gray-800"
                value={serverUrl}
                onChange={e => setLocalServerUrl(e.target.value)}
                placeholder="https://xxx.trycloudflare.com"
              />
              <button
                onClick={handleSaveServerUrl}
                className="shrink-0 rounded-xl bg-blue-50 px-4 py-2 text-xs font-medium text-blue-600 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400"
              >
                保存
              </button>
            </div>
            <p className="mt-1 text-xs text-gray-400">服务器重启后隧道地址会变，在此更新即可，无需重新打包</p>
          </div>

          {user ? (
            <>
              <div className="flex justify-between text-gray-500">
                <span>账号</span>
                <span className="font-medium text-gray-700 dark:text-gray-300">{user.username}</span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>邮箱</span>
                <span className="text-gray-400">{user.email}</span>
              </div>
              {pending > 0 && (
                <div className="rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                  {pending} 项离线数据待同步
                </div>
              )}
              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  onClick={handlePull}
                  disabled={pulling}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-blue-50 px-4 py-2 text-xs font-medium text-blue-600 transition-colors hover:bg-blue-100 disabled:opacity-50 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50"
                >
                  <RefreshCw size={13} className={pulling ? 'animate-spin' : ''} />
                  {pulling ? '恢复中...' : '从服务器恢复'}
                </button>
                {pending > 0 && (
                  <button
                    onClick={handleForceSync}
                    disabled={syncing}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-amber-50 px-4 py-2 text-xs font-medium text-amber-600 transition-colors hover:bg-amber-100 disabled:opacity-50 dark:bg-amber-900/30 dark:text-amber-400 dark:hover:bg-amber-900/50"
                  >
                    <Upload size={13} />
                    上传本地数据
                  </button>
                )}
                <button
                  onClick={() => { logout(); navigate('/login'); }}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-red-50 px-4 py-2 text-xs font-medium text-red-500 transition-colors hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50"
                >
                  <LogOut size={13} />
                  退出登录
                </button>
              </div>
            </>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-gray-400">登录后可使用云端同步、数据恢复</p>
              <div className="flex gap-2">
                <Link to="/login" className="rounded-xl bg-blue-50 px-4 py-2 text-xs font-medium text-blue-600 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400">登录</Link>
                <Link to="/register" className="rounded-xl border px-4 py-2 text-xs font-medium text-gray-500 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800">注册</Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 数据管理 */}
      <div className="rounded-2xl border bg-white/70 p-5 backdrop-blur dark:border-gray-700 dark:bg-gray-800/70">
        <div className="mb-4 text-sm font-medium text-gray-500">数据管理</div>
        <div className="flex flex-wrap gap-2">
          <button onClick={handleExport} className="inline-flex items-center gap-1.5 rounded-xl bg-blue-50 px-4 py-2 text-xs font-medium text-blue-600 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400">
            <Download size={13} />
            导出备份
          </button>
          <button onClick={handleImport} className="inline-flex items-center gap-1.5 rounded-xl border px-4 py-2 text-xs font-medium text-gray-500 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800">
            <Upload size={13} />
            导入恢复
          </button>
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
  );
}
