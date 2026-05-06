"use client";

/* eslint-disable @next/next/no-img-element */
import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, User, X, ChevronLeft, ChevronRight, Pencil, Trash2 } from "lucide-react";
import {
  BookText,
  Dumbbell,
  BookA,
  Sun,
  Languages,
  CircleDollarSign,
  Pen,
  BookOpen,
} from "lucide-react";
import {
  FeedItem,
  Comment,
  ExerciseFeedData,
  MorningFeedData,
  FinanceFeedData,
  LanguageFeedData,
  ReadingFeedData,
  RecordingFeedData,
  RoutineCategory,
  normalizeRecordingFeedEntries,
} from "@/types/feed";
import { addComment, deleteComment, updateComment } from "@/api/comment";
import { deleteRitualRecord } from "@/api/ritual-record";
import CommentSection from "./CommentSection";
import EditFeedRecord from "./EditFeedRecord";
import LinkifiedText from "@/components/common/LinkifiedText";

interface FeedDetailProps {
  item: FeedItem;
  isMine?: boolean;
}

// 디자인 시스템 기반 카테고리 메타
const CATEGORY_META: Record<
  string,
  { icon: React.ReactNode; label: string; hexColor: string; bgColor: string }
> = {
  독서: {
    icon: <BookText className="w-5 h-5" />,
    label: "독서",
    hexColor: "#6366f1",
    bgColor: "#eef2ff",
  },
  운동: {
    icon: <Dumbbell className="w-5 h-5" />,
    label: "운동",
    hexColor: "#ff8900",
    bgColor: "#fff4e5",
  },
  영어: {
    icon: <BookA className="w-5 h-5" />,
    label: "영어",
    hexColor: "#0ea5e9",
    bgColor: "#f0f9ff",
  },
  모닝: {
    icon: <Sun className="w-5 h-5" />,
    label: "모닝 리추얼",
    hexColor: "#eab32e",
    bgColor: "#fefce8",
  },
  제2외국어: {
    icon: <Languages className="w-5 h-5" />,
    label: "제2외국어 학습",
    hexColor: "#10b981",
    bgColor: "#ecfdf5",
  },
  기록: {
    icon: <Pen className="w-5 h-5" />,
    label: "기록",
    hexColor: "#8b5cf6",
    bgColor: "#f5f3ff",
  },
  자산관리: {
    icon: <CircleDollarSign className="w-5 h-5" />,
    label: "자산관리",
    hexColor: "#10b981",
    bgColor: "#ecfdf5",
  },
  원서읽기: {
    icon: <BookOpen className="w-5 h-5" />,
    label: "원서읽기",
    hexColor: "#ec4899",
    bgColor: "#fdf2f8",
  },
};

// 카테고리별 아이콘 & 레이블
const getCategoryMeta = (category: RoutineCategory) => {
  return (
    CATEGORY_META[category] ?? {
      icon: <BookText className="w-5 h-5" />,
      label: category,
      hexColor: "#6b7280",
      bgColor: "#f3f4f6",
    }
  );
};

const formatFullDate = (dateString: string) => {
  const date = new Date(dateString);
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")}`;
};

// --- 리추얼별 콘텐츠 컴포넌트 ---

function ExerciseContent({ data }: { data: ExerciseFeedData }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-orange-50 rounded-xl p-3">
          <p className="text-xs text-orange-400 font-medium mb-1">운동 종류</p>
          <p className="text-sm font-semibold text-gray-800">
            {data.exerciseName}
          </p>
        </div>
        <div className="bg-orange-50 rounded-xl p-3">
          <p className="text-xs text-orange-400 font-medium mb-1">운동 시간</p>
          <p className="text-sm font-semibold text-gray-800">
            {data.duration}분
          </p>
        </div>
      </div>
      {data.achievement && (
        <div className="bg-gray-50 rounded-xl p-4">
          <p className="text-xs text-gray-400 font-medium mb-1">오늘의 소감</p>
          <p className="text-sm text-gray-700 leading-relaxed">
            {data.achievement}
          </p>
        </div>
      )}
    </div>
  );
}

function MorningContent({ data }: { data: MorningFeedData }) {
  return (
    <div className="space-y-4">
      {/* 수면 시간 & 컨디션 */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-yellow-50 rounded-xl p-4">
          <p className="text-xs text-yellow-500 font-medium mb-1">수면 시간</p>
          <p className="text-2xl font-bold text-gray-800">
            {data.sleepHours}
            <span className="text-sm font-medium text-gray-500">h</span>
          </p>
        </div>
        <div className="bg-yellow-50 rounded-xl p-4">
          <p className="text-xs text-yellow-500 font-medium mb-1">컨디션</p>
          <p className="text-2xl font-bold text-gray-800">{data.condition}</p>
        </div>
      </div>
      {data.sleepImprovement && (
        <div className="bg-orange-50 rounded-xl p-4">
          <p className="text-xs text-orange-500 font-medium mb-1">
            수면 부족 원인 & 개선 방법
          </p>
          <p className="text-sm text-gray-700 leading-relaxed">
            {data.sleepImprovement}
          </p>
        </div>
      )}
      <div className="bg-gray-50 rounded-xl p-4">
        <p className="text-xs text-gray-400 font-medium mb-1">
          오늘의 작은 성공 (오늘 한 일)
        </p>
        <p className="text-sm text-gray-700 leading-relaxed">{data.success}</p>
      </div>
      <div className="bg-gray-50 rounded-xl p-4">
        <p className="text-xs text-gray-400 font-medium mb-1">한 줄 회고</p>
        <p className="text-sm text-gray-700 leading-relaxed">
          {data.reflection}
        </p>
      </div>
    </div>
  );
}

function FinanceContent({ data }: { data: FinanceFeedData }) {
  const totalNecessary = data.dailyExpenses
    .flatMap((d) => d.expenses.filter((e) => e.type === "necessary"))
    .reduce((sum, e) => sum + e.amount, 0);

  const totalEmotional = data.dailyExpenses
    .flatMap((d) => d.expenses.filter((e) => e.type === "emotional"))
    .reduce((sum, e) => sum + e.amount, 0);

  const totalValue = data.dailyExpenses
    .flatMap((d) => d.expenses.filter((e) => e.type === "value"))
    .reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="space-y-4">
      {/* 소비 요약 */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-blue-50 rounded-xl p-3">
          <p className="text-xs text-blue-400 font-medium mb-1">필요소비</p>
          <p className="text-sm font-bold text-blue-600">
            {totalNecessary.toLocaleString()}원
          </p>
        </div>
        <div className="bg-red-50 rounded-xl p-3">
          <p className="text-xs text-red-400 font-medium mb-1">감정소비</p>
          <p className="text-sm font-bold text-red-500">
            {totalEmotional.toLocaleString()}원
          </p>
        </div>
        <div className="bg-violet-50 rounded-xl p-3">
          <p className="text-xs text-violet-400 font-medium mb-1">가치소비</p>
          <p className="text-sm font-bold text-violet-600">
            {totalValue.toLocaleString()}원
          </p>
        </div>
      </div>

      {/* 날짜별 소비 내역 */}
      {data.dailyExpenses.map((daily, i) => {
        const dateStr = new Date(daily.date).toLocaleDateString("ko-KR", {
          month: "numeric",
          day: "numeric",
        });
        return (
          <div key={i} className="bg-gray-50 rounded-xl p-4">
            <p className="text-xs text-gray-500 font-semibold mb-2">
              {dateStr}
            </p>
            <div className="space-y-1.5">
              {daily.expenses.map((expense) => (
                <div
                  key={expense.id}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                        expense.type === "necessary"
                          ? "bg-blue-400"
                          : expense.type === "emotional"
                            ? "bg-red-400"
                            : "bg-violet-400"
                      }`}
                    />
                    <span className="text-sm text-gray-700">
                      {expense.name}
                    </span>
                  </div>
                  <span className="text-sm text-gray-600">
                    {expense.amount.toLocaleString()}원
                  </span>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {/* 공부 내용 & 실천 */}
      {data.studyContent && (
        <div className="bg-green-50 rounded-xl p-4">
          <p className="text-xs text-green-500 font-medium mb-1">
            오늘의 자산관리 공부
          </p>
          <p className="text-sm text-gray-700 leading-relaxed">
            {data.studyContent}
          </p>
        </div>
      )}
      {data.practice && (
        <div className="bg-gray-50 rounded-xl p-4">
          <p className="text-xs text-gray-400 font-medium mb-1">
            오늘의 실천 / 다짐
          </p>
          <p className="text-sm text-gray-700 leading-relaxed">
            {data.practice}
          </p>
        </div>
      )}
    </div>
  );
}

function LanguageContent({ data }: { data: LanguageFeedData }) {
  return (
    <div className="space-y-4">
      {data.achievement && (
        <div className="bg-purple-50 rounded-xl p-3">
          <p className="text-xs text-purple-400 font-medium mb-1">
            오늘의 성취
          </p>
          <p className="text-sm font-semibold text-gray-800">
            {data.achievement}
          </p>
        </div>
      )}
      {data.expressions.length > 0 && (
        <div>
          <p className="text-xs text-gray-500 font-semibold mb-2">
            오늘 배운 표현
          </p>
          <div className="space-y-2">
            {data.expressions.map((expr, i) => (
              <div key={i} className="bg-gray-50 rounded-xl p-3">
                <div className="flex items-start gap-2 mb-1">
                  <span className="text-sm font-bold text-gray-800">
                    {expr.word}
                  </span>
                  <span className="text-sm text-gray-400">—</span>
                  <span className="text-sm text-gray-600">{expr.meaning}</span>
                </div>
                {expr.example && (
                  <p className="text-xs text-gray-500 italic pl-0">
                    &quot;{expr.example}&quot;
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ReadingContent({ data }: { data: ReadingFeedData }) {
  const isPercent = data.trackingType === "percent";
  const progress =
    data.pagesRead != null && data.totalPages
      ? Math.round((data.pagesRead / data.totalPages) * 100)
      : null;

  return (
    <div className="space-y-4">
      {/* 책 정보 */}
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-16 h-20 bg-orange-100 rounded-lg flex items-center justify-center overflow-hidden">
          {data.bookCover ? (
            <img
              src={data.bookCover}
              alt={data.bookTitle}
              className="w-full h-full object-cover"
            />
          ) : (
            <BookText className="w-7 h-7 text-orange-300" />
          )}
        </div>
        <div className="flex-1">
          <p className="text-base font-bold text-gray-900">{data.bookTitle}</p>
          {data.author && (
            <p className="text-sm text-gray-500 mt-0.5">{data.author}</p>
          )}
          {progress !== null && (
            <div className="mt-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-400">진도</span>
                <span className="text-xs font-semibold text-orange-500">
                  {isPercent
                    ? `${data.pagesRead}% (${progress}%)`
                    : `${data.pagesRead}p / ${data.totalPages}p (${progress}%)`}
                </span>
              </div>
              <div className="w-full bg-orange-100 rounded-full h-1.5">
                <div
                  className="bg-orange-400 h-1.5 rounded-full"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
          {data.progressAmount != null && (
            <p className="text-xs text-orange-400 mt-1.5 font-medium">
              오늘 +{data.progressAmount}
              {isPercent ? "%" : "p"} 읽었어요
            </p>
          )}
        </div>
      </div>

      {/* 오늘의 문장 */}
      {data.note && data.noteType === "sentence" && (
        <div className="bg-orange-50 border-l-2 border-orange-300 rounded-xl p-4">
          <p className="text-xs text-orange-400 font-medium mb-1">
            오늘의 문장
          </p>
          <p className="text-sm text-gray-700 leading-relaxed italic">
            &ldquo;{data.note}&rdquo;
          </p>
        </div>
      )}

      {/* 내용 요약 */}
      {data.note && data.noteType === "summary" && (
        <div className="bg-gray-50 rounded-xl p-4">
          <p className="text-xs text-gray-400 font-medium mb-1">내용 요약</p>
          <p className="text-sm text-gray-700 leading-relaxed">{data.note}</p>
        </div>
      )}

      {/* 나만의 생각 */}
      {data.thoughts && (
        <div className="bg-gray-50 rounded-xl p-4">
          <p className="text-xs text-gray-400 font-medium mb-1">나만의 생각</p>
          <p className="text-sm text-gray-700 leading-relaxed">
            {data.thoughts}
          </p>
        </div>
      )}

      {/* 기존 notes 필드 (하위 호환) */}
      {data.notes && !data.note && (
        <div className="bg-gray-50 rounded-xl p-4">
          <p className="text-xs text-gray-400 font-medium mb-1">독서 노트</p>
          <p className="text-sm text-gray-700 leading-relaxed">{data.notes}</p>
        </div>
      )}
    </div>
  );
}

function EnglishBookContent({ data }: { data: ReadingFeedData }) {
  const isPercent = data.trackingType === "percent";
  const progress =
    data.pagesRead != null && data.totalPages
      ? Math.round((data.pagesRead / data.totalPages) * 100)
      : null;

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-16 h-20 bg-pink-100 rounded-lg flex items-center justify-center overflow-hidden">
          {data.bookCover ? (
            <img
              src={data.bookCover}
              alt={data.bookTitle}
              className="w-full h-full object-cover"
            />
          ) : (
            <BookOpen className="w-7 h-7 text-pink-300" />
          )}
        </div>
        <div className="flex-1">
          <p className="text-base font-bold text-gray-900">{data.bookTitle}</p>
          {data.author && (
            <p className="text-sm text-gray-500 mt-0.5">{data.author}</p>
          )}
          {progress !== null && (
            <div className="mt-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-400">진도</span>
                <span className="text-xs font-semibold text-pink-500">
                  {isPercent
                    ? `${data.pagesRead}% (${progress}%)`
                    : `${data.pagesRead}p / ${data.totalPages}p (${progress}%)`}
                </span>
              </div>
              <div className="w-full bg-pink-100 rounded-full h-1.5">
                <div
                  className="bg-pink-400 h-1.5 rounded-full"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
          {data.progressAmount != null && (
            <p className="text-xs text-pink-400 mt-1.5 font-medium">
              오늘 +{data.progressAmount}
              {isPercent ? "%" : "p"} 읽었어요
            </p>
          )}
        </div>
      </div>

      <div className="bg-pink-50 rounded-xl p-4 flex items-center gap-2">
        <span className="text-lg">📸</span>
        <p className="text-sm text-pink-500 font-medium">스크린샷 인증 완료</p>
      </div>
    </div>
  );
}

function RecordingContent({ data }: { data: RecordingFeedData }) {
  const entries = normalizeRecordingFeedEntries(data);
  if (entries.length === 0) return null;

  return (
    <div className="space-y-4">
      {entries.map((entry, idx) =>
        entry.type === "read" ? (
          <div
            key={idx}
            className="rounded-xl p-4 bg-violet-50 space-y-3 overflow-hidden"
          >
            <span className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-md text-violet-600 bg-violet-100">
              글 읽기 대체 #{idx + 1}
            </span>
            {entry.readSourceTitle && (
              <div className="min-w-0">
                <p className="text-xs text-violet-400 font-medium mb-1">
                  오늘 읽은 다른 챌린저 글
                </p>
                <LinkifiedText
                  text={entry.readSourceTitle}
                  className="text-sm text-gray-700 leading-relaxed"
                />
              </div>
            )}
            {entry.readResonatedPart && (
              <div className="min-w-0">
                <p className="text-xs text-violet-400 font-medium mb-1">
                  마음에 닿은 부분
                </p>
                <LinkifiedText
                  text={entry.readResonatedPart}
                  className="text-sm text-gray-700 leading-relaxed"
                />
              </div>
            )}
            {entry.readReason && (
              <div className="min-w-0">
                <p className="text-xs text-violet-400 font-medium mb-1">
                  마음에 닿았던 이유 / 닮고 싶은 부분
                </p>
                <LinkifiedText
                  text={entry.readReason}
                  className="text-sm text-gray-700 leading-relaxed"
                />
              </div>
            )}
          </div>
        ) : (
          <div
            key={idx}
            className="rounded-xl p-4 bg-rose-50 space-y-3 overflow-hidden"
          >
            <span className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-md text-rose-600 bg-rose-100">
              글 작성 #{idx + 1}
            </span>
            {entry.content && (
              <div className="min-w-0">
                <p className="text-xs text-rose-400 font-medium mb-1">
                  오늘의 주제
                </p>
                <LinkifiedText
                  text={entry.content}
                  className="text-sm text-gray-700 leading-relaxed"
                />
              </div>
            )}
            {entry.duration ? (
              <div>
                <p className="text-xs text-rose-400 font-medium mb-1">
                  작성에 걸린 시간
                </p>
                <p className="text-sm text-gray-700">{entry.duration}분</p>
              </div>
            ) : null}
            {entry.link && (
              <div className="min-w-0">
                <p className="text-xs text-rose-400 font-medium mb-1">
                  작성 링크
                </p>
                <a
                  href={entry.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-rose-500 underline break-all"
                >
                  {entry.link}
                </a>
              </div>
            )}
          </div>
        ),
      )}
    </div>
  );
}

// 타입 가드 함수들
function isExerciseData(
  data: NonNullable<FeedItem["routineData"]>,
  category: RoutineCategory,
): data is ExerciseFeedData {
  return category === "운동" && "exerciseName" in data;
}
function isMorningData(
  data: NonNullable<FeedItem["routineData"]>,
  category: RoutineCategory,
): data is MorningFeedData {
  return category === "모닝" && "condition" in data;
}
function isFinanceData(
  data: NonNullable<FeedItem["routineData"]>,
  category: RoutineCategory,
): data is FinanceFeedData {
  return category === "자산관리" && "dailyExpenses" in data;
}
function isLanguageData(
  data: NonNullable<FeedItem["routineData"]>,
  category: RoutineCategory,
): data is LanguageFeedData {
  return (
    (category === "영어" || category === "제2외국어") && "expressions" in data
  );
}
function isReadingData(
  data: NonNullable<FeedItem["routineData"]>,
  category: RoutineCategory,
): data is ReadingFeedData {
  return category === "독서" && "bookTitle" in data;
}
function isEnglishBookData(
  data: NonNullable<FeedItem["routineData"]>,
  category: RoutineCategory,
): data is ReadingFeedData {
  return category === "원서읽기" && "bookTitle" in data;
}
function isRecordingData(
  data: NonNullable<FeedItem["routineData"]>,
  category: RoutineCategory,
): data is RecordingFeedData {
  return (
    category === "기록" &&
    ("entries" in data ||
      "content" in data ||
      "readSourceTitle" in data ||
      "recordType" in data)
  );
}

/** routineData에서 인증 사진 URL 배열 추출 (certPhotos + 레거시 필드) */
function getAllPhotos(
  routineData: FeedItem["routineData"],
  category: RoutineCategory,
): string[] {
  if (!routineData) return [];

  // 공통 인증 사진 (certPhotos)
  const certPhotos =
    (routineData as ExerciseFeedData).certPhotos?.filter(Boolean) ?? [];
  if (certPhotos.length > 0) return certPhotos;

  // 리추얼별 기존 이미지 필드 (certPhotos가 없는 과거 데이터 대응)
  switch (category) {
    case "운동": {
      const d = routineData as ExerciseFeedData;
      return d.images?.filter(Boolean) ?? [];
    }
    case "모닝": {
      const d = routineData as MorningFeedData;
      return d.image ? [d.image] : [];
    }
    case "영어":
    case "제2외국어": {
      const d = routineData as LanguageFeedData;
      return d.images?.filter(Boolean) ?? [];
    }
    default:
      return [];
  }
}

/** 사진 전체화면 뷰어 (좌우 넘기기 지원) */
function PhotoViewer({
  photos,
  initialIndex,
  onClose,
}: {
  photos: string[];
  initialIndex: number;
  onClose: () => void;
}) {
  const [current, setCurrent] = useState(initialIndex);
  const total = photos.length;

  const goPrev = useCallback(
    () => setCurrent((c) => (c - 1 + total) % total),
    [total],
  );
  const goNext = useCallback(() => setCurrent((c) => (c + 1) % total), [total]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKey);
    };
  }, [onClose, goPrev, goNext]);

  // 스와이프 지원
  const touchRef = React.useRef<number | null>(null);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
      onClick={onClose}
      onTouchStart={(e) => {
        touchRef.current = e.touches[0].clientX;
      }}
      onTouchEnd={(e) => {
        if (touchRef.current === null) return;
        const diff = e.changedTouches[0].clientX - touchRef.current;
        if (Math.abs(diff) > 50) {
          diff > 0 ? goPrev() : goNext();
        }
        touchRef.current = null;
      }}
    >
      {/* X 닫기 버튼 */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors z-10"
      >
        <X className="w-6 h-6" />
      </button>

      {/* 좌측 화살표 */}
      {total > 1 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            goPrev();
          }}
          className="absolute left-3 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors z-10"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
      )}

      {/* 이미지 */}
      <img
        src={photos[current]}
        alt={`인증 사진 ${current + 1}`}
        className="max-w-[90vw] max-h-[85vh] object-contain rounded-lg"
        onClick={(e) => e.stopPropagation()}
      />

      {/* 우측 화살표 */}
      {total > 1 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            goNext();
          }}
          className="absolute right-3 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors z-10"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      )}

      {/* 인디케이터 */}
      {total > 1 && (
        <div className="absolute bottom-6 flex gap-1.5">
          {photos.map((_, i) => (
            <span
              key={i}
              className={`w-2 h-2 rounded-full transition-colors ${i === current ? "bg-white" : "bg-white/40"}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/** 인증 사진 그리드 (깨진 이미지 자동 숨김 + 클릭 확대) */
function CertPhotoGrid({
  routineData,
  category,
}: {
  routineData?: FeedItem["routineData"];
  category: RoutineCategory;
}) {
  const [failedSet, setFailedSet] = React.useState<Set<number>>(new Set());
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const photos = getAllPhotos(routineData, category);
  const visible = photos.filter((_, i) => !failedSet.has(i));
  if (visible.length === 0) return null;
  return (
    <>
      <div className="mb-5 grid grid-cols-2 gap-2 rounded-xl overflow-hidden">
        {photos.map((src, i) =>
          failedSet.has(i) ? null : (
            <img
              key={i}
              src={src}
              alt={`인증 사진 ${i + 1}`}
              className="w-full h-48 object-cover rounded-xl cursor-pointer active:opacity-80 transition-opacity"
              onClick={() => setViewerIndex(i)}
              onError={() => setFailedSet((prev) => new Set(prev).add(i))}
            />
          ),
        )}
      </div>
      {viewerIndex !== null && (
        <PhotoViewer
          photos={visible}
          initialIndex={viewerIndex}
          onClose={() => setViewerIndex(null)}
        />
      )}
    </>
  );
}

export default function FeedDetail({ item, isMine = false }: FeedDetailProps) {
  const router = useRouter();
  const [comments, setComments] = useState<Comment[]>(item.comments ?? []);
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const meta = getCategoryMeta(item.routineCategory);
  const recordId = item.odOriginalId;

  const handleDeleteRecord = async () => {
    if (!recordId) return;
    setDeleting(true);
    const { error } = await deleteRitualRecord(recordId);
    setDeleting(false);
    if (error) {
      alert(`삭제 실패: ${error}`);
      return;
    }
    setConfirmDelete(false);
    router.back();
  };

  const handleAddComment = async (text: string) => {
    if (!recordId) return;
    try {
      const { data, error } = await addComment(recordId, text);
      if (error) {
        console.error("댓글 추가 실패:", error);
        return;
      }
      if (data) setComments((prev) => [...prev, data]);
    } catch (e) {
      console.error("댓글 추가 예외:", e);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      const { error } = await deleteComment(commentId);
      if (error) {
        console.error("댓글 삭제 실패:", error);
        return;
      }
      setComments((prev) => prev.filter((c) => c.odOriginalId !== commentId));
    } catch (e) {
      console.error("댓글 삭제 예외:", e);
    }
  };

  const handleUpdateComment = async (commentId: string, text: string) => {
    try {
      const { error } = await updateComment(commentId, text);
      if (error) {
        console.error("댓글 수정 실패:", error);
        return;
      }
      setComments((prev) =>
        prev.map((c) => (c.odOriginalId === commentId ? { ...c, text } : c)),
      );
    } catch (e) {
      console.error("댓글 수정 예외:", e);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-8">
      <div>
        {/* 헤더 */}
        <div className="flex items-center gap-3 mb-6 mt-2">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <span
            className="flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold"
            style={{ backgroundColor: meta.bgColor, color: meta.hexColor }}
          >
            {meta.icon}
            {meta.label}
          </span>
          {isMine && !editing && item.routineData && (
            <div className="ml-auto flex items-center gap-2">
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                <Pencil className="w-3.5 h-3.5" />
                수정
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold text-red-500 bg-red-50 hover:bg-red-100 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                삭제
              </button>
            </div>
          )}
        </div>

        {/* 삭제 확인 모달 */}
        {confirmDelete && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-6"
            onClick={() => !deleting && setConfirmDelete(false)}
          >
            <div
              className="w-full max-w-xs rounded-2xl bg-white p-5 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-base font-semibold text-gray-900">
                인증 게시글을 삭제하시겠습니까?
              </h3>
              <p className="mt-2 text-sm text-gray-500">
                기록과 댓글이 함께 사라지며, 달성률에서도 제외됩니다.
              </p>
              <div className="mt-5 flex gap-2">
                <button
                  onClick={() => setConfirmDelete(false)}
                  disabled={deleting}
                  className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  취소
                </button>
                <button
                  onClick={handleDeleteRecord}
                  disabled={deleting}
                  className="flex-1 rounded-xl py-2.5 text-sm font-medium text-white disabled:opacity-50"
                  style={{ backgroundColor: "#ef4444" }}
                >
                  {deleting ? "삭제 중..." : "삭제"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 본문 카드 */}
        <div className="bg-white rounded-2xl shadow-md p-6">
          {/* 유저 정보 */}
          <div className="flex items-center gap-3 mb-5">
            <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0 overflow-hidden">
              {item.userProfileImage ? (
                <img
                  src={item.userProfileImage}
                  alt={item.userName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-6 h-6 text-gray-400" />
              )}
            </div>
            <div>
              <p className="text-base font-bold text-gray-900">
                {item.userName}
              </p>
              <p className="text-xs text-gray-400">
                {formatFullDate(item.date)}
              </p>
            </div>
          </div>

          {/* 인증 사진 (수정 모드에서도 표시 — 사진은 수정 불가, 참고용) */}
          <CertPhotoGrid
            routineData={item.routineData}
            category={item.routineCategory}
          />

          {/* 리추얼 콘텐츠 — 수정 모드에서는 EditFeedRecord */}
          {editing ? (
            <EditFeedRecord item={item} onCancel={() => setEditing(false)} />
          ) : item.routineData ? (
            <>
              {isExerciseData(item.routineData, item.routineCategory) && (
                <ExerciseContent data={item.routineData} />
              )}
              {isMorningData(item.routineData, item.routineCategory) && (
                <MorningContent data={item.routineData} />
              )}
              {isFinanceData(item.routineData, item.routineCategory) && (
                <FinanceContent data={item.routineData} />
              )}
              {isLanguageData(item.routineData, item.routineCategory) && (
                <LanguageContent data={item.routineData} />
              )}
              {isReadingData(item.routineData, item.routineCategory) && (
                <ReadingContent data={item.routineData} />
              )}
              {isEnglishBookData(item.routineData, item.routineCategory) && (
                <EnglishBookContent data={item.routineData} />
              )}
              {isRecordingData(item.routineData, item.routineCategory) && (
                <RecordingContent data={item.routineData} />
              )}
            </>
          ) : (
            <p className="text-sm text-gray-400">기록 내용이 없습니다.</p>
          )}

          {/* 구분선 */}
          <div className="border-t border-gray-100 mt-6" />

          {/* 댓글 섹션 */}
          <CommentSection
            comments={comments}
            onAddComment={handleAddComment}
            onDeleteComment={handleDeleteComment}
            onUpdateComment={handleUpdateComment}
          />
        </div>
      </div>
    </div>
  );
}
