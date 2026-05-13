import { cn } from '../lib/utils';

interface Props {
  remaining: number;   // 剩余秒数
  total: number;       // 总秒数
  status: string;      // 用于控制颜色
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function TimerDisplay({ remaining, total, status }: Props) {
  const progress = total > 0 ? remaining / total : 1;
  const radius = 140;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - progress);

  const isActive = status === 'running' || status === 'paused';

  return (
    <div className="relative flex items-center justify-center">
      {/* SVG 环形进度条 */}
      <svg width={320} height={320} className="-rotate-90">
        {/* 背景环 */}
        <circle
          cx={160}
          cy={160}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={8}
          className="text-gray-200 dark:text-gray-700"
        />
        {/* 进度环 */}
        <circle
          cx={160}
          cy={160}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={8}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={cn(
            'transition-[stroke-dashoffset] duration-500',
            status === 'failed' && 'text-red-500',
            status === 'completed' && 'text-green-500',
            isActive && 'text-blue-600 dark:text-blue-400',
            status === 'idle' && 'text-gray-300 dark:text-gray-600',
          )}
        />
      </svg>

      {/* 中央时间 */}
      <div className="absolute flex flex-col items-center">
        <span
          className={cn(
            'text-6xl font-bold tabular-nums tracking-tight',
            status === 'failed' && 'text-red-500',
            status === 'completed' && 'text-green-500',
            (isActive || status === 'idle') && 'text-gray-900 dark:text-gray-100',
          )}
        >
          {formatTime(remaining)}
        </span>
        {status === 'paused' && (
          <span className="mt-2 text-sm font-medium text-amber-500">已暂停</span>
        )}
        {status === 'idle' && (
          <span className="mt-2 text-sm text-gray-400 dark:text-gray-500">准备就绪</span>
        )}
      </div>
    </div>
  );
}
