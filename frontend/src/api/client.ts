const TOKEN_KEY = 'st-token';

function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem('st-user');
}

export async function api<T>(method: string, path: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(path, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error('无法连接服务器，请检查网络或后端是否已启动');
  }

  // 401 → 登出
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
  return data as T;
}
