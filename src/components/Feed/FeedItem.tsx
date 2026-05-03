/* eslint-disable @next/next/no-img-element */
import React from "react";
import Link from "next/link";
import {
  User,
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
  FeedItem as FeedItemType,
  RoutineCategory,
  ReadingFeedData,
  ExerciseFeedData,
  MorningFeedData,
  LanguageFeedData,
  FinanceFeedData,
  RecordingFeedData,
  normalizeRecordingFeedEntries,
} from "@/types/feed";

interface FeedItemProps {
  item: FeedItemType;
}

const CATEGORY_CONFIG: Record<
  RoutineCategory,
  { color: string; bgColor: string; icon: React.ReactNode }
> = {
  독서: { color: "#6366f1", bgColor: "#eef2ff", icon: <BookText size={13} /> },
  운동: { color: "#ff8900", bgColor: "#fff4e5", icon: <Dumbbell size={13} /> },
  영어: { color: "#0ea5e9", bgColor: "#f0f9ff", icon: <BookA size={13} /> },
  모닝: { color: "#eab32e", bgColor: "#fefce8", icon: <Sun size={13} /> },
  제2외국어: {
    color: "#8b5cf6",
    bgColor: "#f5f3ff",
    icon: <Languages size={13} />,
  },
  기록: { color: "#8b5cf6", bgColor: "#f5f3ff", icon: <Pen size={13} /> },
  자산관리: {
    color: "#10b981",
    bgColor: "#ecfdf5",
    icon: <CircleDollarSign size={13} />,
  },
  원서읽기: {
    color: "#ec4899",
    bgColor: "#fdf2f8",
    icon: <BookOpen size={13} />,
  },
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${month}.${day}`;
};

// 각 리추얼 타입별 미리보기 텍스트 추출
function getPreviewText(item: FeedItemType): string | null {
  if (!item.routineData) return null;
  const data = item.routineData;

  switch (item.routineCategory) {
    case "독서": {
      const d = data as ReadingFeedData;
      return d.note || d.thoughts || null;
    }
    case "운동": {
      const d = data as ExerciseFeedData;
      return d.achievement || null;
    }
    case "모닝": {
      const d = data as MorningFeedData;
      return d.reflection || d.success || null;
    }
    case "영어":
    case "제2외국어": {
      const d = data as LanguageFeedData;
      return d.achievement || null;
    }
    case "자산관리": {
      const d = data as FinanceFeedData;
      return d.studyContent || null;
    }
    case "기록": {
      const entries = normalizeRecordingFeedEntries(data as RecordingFeedData);
      const first = entries[0];
      if (!first) return null;
      if (first.type === "read") {
        return first.readResonatedPart || first.readSourceTitle || null;
      }
      return first.content || null;
    }
    case "원서읽기": {
      const d = data as ReadingFeedData;
      return d.note || d.thoughts || null;
    }
    default:
      return null;
  }
}

// 리추얼별 서브텍스트 (종목, 책 제목 등)
function getSubText(item: FeedItemType): string | null {
  if (!item.routineData) return null;
  const data = item.routineData;

  switch (item.routineCategory) {
    case "독서": {
      const d = data as ReadingFeedData;
      if (d.bookTitle) {
        const isPercent = d.trackingType === "percent";
        const progress =
          d.pagesRead != null && d.totalPages
            ? isPercent
              ? ` · ${d.pagesRead}%`
              : ` · ${d.pagesRead}/${d.totalPages}p`
            : "";
        return `${d.bookTitle}${progress}`;
      }
      return null;
    }
    case "운동": {
      const d = data as ExerciseFeedData;
      return d.exerciseName ? `${d.exerciseName} · ${d.duration}분` : null;
    }
    case "모닝": {
      const d = data as MorningFeedData;
      return d.sleepHours != null
        ? `수면 ${d.sleepHours}h · 컨디션 ${d.condition}`
        : null;
    }
    case "영어":
    case "제2외국어": {
      const d = data as LanguageFeedData;
      return d.expressions?.length
        ? `표현 ${d.expressions.length}개 학습`
        : null;
    }
    case "자산관리": {
      const d = data as FinanceFeedData;
      const total = d.dailyExpenses
        .flatMap((e) => e.expenses)
        .reduce((s, e) => s + e.amount, 0);
      return total > 0 ? `오늘 지출 ${total.toLocaleString()}원` : null;
    }
    case "기록": {
      const entries = normalizeRecordingFeedEntries(data as RecordingFeedData);
      if (entries.length > 1) return `항목 ${entries.length}개`;
      const first = entries[0];
      if (!first) return null;
      if (first.type === "read") {
        return first.readSourceTitle || null;
      }
      return first.link || (first.duration ? `${first.duration}분` : null);
    }
    case "원서읽기": {
      const d = data as ReadingFeedData;
      if (d.bookTitle) {
        const isPercent = d.trackingType === "percent";
        const progress =
          d.pagesRead != null && d.totalPages
            ? isPercent
              ? ` · ${d.pagesRead}%`
              : ` · ${d.pagesRead}/${d.totalPages}p`
            : "";
        return `${d.bookTitle}${progress}`;
      }
      return null;
    }
    default:
      return null;
  }
}

/** routineData에서 인증 사진 URL 배열 추출 */
function getImages(item: FeedItemType): string[] {
  if (!item.routineData) return [];

  // 공통 인증 사진 (certPhotos) - 모든 FeedData 타입에 존재
  const certPhotos =
    (item.routineData as ExerciseFeedData).certPhotos?.filter(Boolean) ?? [];
  if (certPhotos.length > 0) return certPhotos;

  // 리추얼별 기존 이미지 필드 (certPhotos가 없는 과거 데이터 대응)
  switch (item.routineCategory) {
    case "운동": {
      const d = item.routineData as ExerciseFeedData;
      return d.images?.filter(Boolean) ?? [];
    }
    case "모닝": {
      const d = item.routineData as MorningFeedData;
      return d.image ? [d.image] : [];
    }
    case "영어":
    case "제2외국어": {
      const d = item.routineData as LanguageFeedData;
      return d.images?.filter(Boolean) ?? [];
    }
    case "독서": {
      const d = item.routineData as ReadingFeedData;
      return d.bookCover ? [d.bookCover] : [];
    }
    // 원서읽기는 인증 스크린샷(certPhotos)만 썸네일로 사용. 책 표지 폴백 없음.
    default:
      return [];
  }
}

/** 깨진 이미지 자동 숨김 */
function FeedThumbnail({ images }: { images: string[] }) {
  const [failed, setFailed] = React.useState(false);
  if (failed || images.length === 0) return null;
  return (
    <div className="relative w-full h-44 bg-gray-100">
      <img
        src={images[0]}
        alt="인증 사진"
        className="w-full h-full object-cover"
        onError={() => setFailed(true)}
      />
      {images.length > 1 && (
        <span className="absolute top-2 right-2 bg-black/50 text-white text-[10px] font-medium px-1.5 py-0.5 rounded-full">
          +{images.length - 1}
        </span>
      )}
    </div>
  );
}

export default function FeedItem({ item }: FeedItemProps) {
  const config = CATEGORY_CONFIG[item.routineCategory];
  const previewText = getPreviewText(item);
  const subText = getSubText(item);
  const images = getImages(item);

  return (
    <Link
      href={`/feeds/${item.odOriginalId ?? item.id}`}
      className="block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
      style={{ borderTop: `3px solid ${config.color}` }}
    >
      {/* 이미지 */}
      <FeedThumbnail images={images} />

      <div className="p-4">
        {/* 상단: 카테고리 뱃지 + 날짜 */}
        <div className="flex items-center justify-between mb-3">
          <span
            className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
            style={{ backgroundColor: config.bgColor, color: config.color }}
          >
            {config.icon}
            {item.routineCategory}
          </span>
          <span className="text-xs text-gray-400">{formatDate(item.date)}</span>
        </div>

        {/* 유저 + 서브텍스트 */}
        <div className="flex items-center gap-2.5 mb-2.5">
          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
            {item.userProfileImage ? (
              <img
                src={item.userProfileImage}
                alt={item.userName}
                className="w-full h-full object-cover"
              />
            ) : (
              <User size={14} className="text-gray-400" />
            )}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 leading-tight">
              {item.userName}
            </p>
            {subText && (
              <p
                className="text-xs font-medium mt-0.5"
                style={{ color: config.color }}
              >
                {subText}
              </p>
            )}
          </div>
        </div>

        {/* 미리보기 텍스트 */}
        {previewText && (
          <p className="text-xs text-gray-500 leading-relaxed line-clamp-2 pl-0.5">
            {previewText}
          </p>
        )}

        {/* 댓글 수 */}
        {item.comments && item.comments.length > 0 && (
          <div className="mt-2.5 flex items-center gap-1 text-xs text-gray-300">
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <span>댓글 {item.comments.length}개</span>
          </div>
        )}
      </div>
    </Link>
  );
}
