"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  BookText,
  Dumbbell,
  BookA,
  Sun,
  Languages,
  CircleDollarSign,
  Pen,
  BookOpen,
  Loader2,
  ClipboardCheck,
  Check,
  Trash2,
  X,
} from "lucide-react";
import {
  FeedItem,
  RoutineCategory,
  ReadingFeedData,
  ExerciseFeedData,
  MorningFeedData,
  LanguageFeedData,
  FinanceFeedData,
  RecordingFeedData,
  ReflectionFeedData,
  normalizeRecordingFeedEntries,
} from "@/types/feed";
import {
  deleteMyArchiveItems,
  getMyRecordsForDisplay,
  type ArchiveDeleteTarget,
} from "@/api/ritual-records-display";

const CATEGORY_CONFIG: Record<
  RoutineCategory,
  { color: string; bgColor: string; label: string; icon: React.ReactNode }
> = {
  독서: {
    color: "#6366f1",
    bgColor: "#eef2ff",
    label: "독서",
    icon: <BookText size={14} />,
  },
  운동: {
    color: "#ff8900",
    bgColor: "#fff4e5",
    label: "운동",
    icon: <Dumbbell size={14} />,
  },
  영어: {
    color: "#0ea5e9",
    bgColor: "#f0f9ff",
    label: "영어",
    icon: <BookA size={14} />,
  },
  모닝: {
    color: "#eab32e",
    bgColor: "#fefce8",
    label: "모닝",
    icon: <Sun size={14} />,
  },
  제2외국어: {
    color: "#10b981",
    bgColor: "#ecfdf5",
    label: "제2외국어",
    icon: <Languages size={14} />,
  },
  기록: {
    color: "#8b5cf6",
    bgColor: "#f5f3ff",
    label: "기록",
    icon: <Pen size={14} />,
  },
  자산관리: {
    color: "#10b981",
    bgColor: "#ecfdf5",
    label: "자산관리",
    icon: <CircleDollarSign size={14} />,
  },
  원서읽기: {
    color: "#ec4899",
    bgColor: "#fdf2f8",
    label: "원서읽기",
    icon: <BookOpen size={14} />,
  },
  회고: {
    color: "#eab32e",
    bgColor: "#fefce8",
    label: "회고",
    icon: <ClipboardCheck size={14} />,
  },
};

const FILTERS: (RoutineCategory | "전체")[] = [
  "전체",
  "회고",
  "독서",
  "운동",
  "모닝",
  "영어",
  "제2외국어",
  "기록",
  "자산관리",
  "원서읽기",
];

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${month}.${day}`;
};

function getArchiveDeleteTarget(item: FeedItem): ArchiveDeleteTarget | null {
  const id = item.odOriginalId ? String(item.odOriginalId) : null;
  if (!id) return null;

  if (item.archiveHref?.startsWith("/declaration/")) {
    return { kind: "declaration", id };
  }
  if (item.archiveHref?.startsWith("/mid-review/")) {
    return { kind: "mid_review", id };
  }
  if (item.archiveHref?.startsWith("/final-review/")) {
    return { kind: "final_review", id };
  }
  return { kind: "ritual_record", id };
}

// ── 카드 내용 렌더러 ──

function ReadingCardContent({ data }: { data: ReadingFeedData }) {
  const progress =
    data.pagesRead && data.totalPages
      ? Math.round((data.pagesRead / data.totalPages) * 100)
      : 0;

  return (
    <div className="space-y-3">
      <div>
        <p className="font-semibold text-gray-900 text-sm leading-tight">
          {data.bookTitle}
        </p>
        <p className="text-xs text-gray-400 mt-0.5">{data.author}</p>
      </div>

      {data.pagesRead && data.totalPages && (
        <div>
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>
              {data.pagesRead}p / {data.totalPages}p
            </span>
            <span className="font-medium" style={{ color: "#6366f1" }}>
              +{data.progressAmount}p
            </span>
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${progress}%`, backgroundColor: "#6366f1" }}
            />
          </div>
        </div>
      )}

      {data.note && (
        <div
          className="rounded-xl p-3 relative"
          style={{ backgroundColor: "#eef2ff" }}
        >
          <span
            className="absolute -top-1 left-3 text-2xl leading-none"
            style={{ color: "#6366f1", opacity: 0.4 }}
          >
            ❝
          </span>
          <p className="text-xs text-gray-600 leading-relaxed pt-1 line-clamp-3">
            {data.note}
          </p>
        </div>
      )}

      {data.thoughts && (
        <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">
          {data.thoughts}
        </p>
      )}
    </div>
  );
}

function ExerciseCardContent({ data }: { data: ExerciseFeedData }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-sm font-bold" style={{ color: "#ff8900" }}>
          {data.exerciseName}
        </span>
        <span className="text-xs text-gray-400">·</span>
        <span className="text-xs text-gray-500">{data.duration}분</span>
      </div>

      <div className="flex gap-1 flex-wrap">
        {Array.from({
          length: Math.min(Math.ceil(data.duration / 10), 10),
        }).map((_, i) => (
          <div
            key={i}
            className="w-4 h-4 rounded"
            style={{
              backgroundColor:
                i < Math.floor(data.duration / 10) ? "#ff8900" : "#ffe0b2",
            }}
          />
        ))}
        <span className="text-xs text-gray-400 self-center ml-1">
          {data.duration}분
        </span>
      </div>

      <p className="text-xs text-gray-600 leading-relaxed line-clamp-3">
        {data.achievement}
      </p>
    </div>
  );
}

function MorningCardContent({ data }: { data: MorningFeedData }) {
  const conditionColor =
    data.condition === "상"
      ? "#10b981"
      : data.condition === "중"
        ? "#eab32e"
        : "#f97316";
  const conditionBars =
    data.condition === "상" ? 5 : data.condition === "중" ? 3 : 1;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
          style={{ backgroundColor: conditionColor }}
        >
          {data.condition}
        </div>
        <div>
          <p className="text-xs text-gray-400">오늘의 컨디션</p>
          <div className="flex mt-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="w-5 h-1.5 rounded-full mr-0.5"
                style={{
                  backgroundColor:
                    i < conditionBars ? conditionColor : "#e5e7eb",
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {data.success && (
        <p className="text-xs text-gray-600 leading-relaxed line-clamp-2">
          {data.success}
        </p>
      )}

      {data.reflection && (
        <p className="text-xs text-gray-500 leading-relaxed line-clamp-2 italic">
          “{data.reflection}”
        </p>
      )}
    </div>
  );
}

function LanguageCardContent({ data }: { data: LanguageFeedData }) {
  return (
    <div className="space-y-3">
      <p className="text-xs font-medium text-gray-700">{data.achievement}</p>
      <div className="flex flex-wrap gap-1.5">
        {data.expressions.slice(0, 3).map((expr, i) => (
          <div
            key={i}
            className="rounded-lg px-2.5 py-1.5"
            style={{ backgroundColor: "#f0f9ff" }}
          >
            <p className="text-xs font-semibold" style={{ color: "#0ea5e9" }}>
              {expr.word}
            </p>
            <p className="text-[10px] text-gray-500 mt-0.5">{expr.meaning}</p>
          </div>
        ))}
        {data.expressions.length > 3 && (
          <div className="rounded-lg px-2.5 py-1.5 bg-gray-100 flex items-center">
            <p className="text-xs text-gray-400">
              +{data.expressions.length - 3}개
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function FinanceCardContent({ data }: { data: FinanceFeedData }) {
  const allExpenses = data.dailyExpenses.flatMap((d) => d.expenses);
  const total = allExpenses.reduce((sum, e) => sum + e.amount, 0);
  const necessary = allExpenses
    .filter((e) => e.type === "necessary")
    .reduce((s, e) => s + e.amount, 0);
  const emotional = allExpenses
    .filter((e) => e.type === "emotional")
    .reduce((s, e) => s + e.amount, 0);
  const value = allExpenses
    .filter((e) => e.type === "value")
    .reduce((s, e) => s + e.amount, 0);
  const necessaryPercent =
    total > 0 ? Math.round((necessary / total) * 100) : 0;
  const emotionalPercent =
    total > 0 ? Math.round((emotional / total) * 100) : 0;
  const valuePercent = total > 0 ? Math.round((value / total) * 100) : 0;

  return (
    <div className="space-y-3">
      <div>
        <p className="text-lg font-bold text-gray-900">
          {total.toLocaleString()}원
        </p>
        <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1">
          <span className="text-xs text-gray-400">
            필수{" "}
            <span className="text-gray-600 font-medium">
              {necessary.toLocaleString()}
            </span>
          </span>
          <span className="text-xs text-gray-400">
            감성{" "}
            <span style={{ color: "#f97316" }} className="font-medium">
              {emotional.toLocaleString()}
            </span>
          </span>
          <span className="text-xs text-gray-400">
            가치{" "}
            <span style={{ color: "#8b5cf6" }} className="font-medium">
              {value.toLocaleString()}
            </span>
          </span>
        </div>
      </div>

      <div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden flex">
          <div
            className="h-full"
            style={{
              width: `${necessaryPercent}%`,
              backgroundColor: "#9ca3af",
            }}
          />
          <div
            className="h-full"
            style={{
              width: `${emotionalPercent}%`,
              backgroundColor: "#f97316",
            }}
          />
          <div
            className="h-full"
            style={{
              width: `${valuePercent}%`,
              backgroundColor: "#8b5cf6",
            }}
          />
        </div>
        <p className="text-[10px] text-gray-400 mt-1">
          감성 {emotionalPercent}% · 가치 {valuePercent}%
        </p>
      </div>

      {data.studyContent && (
        <p className="text-xs text-gray-600 leading-relaxed line-clamp-2">
          {data.studyContent}
        </p>
      )}
    </div>
  );
}

function EnglishBookCardContent({ data }: { data: ReadingFeedData }) {
  const progress =
    data.pagesRead && data.totalPages
      ? Math.round((data.pagesRead / data.totalPages) * 100)
      : 0;

  return (
    <div className="space-y-3">
      <div>
        <p className="font-semibold text-gray-900 text-sm leading-tight">
          {data.bookTitle}
        </p>
        <p className="text-xs text-gray-400 mt-0.5">{data.author}</p>
      </div>

      {data.pagesRead && data.totalPages && (
        <div>
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>
              {data.pagesRead}p / {data.totalPages}p
            </span>
            <span className="font-medium" style={{ color: "#ec4899" }}>
              +{data.progressAmount}p
            </span>
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${progress}%`, backgroundColor: "#ec4899" }}
            />
          </div>
        </div>
      )}

      <div
        className="rounded-xl p-2.5 flex items-center gap-1.5"
        style={{ backgroundColor: "#fdf2f8" }}
      >
        <span className="text-sm">📸</span>
        <p className="text-xs text-pink-500 font-medium">스크린샷 인증 완료</p>
      </div>
    </div>
  );
}

function RecordingCardContent({ data }: { data: RecordingFeedData }) {
  const entries = normalizeRecordingFeedEntries(data);
  const first = entries[0];
  if (!first) return null;
  return (
    <div className="space-y-2">
      {entries.length > 1 && (
        <p className="text-[10px] font-semibold text-gray-400">
          총 {entries.length}개 항목
        </p>
      )}
      {first.type === "read" ? (
        <>
          {first.readSourceTitle && (
            <p className="text-xs font-semibold text-gray-700 line-clamp-2">
              {first.readSourceTitle}
            </p>
          )}
          {first.readResonatedPart && (
            <p className="text-xs text-gray-600 leading-relaxed line-clamp-3">
              {first.readResonatedPart}
            </p>
          )}
        </>
      ) : (
        <>
          {first.title && (
            <p className="text-xs font-semibold text-gray-700 line-clamp-2">
              {first.title}
            </p>
          )}
          {first.content && (
            <p className="text-xs text-gray-600 leading-relaxed line-clamp-4">
              {first.content}
            </p>
          )}
          {first.duration ? (
            <p className="text-xs text-gray-400">
              작성 시간 {first.duration}분
            </p>
          ) : null}
          {first.link && (
            <p className="text-xs text-violet-500 truncate">{first.link}</p>
          )}
        </>
      )}
    </div>
  );
}

function ReflectionCardContent({ data }: { data: ReflectionFeedData }) {
  return (
    <div className="space-y-2.5">
      <div>
        <p className="text-sm font-semibold text-gray-900">{data.title}</p>
        {data.subtitle && (
          <p className="text-xs text-gray-400 mt-0.5">{data.subtitle}</p>
        )}
      </div>

      {data.chips && data.chips.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {data.chips.slice(0, 3).map((chip) => (
            <span
              key={chip}
              className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
              style={{ backgroundColor: "#fef3c7", color: "#d97706" }}
            >
              {chip}
            </span>
          ))}
        </div>
      )}

      <p className="text-xs text-gray-500 leading-relaxed line-clamp-3">
        {data.preview}
      </p>
    </div>
  );
}

// ── 아카이빙 카드 ──

function GalleryCard({
  item,
  selectionMode,
  selected,
  onToggleSelect,
}: {
  item: FeedItem;
  selectionMode: boolean;
  selected: boolean;
  onToggleSelect: () => void;
}) {
  const config = CATEGORY_CONFIG[item.routineCategory];

  const renderContent = () => {
    switch (item.routineCategory) {
      case "독서":
        return (
          <ReadingCardContent data={item.routineData as ReadingFeedData} />
        );
      case "운동":
        return (
          <ExerciseCardContent data={item.routineData as ExerciseFeedData} />
        );
      case "모닝":
        return (
          <MorningCardContent data={item.routineData as MorningFeedData} />
        );
      case "영어":
      case "제2외국어":
        return (
          <LanguageCardContent data={item.routineData as LanguageFeedData} />
        );
      case "자산관리":
        return (
          <FinanceCardContent data={item.routineData as FinanceFeedData} />
        );
      case "기록":
        return (
          <RecordingCardContent data={item.routineData as RecordingFeedData} />
        );
      case "원서읽기":
        return (
          <EnglishBookCardContent data={item.routineData as ReadingFeedData} />
        );
      case "회고":
        return (
          <ReflectionCardContent
            data={item.routineData as ReflectionFeedData}
          />
        );
      default:
        return null;
    }
  };

  const cardContent = (
    <>
      {/* 카드 헤더 */}
      <div className="flex items-center justify-between mb-3">
        <span
          className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
          style={{ backgroundColor: config.bgColor, color: config.color }}
        >
          {config.icon}
          {config.label}
        </span>
        <span className="text-xs text-gray-400">{formatDate(item.date)}</span>
      </div>

      {/* 카드 내용 */}
      {item.routineData && renderContent()}
    </>
  );

  const className = `relative block w-full bg-white rounded-2xl p-4 text-left shadow-sm border transition-all duration-200 ${
    selected ? "border-red-200 ring-2 ring-red-100" : "border-gray-100"
  } ${selectionMode ? "hover:bg-red-50/30" : "hover:shadow-md hover:-translate-y-0.5"}`;

  if (selectionMode) {
    return (
      <button
        type="button"
        onClick={onToggleSelect}
        className={className}
        style={{ borderTop: `3px solid ${config.color}` }}
        aria-pressed={selected}
      >
        <span
          className={`absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full border text-white transition-colors ${
            selected ? "border-red-500 bg-red-500" : "border-gray-200 bg-white"
          }`}
          aria-hidden="true"
        >
          {selected && <Check className="h-3.5 w-3.5" />}
        </span>
        <div className="pr-8">{cardContent}</div>
      </button>
    );
  }

  return (
    <Link
      href={item.archiveHref ?? `/feeds/${item.odOriginalId ?? item.id}`}
      className={className}
      style={{ borderTop: `3px solid ${config.color}` }}
    >
      {cardContent}
    </Link>
  );
}

// ── 메인 아카이빙 ──

export default function RecordGallery({
  refreshKey = 0,
  fixedFilter,
}: { refreshKey?: number; fixedFilter?: RoutineCategory } = {}) {
  const [activeFilter, setActiveFilter] = useState<RoutineCategory | "전체">(
    "전체",
  );
  const [records, setRecords] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [deleting, setDeleting] = useState(false);
  const effectiveFilter = fixedFilter ?? activeFilter;

  useEffect(() => {
    async function fetchRecords() {
      setLoading(true);
      const { data } = await getMyRecordsForDisplay();
      setRecords(data);
      setSelectedIds(new Set());
      setSelectionMode(false);
      setLoading(false);
    }
    fetchRecords();
  }, [refreshKey]);

  const filtered =
    effectiveFilter === "전체"
      ? records
      : records.filter((r) => r.routineCategory === effectiveFilter);

  const selectedCount = selectedIds.size;

  const toggleSelectionMode = () => {
    setSelectionMode((prev) => !prev);
    setSelectedIds(new Set());
  };

  const toggleSelect = (item: FeedItem) => {
    const key = String(item.id);
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const handleBulkDelete = async () => {
    const selectedItems = records.filter((item) =>
      selectedIds.has(String(item.id)),
    );
    const targets = selectedItems
      .map(getArchiveDeleteTarget)
      .filter((target): target is ArchiveDeleteTarget => target !== null);

    if (targets.length === 0) return;

    const confirmed = window.confirm(
      `선택한 게시글 ${targets.length}개를 삭제하시겠습니까?`,
    );
    if (!confirmed) return;

    setDeleting(true);
    const { error } = await deleteMyArchiveItems(targets);
    setDeleting(false);

    if (error) {
      alert(`삭제 실패: ${error}`);
      return;
    }

    const deletedKeys = new Set(selectedItems.map((item) => String(item.id)));
    setRecords((prev) =>
      prev.filter((item) => !deletedKeys.has(String(item.id))),
    );
    setSelectedIds(new Set());
    setSelectionMode(false);
  };

  return (
    <div>
      {!fixedFilter && (
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 mb-4 scrollbar-hide">
          {FILTERS.map((f) => {
            const isActive = activeFilter === f;
            const config = f !== "전체" ? CATEGORY_CONFIG[f] : null;
            return (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200"
                style={
                  isActive
                    ? {
                        backgroundColor: config ? config.color : "#eab32e",
                        color: "#fff",
                      }
                    : {
                        backgroundColor: "#f3f4f6",
                        color: "#6b7280",
                      }
                }
              >
                {f}
              </button>
            );
          })}
        </div>
      )}

      {/* 기록 수 / 삭제 액션 */}
      <div className="mb-3 flex items-center justify-between gap-3 px-1">
        <p className="text-xs text-gray-400">
          총{" "}
          <span className="font-semibold text-gray-600">{filtered.length}</span>
          개의 기록
        </p>
        {!loading && filtered.length > 0 && (
          <div className="flex items-center gap-2">
            {selectionMode ? (
              <>
                <button
                  type="button"
                  onClick={toggleSelectionMode}
                  disabled={deleting}
                  className="inline-flex h-8 items-center gap-1.5 rounded-full bg-gray-100 px-3 text-xs font-semibold text-gray-600 transition-colors hover:bg-gray-200 disabled:opacity-50"
                >
                  <X className="h-3.5 w-3.5" />
                  취소
                </button>
                <button
                  type="button"
                  onClick={handleBulkDelete}
                  disabled={selectedCount === 0 || deleting}
                  className="inline-flex h-8 items-center gap-1.5 rounded-full bg-red-500 px-3 text-xs font-semibold text-white transition-colors hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  {deleting ? "삭제 중" : `선택 삭제 ${selectedCount}`}
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={toggleSelectionMode}
                className="inline-flex h-8 items-center gap-1.5 rounded-full bg-red-50 px-3 text-xs font-semibold text-red-500 transition-colors hover:bg-red-100"
              >
                <Trash2 className="h-3.5 w-3.5" />
                삭제하기
              </button>
            )}
          </div>
        )}
      </div>

      {/* 2열 그리드 */}
      {loading ? (
        <div className="text-center py-16 text-gray-400">
          <Loader2 size={24} className="animate-spin mx-auto mb-3" />
          <p className="text-sm">기록을 불러오는 중...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">📝</p>
          <p className="text-sm">아직 기록이 없어요</p>
          <p className="text-xs mt-1">리추얼을 완료하면 기록이 쌓여요</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filtered.map((item) => (
            <GalleryCard
              key={item.id}
              item={item}
              selectionMode={selectionMode}
              selected={selectedIds.has(String(item.id))}
              onToggleSelect={() => toggleSelect(item)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
