/**
 * 포인트 제도 최초 도입 시각.
 * 첫 리추얼 기간에서는 이 시각 이전 활동을 제외하고,
 * 이후 기간부터는 각 리추얼 기간 시작 시각을 기준으로 포인트를 초기화한다.
 */
export const POINTS_LAUNCHED_AT = "2026-08-07T02:25:23Z";

// 이전 활동의 적립 점수는 유지하고 이 시각부터 새 정책을 적용한다.
export const COMMENT_ONLY_POINTS_STARTED_AT = "2026-09-07T06:15:12Z";

export const LIKE_POINT = 0;
export const COMMENT_POINT = 1;
export const DAILY_POINT_LIMIT = 5;

export function getEngagementBasePoints(
  type: "like" | "comment",
  createdAt: string,
): number {
  if (Date.parse(createdAt) < Date.parse(COMMENT_ONLY_POINTS_STARTED_AT)) {
    return type === "like" ? 1 : 2;
  }
  return type === "like" ? LIKE_POINT : COMMENT_POINT;
}
