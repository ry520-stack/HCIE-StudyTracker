const CACHE_PREFIX = 'st-cache-';
const QUEUE_KEY = 'st-offline-queue';
const STATUS_KEY = 'st-online-status';

interface QueuedOp {
  id: string;
  method: string;
  path: string;
  body?: unknown;
  queuedAt: string;
  retries: number;
}

export function isOnline(): boolean {
  return navigator.onLine && localStorage.getItem(STATUS_KEY) !== 'offline';
}

export function setOffline() {
  localStorage.setItem(STATUS_KEY, 'offline');
  window.dispatchEvent(new CustomEvent('sync-status-change', { detail: { online: false } }));
}

export function setOnline() {
  localStorage.removeItem(STATUS_KEY);
  window.dispatchEvent(new CustomEvent('sync-status-change', { detail: { online: true } }));
}

// Cache a successful GET response
export function cacheGet(path: string, data: unknown) {
  try {
    const key = CACHE_PREFIX + path;
    localStorage.setItem(key, JSON.stringify({ data, ts: Date.now() }));
  } catch { /* storage full, ignore */ }
}

// Read cached GET response
export function readCache(path: string): { data: unknown; ts: number } | null {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + path);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

// Remove stale cache for a path
export function invalidateCache(pattern: string) {
  const prefix = CACHE_PREFIX;
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith(prefix) && k.includes(pattern)) {
      localStorage.removeItem(k);
    }
  }
}

// Queue a write operation for later sync
export function queueOp(method: string, path: string, body?: unknown) {
  const ops = getQueue();
  ops.push({
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    method,
    path,
    body,
    queuedAt: new Date().toISOString(),
    retries: 0,
  });
  localStorage.setItem(QUEUE_KEY, JSON.stringify(ops));
}

export function getQueue(): QueuedOp[] {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function removeFromQueue(id: string) {
  const ops = getQueue().filter(o => o.id !== id);
  localStorage.setItem(QUEUE_KEY, JSON.stringify(ops));
}

export function queueLength(): number {
  return getQueue().length;
}

// Process the offline queue — call when back online
export async function processQueue(
  apiFn: (method: string, path: string, body?: unknown) => Promise<unknown>,
  onProgress?: (done: number, total: number) => void,
) {
  const ops = getQueue();
  if (!ops.length) return;

  let done = 0;
  const remaining: QueuedOp[] = [];

  for (const op of ops) {
    try {
      await apiFn(op.method, op.path, op.body);
      done++;
      onProgress?.(done, ops.length);
    } catch (e: unknown) {
      // If still a network error, stop processing
      const msg = (e as Error).message || '';
      if (msg.includes('无法连接') || msg.includes('网络') || msg.includes('fetch')) {
        remaining.push(op);
        break; // stop, we're still offline
      }
      // If 409/duplicate, skip it (already synced)
      if (msg.includes('409') || msg.includes('已存在') || msg.includes('duplicate')) {
        done++;
        onProgress?.(done, ops.length);
        continue;
      }
      // Other errors: retry up to 3 times
      op.retries++;
      if (op.retries < 3) {
        remaining.push(op);
      }
      done++;
      onProgress?.(done, ops.length);
    }
  }

  localStorage.setItem(QUEUE_KEY, JSON.stringify(remaining));
}

// Listen for online/offline events
export function initOfflineListeners(processFn?: () => void) {
  window.addEventListener('online', () => {
    setOnline();
    processFn?.();
  });
  window.addEventListener('offline', () => {
    setOffline();
  });
  // Initial state
  if (!navigator.onLine) setOffline();
}
