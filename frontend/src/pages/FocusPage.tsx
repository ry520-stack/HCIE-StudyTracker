import { useEffect, useRef, useState } from 'react';
import { Play, Pause, XCircle, RotateCcw } from 'lucide-react';
import TimerDisplay from '../components/TimerDisplay';
import SessionStats from '../components/SessionStats';
import { createSession, updateSession } from '../api/focus';
import { cn } from '../lib/utils';

type SessionStatus = 'idle' | 'running' | 'paused' | 'completed' | 'failed';

const PRESETS = [15, 30, 45, 60];
const DEFAULT_MINUTES = 45;
const FAIL_THRESHOLD_MS = 60_000;

export default function FocusPage() {
  // ---- 公开状态 ----
  const [status, setStatus] = useState<SessionStatus>('idle');
  const [duration, setDuration] = useState(DEFAULT_MINUTES * 60);
  const [remaining, setRemaining] = useState(DEFAULT_MINUTES * 60);
  const [customMinutes, setCustomMinutes] = useState(DEFAULT_MINUTES);

  // ---- Refs ----
  const statusRef = useRef<SessionStatus>('idle');
  const remainingRef = useRef(DEFAULT_MINUTES * 60);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hiddenStartRef = useRef<number | null>(null);  // 本次切出时的 wall-clock
  const totalHiddenRef = useRef(0);                     // 累计 hidden ms（本次 run 周期）
  const switchedRef = useRef(0);
  const sessionIdRef = useRef<string | null>(null);
  const lastTickRef = useRef(0);                        // 上次心跳的 wall-clock

  function setAllStatus(s: SessionStatus) {
    statusRef.current = s;
    setStatus(s);
  }

  // ---- 清理定时器 ----
  function clearTick() {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }

  // ---- 结束会话 ----
  async function finishSession(finalStatus: 'COMPLETED' | 'FAILED') {
    clearTick();
    const sid = sessionIdRef.current;
    if (sid) {
      const elapsed = duration - remainingRef.current;
      try {
        await updateSession(sid, {
          status: finalStatus,
          elapsed,
          switched: switchedRef.current,
        });
      } catch { /* 静默 */ }
    }
    setAllStatus(finalStatus === 'COMPLETED' ? 'completed' : 'failed');
  }

  // ============================================================
  //  Effect ①：visibilitychange 切屏检测
  // ============================================================
  useEffect(() => {
    function onVisibility() {
      if (statusRef.current !== 'running') return;

      if (document.hidden) {
        hiddenStartRef.current = Date.now();
      } else {
        const hs = hiddenStartRef.current;
        if (hs !== null) {
          const hiddenMs = Date.now() - hs;
          totalHiddenRef.current += hiddenMs;
          switchedRef.current += 1;
          hiddenStartRef.current = null;

          if (hiddenMs >= FAIL_THRESHOLD_MS) {
            finishSession('FAILED');
          }
        }
      }
    }

    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ============================================================
  //  Effect ②：倒计时心跳（仅 status === running 时运行）
  // ============================================================
  useEffect(() => {
    if (status !== 'running') return;

    lastTickRef.current = Date.now();

    intervalRef.current = setInterval(() => {
      const now = Date.now();
      // 隐藏时间先扣：只扣除用户真正在界面上的时间
      const hiddenMs = totalHiddenRef.current;
      totalHiddenRef.current = 0;
      const effectiveDelta = now - lastTickRef.current - hiddenMs;
      lastTickRef.current = now;

      // 只扣除实际有效的秒数
      const deduct = Math.max(0, Math.floor(effectiveDelta / 1000));
      remainingRef.current = Math.max(0, remainingRef.current - deduct);

      // 同步到 React 状态
      setRemaining(remainingRef.current);

      // 倒计时归零 → 完成
      if (remainingRef.current <= 0) {
        finishSession('COMPLETED');
        return;
      }

      // 切出后从未切回、且已超过阈值 → 判负
      if (
        hiddenStartRef.current !== null &&
        Date.now() - hiddenStartRef.current >= FAIL_THRESHOLD_MS
      ) {
        finishSession('FAILED');
      }
    }, 1000);

    return clearTick;
  }, [status]); // eslint-disable-line react-hooks/exhaustive-deps

  // ============================================================
  //  事件处理
  // ============================================================
  function handleStart() {
    const totalSec = customMinutes * 60;
    setDuration(totalSec);
    remainingRef.current = totalSec;
    setRemaining(totalSec);
    switchedRef.current = 0;
    totalHiddenRef.current = 0;
    hiddenStartRef.current = null;

    createSession(totalSec).then((s) => {
      sessionIdRef.current = s.id;
    });

    setAllStatus('running');
  }

  function handlePause() {
    clearTick();
    // 把自从 hidden 的切出时间也补上（如果切出中按了暂停）
    if (hiddenStartRef.current !== null) {
      totalHiddenRef.current += Date.now() - hiddenStartRef.current;
      hiddenStartRef.current = null;
    }
    setAllStatus('paused');
  }

  function handleResume() {
    totalHiddenRef.current = 0; // 暂停期间的时间都不计入
    setAllStatus('running');
  }

  function handleAbort() {
    clearTick();
    const sid = sessionIdRef.current;
    if (sid) {
      const elapsed = duration - remainingRef.current;
      updateSession(sid, { status: 'FAILED', elapsed, switched: switchedRef.current });
    }
    sessionIdRef.current = null;
    remainingRef.current = duration;
    setRemaining(duration);
    setAllStatus('idle');
  }

  function handleReset() {
    sessionIdRef.current = null;
    remainingRef.current = duration;
    setRemaining(duration);
    setAllStatus('idle');
  }

  // ============================================================
  //  渲染
  // ============================================================
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      {/* 标题 */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">专注倒计时</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          切屏超过 1 分钟将自动判定失败
        </p>
      </div>

      {/* 计时器 + 控制面板 */}
      <div className="flex flex-col items-center space-y-6 rounded-2xl border border-gray-200 bg-white p-8 dark:border-gray-700 dark:bg-gray-900">
        <TimerDisplay remaining={remaining} total={duration} status={status} />

        {/* 时长预设（仅 idle） */}
        {status === 'idle' && (
          <div className="flex flex-col items-center gap-3">
            <div className="flex gap-2">
              {PRESETS.map((m) => (
                <button
                  key={m}
                  onClick={() => {
                    setCustomMinutes(m);
                    const s = m * 60;
                    setDuration(s);
                    remainingRef.current = s;
                    setRemaining(s);
                  }}
                  className={cn(
                    'rounded-lg px-4 py-1.5 text-sm font-medium transition-colors',
                    customMinutes === m
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700',
                  )}
                >
                  {m} 分钟
                </button>
              ))}
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              自定义：
              <input
                type="number"
                min={1}
                max={480}
                value={customMinutes}
                onChange={(e) => {
                  const v = Math.max(1, Math.min(480, Number(e.target.value) || 1));
                  setCustomMinutes(v);
                  const s = v * 60;
                  setDuration(s);
                  remainingRef.current = s;
                  setRemaining(s);
                }}
                className="w-20 rounded-lg border border-gray-300 px-3 py-1 text-center text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
              />
              分钟
            </label>
          </div>
        )}

        {/* 开始按钮 */}
        {status === 'idle' && (
          <button
            onClick={handleStart}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-8 py-3 text-white shadow-lg shadow-blue-600/25 transition-all hover:bg-blue-700 active:scale-[0.97]"
          >
            <Play size={20} fill="white" />
            开始专注
          </button>
        )}

        {/* 运行中 */}
        {status === 'running' && (
          <div className="flex gap-3">
            <button
              onClick={handlePause}
              className="flex items-center gap-2 rounded-xl bg-amber-500 px-6 py-2.5 text-white transition-colors hover:bg-amber-600 active:scale-[0.97]"
            >
              <Pause size={18} fill="white" />
              暂停
            </button>
            <button
              onClick={handleAbort}
              className="flex items-center gap-2 rounded-xl border border-gray-300 px-6 py-2.5 text-gray-600 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-800"
            >
              <XCircle size={18} />
              放弃
            </button>
          </div>
        )}

        {/* 已暂停 */}
        {status === 'paused' && (
          <div className="flex gap-3">
            <button
              onClick={handleResume}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-white transition-colors hover:bg-blue-700 active:scale-[0.97]"
            >
              <Play size={18} fill="white" />
              继续
            </button>
            <button
              onClick={handleAbort}
              className="flex items-center gap-2 rounded-xl border border-gray-300 px-6 py-2.5 text-gray-600 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-800"
            >
              <XCircle size={18} />
              放弃
            </button>
          </div>
        )}

        {/* 完成 / 失败 */}
        {(status === 'completed' || status === 'failed') && (
          <div className="flex flex-col items-center gap-3">
            <p
              className={cn(
                'text-lg font-semibold',
                status === 'completed' && 'text-green-600 dark:text-green-400',
                status === 'failed' && 'text-red-600 dark:text-red-400',
              )}
            >
              {status === 'completed' ? '🎉 专注完成！' : '⏰ 专注失败，切屏超时'}
            </p>
            <button
              onClick={handleReset}
              className="flex items-center gap-2 rounded-xl bg-gray-900 px-6 py-2.5 text-white transition-colors hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200"
            >
              <RotateCcw size={18} />
              再来一次
            </button>
          </div>
        )}
      </div>

      {/* 今日统计 */}
      <SessionStats />
    </div>
  );
}
