// 인증 게시글 관련 타입 정의

import { DailyExpense } from "./routines/finance";
import type { CleanupArea, CleanupMetricType } from "@/types/supabase";

export type RoutineCategory =
  | "운동"
  | "영어"
  | "독서"
  | "모닝"
  | "제2외국어"
  | "기록"
  | "자산관리"
  | "정돈"
  | "원서읽기"
  | "내 글 감상"
  | "회고";

// 리추얼별 게시글 데이터 타입
export interface ExerciseFeedData {
  recordType?: "exercise" | "diet";
  images: string[];
  exerciseName: string;
  duration: number;
  macros?: string;
  achievement: string;
  certPhotos?: string[];
}

export interface MorningFeedData {
  recordType?: "weekday" | "weekend";
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

export interface CleanupFeedData {
  area: CleanupArea;
  customArea?: string;
  certPhotos?: string[];
  metric?: {
    type?: CleanupMetricType;
    label?: string;
    value: number;
    unit?: string;
  };
  metrics?: {
    type?: CleanupMetricType;
    label?: string;
    value: number;
    unit?: string;
  }[];
  note: string;
}

export type RecordingMode = "write" | "read";

export interface RecordingWriteEntry {
  type: "write";
  title?: string;
  content: string;
  link?: string;
  duration?: number;
}

export interface RecordingReadEntry {
  type: "read";
  readAuthorUserId?: string;
  readAuthorName?: string;
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
  title?: string;
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
          readAuthorName: d.readSourceTitle ?? "",
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
        title: d.title ?? "",
        content: d.content ?? "",
        link: d.link,
        duration: d.duration,
      },
    ];
  }
  return [];
}

export interface LanguageFeedData {
  recordType?: "study" | "review_test";
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

export type ReflectionFeedKind = "declaration" | "mid-review" | "final-review";

export interface ReflectionFeedData {
  kind: ReflectionFeedKind;
  title: string;
  subtitle?: string;
  preview: string;
  chips?: string[];
}

export type FeedRoutineData =
  | ExerciseFeedData
  | MorningFeedData
  | FinanceFeedData
  | CleanupFeedData
  | LanguageFeedData
  | ReadingFeedData
  | RecordingFeedData
  | ReflectionFeedData;

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
  date: string; // ISO 형식 날짜 (record_date — 리추얼 수행일)
  createdAt?: string; // 게시글 작성 시각 (timestamp)
  routineCategory: RoutineCategory;
  routineId: number;
  recordId: number;
  routineData?: FeedRoutineData;
  comments?: Comment[];
  commentCount?: number;
  reactionSummary?: FeedReactionSummary;
  archiveHref?: string;
}

export interface FeedReactionCount {
  emoji: string;
  count: number;
  reactedByMe: boolean;
}

export interface FeedReactionSummary {
  reactions: FeedReactionCount[];
  totalCount: number;
}

export type FeedContainerProps = Record<string, never>;
