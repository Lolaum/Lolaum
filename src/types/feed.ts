// 인증 피드 관련 타입 정의

import { DailyExpense } from "./routines/finance";

export type RoutineCategory =
  | "운동"
  | "영어"
  | "독서"
  | "모닝"
  | "제2외국어"
  | "자산관리";

// 루틴별 피드 데이터 타입
export interface ExerciseFeedData {
  images: string[];
  exerciseName: string;
  duration: number;
  achievement: string;
}

export interface MorningFeedData {
  image?: string;
  condition: number;
  successAndReflection: string;
  gift: string;
}

export interface FinanceFeedData {
  dailyExpenses: DailyExpense[];
  studyContent: string;
  practice: string;
}

export interface LanguageFeedData {
  images: string[];
  achievement: string;
  expressions: { word: string; meaning: string; example: string }[];
}

export interface ReadingFeedData {
  bookTitle: string;
  author: string;
  bookCover?: string;
  trackingType?: "page" | "percent";
  pagesRead?: number;       // page: 현재 페이지 / percent: 현재 %
  totalPages?: number;      // page: 전체 페이지 / percent: 100
  progressAmount?: number;  // 오늘 읽은 페이지 수 or % 진행량
  noteType?: "sentence" | "summary";
  note?: string;            // 오늘의 문장 or 내용 요약
  thoughts?: string;        // 나만의 생각
  notes?: string;           // 기존 필드 (하위 호환)
}

export type FeedRoutineData =
  | ExerciseFeedData
  | MorningFeedData
  | FinanceFeedData
  | LanguageFeedData
  | ReadingFeedData;

// 댓글 타입
export interface Comment {
  id: number;
  userId: number;
  userName: string;
  text: string;
  date: string;
}

export interface FeedItem {
  id: number;
  userId: number;
  userName: string;
  userProfileImage?: string;
  date: string; // ISO 형식 날짜
  routineCategory: RoutineCategory;
  routineId: number;
  recordId: number;
  routineData?: FeedRoutineData;
  comments?: Comment[];
}

export interface FeedContainerProps {
  // 필요시 추가
}
