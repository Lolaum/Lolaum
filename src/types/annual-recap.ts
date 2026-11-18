import type {
  Book,
  Challenge,
  ChallengeRegistration,
  Database,
  Declaration,
  FinalReviewDB,
  MidReviewDB,
  RitualRecord,
  RoutineTypeDB,
} from "@/types/supabase";

export const RECAP_START_DATE = "2026-05-01";

export interface AnnualRecapSource {
  userId: string;
  name: string;
  asOf: string;
  periods: Pick<
    Database["public"]["Tables"]["challenge_periods"]["Row"],
    "id" | "label" | "start_date" | "end_date"
  >[];
  challenges: Pick<Challenge, "id" | "user_id" | "period_id" | "reset_at">[];
  registrations: Pick<
    ChallengeRegistration,
    "id" | "user_id" | "challenge_id" | "routine_type" | "registered_at"
  >[];
  records: Pick<
    RitualRecord,
    | "id"
    | "user_id"
    | "challenge_id"
    | "routine_type"
    | "record_date"
    | "record_data"
    | "created_at"
  >[];
  declarations: Declaration[];
  midReviews: MidReviewDB[];
  finalReviews: FinalReviewDB[];
  books: Pick<Book, "id" | "title" | "author">[];
}

export interface RecapCount {
  label: string;
  count: number;
}

export interface RecapQuote {
  date: string;
  label: string;
  text: string;
}

export const RECAP_MILESTONE_COUNTS = [
  10, 30, 50, 100, 150, 200, 250, 300,
] as const;

export interface RecapMilestone {
  count: (typeof RECAP_MILESTONE_COUNTS)[number];
  date: string;
  recordId: string;
  routineType: RoutineTypeDB;
  text: string;
}

export interface RecapRoutineInsight {
  type: RoutineTypeDB;
  label: string;
  recordDays: number;
  metrics: { label: string; value: string }[];
  highlights: string[];
  note: string;
}

export interface AnnualRecap {
  year: number;
  name: string;
  asOf: string;
  participation: {
    months: number[];
    longestMonths: number;
    routines: { type: RoutineTypeDB; label: string; months: number }[];
    favorites: RoutineTypeDB[];
    combinations: { types: RoutineTypeDB[]; months: number }[];
    maxRoutineCount: number;
    maxRoutineMonths: number[];
  };
  activity: {
    recordCount: number;
    certificationCount: number;
    days: number;
    longestStreak: number;
    weekdays: { day: number; label: string; certifications: number }[];
    monthly: {
      month: number;
      records: number;
      certifications: number;
      days: number;
    }[];
    busiestMonths: number[];
    firstRecord: RecapQuote | null;
    lastRecord: RecapQuote | null;
    milestones: RecapMilestone[];
  };
  achievement: {
    periods: {
      id: string;
      label: string;
      start: string;
      end: string;
      rate: number;
      ended: boolean;
    }[];
    bestIds: string[];
    perfectCount: number;
    allRoutineDays: number;
    completeWeeks: number;
  };
  reflection: {
    firstDeclaration: RecapQuote | null;
    latestReview: RecapQuote | null;
    goodConditions: RecapCount[];
    hardConditions: RecapCount[];
    keepCount: number;
    reviewCount: number;
    keywords: RecapCount[];
  };
  representatives: RoutineTypeDB[];
  representativeBasis: "certifications" | "registrations";
  routines: RecapRoutineInsight[];
}
