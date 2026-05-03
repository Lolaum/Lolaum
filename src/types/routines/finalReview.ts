export type ContinuationChoice = "keep" | "adjust";

export interface FinalReview {
  id: string;
  userId: string;
  userName: string;
  userEmoji?: string;
  avatarUrl?: string;
  createdAt: string;
  results: string;
  lifeChanges: string;
  continuationChoice: ContinuationChoice;
  adjustmentNote: string;
  feedback: string;
}
