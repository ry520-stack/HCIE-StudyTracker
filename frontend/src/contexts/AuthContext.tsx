import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

interface User {
  id: string;
  username: string;
  email: string;
}

interface AuthValue {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  ready: boolean;
}

const AuthContext = createContext<AuthValue | null>(null);

const TOKEN_KEY = 'st-token';
const USER_KEY = 'st-user';

function loadAuth(): { user: User | null; token: string | null } {
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    const user = JSON.parse(localStorage.getItem(USER_KEY) || 'null');
    return { token, user };
  } catch {
    return { token: null, user: null };
  }
}

function saveAuth(token: string, user: User) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

const BASE = (import.meta as any).env?.VITE_API_BASE || '';
const API = BASE + '/api/auth';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  // 初始化：从 localStorage 恢复
  useEffect(() => {
    const saved = loadAuth();
    if (saved.token) {
      setToken(saved.token);
      setUser(saved.user);
    }
    setReady(true);
  }, []);

  const login = async (email: string, password: string) => {
    let res: Response;
    try {
      res = await fetch(`${API}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
    } catch {
      throw new Error('无法连接服务器，请检查后端是否已启动');
    }
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || '登录失败');

    setToken(data.token);
    setUser(data.user);
    saveAuth(data.token, data.user);
  };

  const register = async (username: string, email: string, password: string) => {
    let res: Response;
    try {
      res = await fetch(`${API}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password }),
      });
    } catch {
      throw new Error('无法连接服务器，请检查后端是否已启动');
    }
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || '注册失败');

    setToken(data.token);
    setUser(data.user);
    saveAuth(data.token, data.user);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    clearAuth();
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, ready }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be within AuthProvider');
  return ctx;
}
