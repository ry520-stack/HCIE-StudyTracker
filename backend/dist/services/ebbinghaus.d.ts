/**
 * 根据已完成复习次数，计算下一次复习时间
 * @param reviewCount 已完成复习次数
 * @returns 下一次复习的 Date 对象
 */
export declare function getNextReviewTime(reviewCount: number): Date;
/**
 * 根据已过天数计算理论记忆留存率
 * 使用指数衰减模型: R = e^(-t / S)
 * 其中 t = 经过天数, S = 记忆稳定系数（随复习次数递增）
 * @param elapsedDays 距离上次复习的天数
 * @param reviewCount 已完成复习次数
 * @returns 留存率 (0~1)
 */
export declare function getRetentionRate(elapsedDays: number, reviewCount: number): number;
//# sourceMappingURL=ebbinghaus.d.ts.map