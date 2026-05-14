import {
  isOnline,
  setOffline,
  setOnline,
  cacheGet,
  readCache,
  invalidateCache,
  queueOp,
  processQueue,
  getQueue,
  initOfflineListeners,
} from './offlineSync';

const TOKEN_KEY = 'st-token';
const SERVER_URL_KEY = 'st-server-url';

function getBaseUrl(): string {
  // 用户手动设置的优先
  const manual = localStorage.getItem(SERVER_URL_KEY);
  if (manual) return manual;
  // 其次用构建时的环境变量
  return (import.meta as any).env?.VITE_API_BASE || '';
}

export function getServerUrl(): string {
  return getBaseUrl();
}

export function setServerUrl(url: string) {
  if (url) {
    localStorage.setItem(SERVER_URL_KEY, url.replace(/\/$/, ''));
  } else {
    localStorage.removeItem(SERVER_URL_KEY);
  }
}

function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem('st-user');
}

const offlineFallbackWarning = { shown: false };
function showOfflineModeToast() {
  if (offlineFallbackWarning.shown) return;
  offlineFallbackWarning.shown = true;
  setTimeout(() => { offlineFallbackWarning.shown = false; }, 3000);
  const el = document.createElement('div');
  el.className =
    'fixed top-4 left-1/2 -translate-x-1/2 z-[9999] rounded-2xl bg-amber-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg';
  el.textContent = '已切换到本地模式，网络恢复后自动同步';
  document.body.appendChild(el);
  setTimeout(() => { el.style.opacity = '0';
    el.style.transition = 'opacity 0.3s'; }, 2500);
  setTimeout(() => el.remove(), 3000);
}

// Public sync helpers for UI
export { processQueue, getQueue, isOnline, setOnline, setOffline, initOfflineListeners };
export { invalidateCache };

export async function api<T>(method: string, path: string, body?: unknown): Promise<T> {
  // Don't cache auth requests
  const isAuth = path.startsWith('/api/auth');
  const isGet = method === 'GET';

  // Try server first
  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    const token = getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const base = getBaseUrl();
    const url = base + path;

    const res = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    // Server responded — we're online
    setOnline();

    if (res.status === 401) {
      clearAuth();
      window.location.href = '/login';
      throw new Error('登录已过期，请重新登录');
    }

    if (res.status === 204) return undefined as T;

    let data: any;
    try {
      data = await res.json();
    } catch {
      if (!res.ok) throw new Error(`请求失败 (${res.status})`);
      return undefined as T;
    }
    if (!res.ok) {
      throw new Error(data?.error || `请求失败 (${res.status})`);
    }

    // Cache successful GET responses for offline fallback
    if (isGet && !isAuth && data !== undefined) {
      cacheGet(path, data);
    }

    return data as T;
  } catch (err: unknown) {
    const msg = (err as Error).message || '';

    // Already processed as 401
    if (msg.includes('登录已过期')) throw err;

    // Network error — try offline fallback
    const isNetworkError =
      msg.includes('无法连接') ||
      msg.includes('网络') ||
      msg.includes('fetch') ||
      msg.includes('Failed to fetch') ||
      msg.includes('NetworkError') ||
      msg.includes('ERR_');

    if (isNetworkError) {
      setOffline();
      showOfflineModeToast();

      // GET: serve from cache
      if (isGet && !isAuth) {
        const cached = readCache(path);
        if (cached) {
          return cached.data as T;
        }
        // No cache yet — return empty/fallback
        if (path.includes('/api/setting/dashboard')) {
          return {
            tasks: { total: 0, done: 0, pending: 0, recent: [] },
            notes: { total: 0, due: 0, dueList: [] },
            focus: { totalSessions: 0, totalMin: 0 },
            checkin: { total: 0, streak: 0, todayChecked: false, makeupLeft: 3 },
            goal: { targetMinutes: 120 },
            journal: { content: '' },
            achievements: [],
            newUnlocks: [],
          } as T;
        }
        return (Array.isArray((window as any).__emptyArray) ? [] : []) as T;
      }

      // Write: queue for later
      if (!isGet) {
        queueOp(method, path, body);
        invalidateCache(path.split('?')[0]);
        throw new Error('已加入同步队列，网络恢复后自动提交');
      }

      throw new Error('当前离线，暂无缓存数据');
    }

    throw err;
  }
}

// Init online/offline listeners with auto-sync
initOfflineListeners(async () => {
  const q = getQueue();
  if (!q.length) return;

  try {
    await processQueue(api);
    if (getQueue().length === 0) {
      setOnline();
      // Show success
      const el = document.createElement('div');
      el.className =
        'fixed top-4 left-1/2 -translate-x-1/2 z-[9999] rounded-2xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg';
      el.textContent = '数据已同步到云端';
      document.body.appendChild(el);
      setTimeout(() => { el.style.opacity = '0';
        el.style.transition = 'opacity 0.3s'; }, 2500);
      setTimeout(() => el.remove(), 3000);
      // Refresh dashboard data
      window.dispatchEvent(new CustomEvent('sync-complete'));
    }
  } catch {
    // stay offline, try later
  }
});
