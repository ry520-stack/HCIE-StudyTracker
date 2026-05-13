/**
 * 艾宾浩斯遗忘曲线复习间隔（天数）
 * 索引 = 已完成复习次数（reviewCount）
 * 值  = 距下一次复习的天数
 */
const REVIEW_INTERVALS_DAYS = [1, 2, 4, 7, 15, 30, 60, 120];

/**
 * 根据已完成复习次数，计算下一次复习时间
 * @param reviewCount 已完成复习次数
 * @returns 下一次复习的 Date 对象
 */
export function getNextReviewTime(reviewCount: number): Date {
  const index = reviewCount;
  const days =
    index < REVIEW_INTERVALS_DAYS.length
      ? REVIEW_INTERVALS_DAYS[index]
      : REVIEW_INTERVALS_DAYS[REVIEW_INTERVALS_DAYS.length - 1];

  const now = new Date();
  now.setDate(now.getDate() + days);
  now.setHours(0, 0, 0, 0); // 重置到当天 00:00
  return now;
}

/**
 * 根据已过天数计算理论记忆留存率
 * 使用指数衰减模型: R = e^(-t / S)
 * 其中 t = 经过天数, S = 记忆稳定系数（随复习次数递增）
 * @param elapsedDays 距离上次复习的天数
 * @param reviewCount 已完成复习次数
 * @returns 留存率 (0~1)
 */
export function getRetentionRate(elapsedDays: number, reviewCount: number): number {
  // 稳定系数：复习次数越多，记忆越稳定
  const stability = 1 + reviewCount * 2; // 1, 3, 5, 7, ...
  return Math.exp(-elapsedDays / stability);
}
