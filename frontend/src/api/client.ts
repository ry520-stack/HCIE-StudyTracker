const TOKEN_KEY = 'hcie-token';

function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem('hcie-user');
}

export async function api<T>(method: string, path: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  // 401 → 登出
  if (res.status === 401) {
    clearAuth();
    window.location.href = '/login';
    throw new Error('未登录');
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}
