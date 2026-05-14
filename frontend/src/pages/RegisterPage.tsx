import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function RegisterPage() {
  const { register, token } = useAuth();
  const nav = useNavigate();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [countdown, setCountdown] = useState(0);

  if (token) return <Navigate to="/notes" replace />;

  const sendCode = async () => {
    setError('');
    if (!email) { setError('请先输入邮箱'); return; }
    // 简易邮箱格式校验
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('请输入正确的邮箱格式');
      return;
    }
    setSending(true);
    try {
      const base = (import.meta as any).env?.VITE_API_BASE || '';
      const res = await fetch(base + '/api/auth/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      // 尝试解析 JSON，失败则说明返回了 HTML 错误页
      let data: any;
      const text = await res.text();
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error('服务器繁忙，请稍后重试');
      }
      if (!res.ok) throw new Error(data.error || '发送失败');
      // 60秒倒计时
      let sec = 60;
      setCountdown(sec);
      const timer = setInterval(() => {
        sec--;
        setCountdown(sec);
        if (sec <= 0) clearInterval(timer);
      }, 1000);
    } catch (e: any) {
      setError(e.message || '网络错误');
    } finally {
      setSending(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 6) { setError('密码至少 6 位'); return; }
    if (!code) { setError('请输入验证码'); return; }
    setLoading(true);
    try {
      await register(username, email, password, code);
      nav('/notes');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 dark:bg-gray-950">
      <div className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-700 dark:bg-gray-900">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-lg font-bold text-white">
            H
          </div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">注册</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">创建你的专属账号</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm text-gray-600 dark:text-gray-400">用户名</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-gray-600 dark:text-gray-400">邮箱</label>
            <div className="flex gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                required
              />
              <button
                type="button"
                onClick={sendCode}
                disabled={sending || countdown > 0}
                className="shrink-0 rounded-lg bg-blue-50 px-3 py-2 text-xs font-medium text-blue-600 transition-colors hover:bg-blue-100 disabled:opacity-50 dark:bg-blue-900/30 dark:text-blue-400"
              >
                {sending ? '发送中' : countdown > 0 ? `${countdown}s` : '获取验证码'}
              </button>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm text-gray-600 dark:text-gray-400">验证码</label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="6位数字验证码"
              maxLength={6}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-gray-600 dark:text-gray-400">密码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="至少 6 位"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
              required
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-blue-600 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? '注册中...' : '注册'}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
          已有账号？
          <Link to="/login" className="ml-1 text-blue-600 hover:underline dark:text-blue-400">
            登录
          </Link>
        </p>
      </div>
    </div>
  );
}
