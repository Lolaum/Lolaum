// 인증 게시글 관련 타입 정의

import { DailyExpense } from "./routines/finance";

export type RoutineCategory =
  | "운동"
  | "영어"
  | "독서"
  | "모닝"
  | "제2외국어"
  | "기록"
  | "자산관리"
  | "원서읽기";

// 리추얼별 게시글 데이터 타입
export interface ExerciseFeedData {
  images: string[];
  exerciseName: string;
  duration: number;
  achievement: string;
  certPhotos?: string[];
}

export interface MorningFeedData {
  image?: string;
  sleepHours: number;
  sleepImprovement?: string;
  condition: "상" | "중" | "하";
  success: string;
  reflection: string;
  certPhotos?: string[];
}

export interface FinanceFeedData {
  dailyExpenses: DailyExpense[];
  studyContent: string;
  practice: string;
  certPhotos?: string[];
}

export type RecordingMode = "write" | "read";

export interface RecordingWriteEntry {
  type: "write";
  content: string;
  link?: string;
  duration?: number;
}

export interface RecordingReadEntry {
  type: "read";
  readSourceTitle: string;
  readResonatedPart: string;
  readReason: string;
}

export type RecordingEntry = RecordingWriteEntry | RecordingReadEntry;

export interface RecordingFeedData {
  // 신규: 여러 항목 묶음
  entries?: RecordingEntry[];
  // 레거시 단일 항목 필드 (하위 호환)
  recordType?: RecordingMode;
  content?: string;
  link?: string;
  duration?: number;
  readSourceTitle?: string;
  readResonatedPart?: string;
  readReason?: string;
  certPhotos?: string[];
}

export function normalizeRecordingFeedEntries(
  d: RecordingFeedData,
): RecordingEntry[] {
  if (d.entries && d.entries.length > 0) return d.entries;
  if (d.recordType === "read") {
    if (d.readSourceTitle || d.readResonatedPart || d.readReason) {
      return [
        {
          type: "read",
          readSourceTitle: d.readSourceTitle ?? "",
          readResonatedPart: d.readResonatedPart ?? "",
          readReason: d.readReason ?? "",
        },
      ];
    }
    return [];
  }
  if (d.content || d.link || d.duration) {
    return [
      {
        type: "write",
        content: d.content ?? "",
        link: d.link,
        duration: d.duration,
      },
    ];
  }
  return [];
}

export interface LanguageFeedData {
  images: string[];
  achievement: string;
  expressions: { word: string; meaning: string; example: string }[];
  certPhotos?: string[];
}

export interface ReadingFeedData {
  bookTitle: string;
  author: string;
  bookCover?: string;
  trackingType?: "page" | "percent";
  pagesRead?: number; // page: 현재 페이지 / percent: 현재 %
  totalPages?: number; // page: 전체 페이지 / percent: 100
  progressAmount?: number; // 오늘 읽은 페이지 수 or % 진행량
  noteType?: "sentence" | "summary";
  note?: string; // 오늘의 문장 or 내용 요약
  thoughts?: string; // 나만의 생각
  notes?: string; // 기존 필드 (하위 호환)
  certPhotos?: string[];
}

export type FeedRoutineData =
  | ExerciseFeedData
  | MorningFeedData
  | FinanceFeedData
  | LanguageFeedData
  | ReadingFeedData
  | RecordingFeedData;

// 댓글 타입
export interface Comment {
  id: number;
  odOriginalId?: string; // DB UUID (실제 데이터용)
  userId: number;
  userName: string;
  text: string;
  date: string;
}

export interface FeedItem {
  id: number | string;
  odOriginalId?: string; // DB UUID (실제 데이터용)
  userId: number | string;
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
