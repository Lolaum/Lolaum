"use client";

import { useState } from "react";
import { ChevronDown, Quote, FileText, BookOpen } from "lucide-react";
import { BookDetailProps, DailyReadingRecord, NoteType } from "@/types/routines/reading";

const MOCK_RECORDS_PAGE: DailyReadingRecord[] = [
  {
    id: 1,
    date: "2026-02-25",
    trackingType: "page",
    startValue: 100,
    endValue: 126,
    progressAmount: 26,
    noteType: "sentence",
    note: "작은 변화가 쌓이면 놀라운 결과를 만들어낸다.",
  },
  {
    id: 2,
    date: "2026-02-24",
    trackingType: "page",
    startValue: 80,
    endValue: 100,
    progressAmount: 20,
    noteType: "summary",
    note: "저자는 아침 루틴의 중요성을 강조하며, 매일 같은 시간에 일어나는 습관이 하루의 생산성을 크게 높인다고 설명한다.",
  },
];

const MOCK_RECORDS_PERCENT: DailyReadingRecord[] = [
  {
    id: 1,
    date: "2026-02-25",
    trackingType: "percent",
    startValue: 38,
    endValue: 45,
    progressAmount: 7,
    noteType: "sentence",
    note: "습관은 반복으로 완성된다.",
  },
  {
    id: 2,
    date: "2026-02-24",
    trackingType: "percent",
    startValue: 30,
    endValue: 38,
    progressAmount: 8,
    noteType: "summary",
    note: "작은 습관이 큰 변화를 만든다는 핵심 주장을 다루는 챕터.",
  },
];

function AddReadingRecord({
  book,
  onCancel,
  onBackToHome,
  onSave,
}: {
  book: BookDetailProps["book"];
  onCancel: () => void;
  onBackToHome?: () => void;
  onSave: (record: Omit<DailyReadingRecord, "id">) => void;
}) {
  const isPercent = book.trackingType === "percent";
  const [startValue, setStartValue] = useState(book.currentPage.toString());
  const [endValue, setEndValue] = useState("");
  const [noteType, setNoteType] = useState<NoteType>("sentence");
  const [note, setNote] = useState("");

  const progressAmount =
    endValue && Number(endValue) > Number(startValue)
      ? Number(endValue) - Number(startValue)
      : 0;

  const canSave = note.trim().length > 0;

  const handleSave = () => {
    if (!canSave) return;
    const today = new Date().toISOString().split("T")[0];
    onSave({
      date: today,
      trackingType: book.trackingType,
      startValue: Number(startValue),
      endValue: Number(endValue) || Number(startValue),
      progressAmount,
      noteType,
      note: note.trim(),
    });
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* 네비게이션 */}
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={onCancel}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="text-sm">돌아가기</span>
        </button>
        <button
          type="button"
          onClick={onBackToHome}
          className="flex items-center justify-center w-8 h-8 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* 메인 카드 */}
      <div className="max-w-2xl bg-white rounded-2xl border border-gray-200 p-4 mx-auto">
        <h2 className="text-xl font-bold text-gray-900 mb-4">기록 추가</h2>

        {/* 오늘 읽은 분량 */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            오늘 읽은 분량
          </label>
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <label className="block text-xs text-gray-500 mb-1">
                {isPercent ? "시작 %" : "시작 페이지"}
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={startValue}
                  onChange={(e) => setStartValue(e.target.value)}
                  min={0}
                  max={isPercent ? 100 : undefined}
                  className="w-full px-4 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900 placeholder-gray-400 pr-8"
                />
                {isPercent && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">%</span>
                )}
              </div>
            </div>
            <span className="text-gray-400 mt-5">→</span>
            <div className="flex-1">
              <label className="block text-xs text-gray-500 mb-1">
                {isPercent ? "현재 %" : "끝 페이지"}
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={endValue}
                  onChange={(e) => setEndValue(e.target.value)}
                  placeholder={isPercent ? "최대 100" : `최대 ${book.totalPages}`}
                  min={0}
                  max={isPercent ? 100 : book.totalPages}
                  className="w-full px-4 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900 placeholder-gray-400 pr-8"
                />
                {isPercent && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">%</span>
                )}
              </div>
            </div>
          </div>
          {progressAmount > 0 && (
            <div className="mt-3 py-2.5 px-4 bg-orange-50 rounded-xl text-sm text-orange-600 font-medium text-center">
              {isPercent
                ? `오늘 ${progressAmount}% 진행했어요!`
                : `오늘 ${progressAmount}페이지 읽었어요!`}
            </div>
          )}
        </div>

        {/* 오늘의 문장 / 오늘 읽은 내용 요약 */}
        <div className="mb-8">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            오늘의 문장 / 내용 요약
          </label>
          {/* 탭 */}
          <div className="flex gap-2 mb-3">
            <button
              type="button"
              onClick={() => setNoteType("sentence")}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                noteType === "sentence"
                  ? "bg-orange-500 text-white"
                  : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              }`}
            >
              <Quote className="w-4 h-4" />
              오늘의 문장
            </button>
            <button
              type="button"
              onClick={() => setNoteType("summary")}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                noteType === "summary"
                  ? "bg-orange-500 text-white"
                  : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              }`}
            >
              <FileText className="w-4 h-4" />
              내용 요약
            </button>
          </div>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={
              noteType === "sentence"
                ? "오늘 읽은 내용 중 마음에 남는 문장을 적어보세요..."
                : "오늘 읽은 내용을 간단하게 요약해보세요..."
            }
            rows={4}
            className="w-full px-4 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900 placeholder-gray-400 resize-none"
          />
        </div>

        {/* 저장 버튼 */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleSave}
            disabled={!canSave}
            className="flex-1 py-4 px-4 rounded-xl bg-orange-500 text-white font-medium hover:bg-orange-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            기록 추가하기
          </button>
        </div>
      </div>
    </div>
  );
}

export default function BookDetail({ book, onBack, onBackToHome }: BookDetailProps) {
  const isPercent = book.trackingType === "percent";
  const [showAddRecord, setShowAddRecord] = useState(false);
  const [records, setRecords] = useState<DailyReadingRecord[]>(
    isPercent ? MOCK_RECORDS_PERCENT : MOCK_RECORDS_PAGE
  );
  const [expandedIds, setExpandedIds] = useState<number[]>([]);

  const progress = Math.round((book.currentPage / book.totalPages) * 100);
  const totalProgress = records.reduce((sum, r) => sum + r.progressAmount, 0);

  const toggleExpand = (id: number) => {
    setExpandedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSave = (record: Omit<DailyReadingRecord, "id">) => {
    setRecords((prev) => [{ id: Date.now(), ...record }, ...prev]);
    setShowAddRecord(false);
  };

  const formatDate = (dateStr: string) => {
    const [, month, day] = dateStr.split("-");
    return `${month}월 ${day}일`;
  };

  // 기록 추가 화면
  if (showAddRecord) {
    return (
      <AddReadingRecord
        book={book}
        onCancel={() => setShowAddRecord(false)}
        onBackToHome={onBackToHome}
        onSave={handleSave}
      />
    );
  }

  // 메인 화면
  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* 네비게이션 */}
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="text-sm">독서 관리로 돌아가기</span>
        </button>
        <button
          type="button"
          onClick={onBackToHome}
          className="flex items-center justify-center w-8 h-8 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* 헤더: 책 제목 + 기록 추가 버튼 */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-gray-900">{book.title}</h1>
        <button
          type="button"
          onClick={() => setShowAddRecord(true)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-orange-500 hover:text-orange-600 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          기록 추가
        </button>
      </div>

      {/* 책 정보 카드 */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 mb-4">
        <div className="flex gap-4">
          <div className="w-[72px] h-[100px] bg-gradient-to-br from-orange-300 to-orange-500 rounded-lg flex-shrink-0 flex items-center justify-center">
            <span className="text-white text-xs font-medium">책 표지</span>
          </div>
          <div className="flex-1 flex flex-col justify-between py-1">
            <p className="text-sm text-gray-500">{book.author}</p>
            <div>
              <div className="flex items-center justify-between text-sm text-gray-600 mb-1.5">
                {isPercent ? (
                  <span>{book.currentPage}% 진행</span>
                ) : (
                  <span>{book.currentPage} / {book.totalPages} 페이지</span>
                )}
                <span className="font-semibold text-orange-500">{progress}%</span>
              </div>
              <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-orange-400 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 이번 달 통계 */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 mb-4">
        <div className="flex items-center gap-2 text-gray-600 mb-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          <span className="text-sm">이번 달</span>
        </div>
        <div className="flex items-baseline gap-6">
          <div>
            <div className="text-4xl font-bold text-gray-900">{records.length}</div>
            <div className="text-sm text-gray-500">읽은 날</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-gray-900">
              {totalProgress}{isPercent ? "%" : "p"}
            </div>
            <div className="text-sm text-gray-500">
              {isPercent ? "진행한 %": "총 읽은 페이지"}
            </div>
          </div>
        </div>
      </div>

      {/* 나만의 독서기록 */}
      <div className="mb-4">
        <h2 className="text-base font-semibold text-gray-900 mb-3">나만의 독서기록</h2>

        {records.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 text-center">
            <p className="text-sm text-gray-400">
              아직 독서 기록이 없어요.
              <br />+ 기록 추가를 눌러 오늘 읽은 내용을 남겨보세요!
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {records.map((record) => {
              const isExpanded = expandedIds.includes(record.id);
              const unit = record.trackingType === "percent" ? "%" : "p";
              return (
                <div
                  key={record.id}
                  className="bg-white rounded-2xl border border-gray-200 overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => toggleExpand(record.id)}
                    className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-gray-700">
                        {formatDate(record.date)}
                      </span>
                      <span className="text-xs text-orange-500 bg-orange-50 px-2 py-0.5 rounded-full font-medium">
                        +{record.progressAmount}{unit}
                      </span>
                      <span className="text-xs text-gray-400">
                        {record.noteType === "sentence" ? "오늘의 문장" : "내용 요약"}
                      </span>
                    </div>
                    <ChevronDown
                      className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ${
                        isExpanded ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {isExpanded && (
                    <div className="px-4 pb-4 pt-1 border-t border-gray-100">
                      <div className="text-xs text-gray-400 mb-2">
                        {record.startValue}{unit} → {record.endValue}{unit}
                      </div>
                      <div
                        className={`text-sm text-gray-700 rounded-xl p-3 ${
                          record.noteType === "sentence"
                            ? "bg-orange-50 border-l-2 border-orange-300 italic"
                            : "bg-gray-50"
                        }`}
                      >
                        {record.noteType === "sentence" && (
                          <Quote className="w-3 h-3 text-orange-300 inline-block mr-1 mb-0.5" />
                        )}
                        {record.note}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
