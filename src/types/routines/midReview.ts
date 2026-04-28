export type MidReviewCondition =
  | "시간대"
  | "장소"
  | "습관"
  | "컨디션"
  | "감정"
  | "전날 행동";

export interface MidReview {
  id: string;
  userId: string;
  userName: string;
  userEmoji?: string;
  avatarUrl?: string;
  createdAt: string;
  // Step 1: 잘 됐던 날 패턴
  goodConditions: MidReviewCondition[];
  goodConditionDetails: Partial<Record<MidReviewCondition, string>>;
  // Step 2: 어려웠던 날 패턴
  hardConditions: MidReviewCondition[];
  hardConditionDetails: Partial<Record<MidReviewCondition, string>>;
  // Step 3: 초심 점검
  whyStarted: string;
  keepDoing: string;
  willChange: string;
}
