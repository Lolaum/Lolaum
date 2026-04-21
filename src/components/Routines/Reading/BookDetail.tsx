"use client";

import { useState, useEffect, useCallback } from "react";
import { ChevronDown, Quote, FileText, Trash2, Camera } from "lucide-react";
import { BookDetailProps, DailyReadingRecord, NoteType } from "@/types/routines/reading";
import { createRitualRecordAuto, getMyRitualRecords } from "@/api/ritual-record";
import { applyTimestamp } from "@/lib/utils";
import type { ReadingRecordData, Json } from "@/types/supabase";

function AddReadingRecord({
  book,
  onCancel,
  onBackToHome,
  onSave,
  isEnglishBook,
}: {
  book: BookDetailProps["book"];
  onCancel: () => void;
  onBackToHome?: () => void;
  onSave: (record: Omit<DailyReadingRecord, "id">) => void;
  isEnglishBook?: boolean;
}) {
  const isPercent = book.trackingType === "percent";
  const [startValue, setStartValue] = useState(book.currentValue.toString());
  const [endValue, setEndValue] = useState("");
  const [noteType, setNoteType] = useState<NoteType>("sentence");
  const [note, setNote] = useState("");
  const [thoughts, setThoughts] = useState("");
  const [screenshot, setScreenshot] = useState<string | null>(null);

  const handleScreenshot = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const stamped = await applyTimestamp(file).catch(() => {
      const reader = new FileReader();
      return new Promise<string>((resolve) => {
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
    });
    setScreenshot(stamped);
  };

  const progressAmount =
    endValue && Number(endValue) > Number(startValue)
      ? Number(endValue) - Number(startValue)
      : 0;

  const canSave = isEnglishBook
    ? screenshot !== null
    : note.trim().length > 0;

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
      note: isEnglishBook ? "(스크린샷 인증)" : note.trim(),
      thoughts: thoughts.trim() || undefined,
      screenshot: isEnglishBook && screenshot ? screenshot : undefined,
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

        {/* 원서읽기: 스크린샷 업로드 */}
        {isEnglishBook && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              인증 스크린샷
            </label>
            {screenshot ? (
              <div className="relative rounded-xl overflow-hidden border border-gray-200">
                <img src={screenshot} alt="인증 스크린샷" className="w-full h-48 object-cover" />
                <button
                  type="button"
                  onClick={() => setScreenshot(null)}
                  className="absolute top-2 right-2 w-7 h-7 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center gap-2 w-full h-36 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 cursor-pointer hover:border-gray-300 hover:bg-gray-100 transition-colors">
                <Camera size={24} className="text-gray-400" />
                <span className="text-sm text-gray-400 font-medium">스크린샷 추가</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleScreenshot} />
              </label>
            )}
          </div>
        )}

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
                  placeholder={isPercent ? "최대 100" : `최대 ${book.totalValue}`}
                  min={0}
                  max={isPercent ? 100 : book.totalValue}
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

        {/* 독서리추얼 전용: 오늘의 문장 / 내용 요약 + 나만의 생각 */}
        {!isEnglishBook && (
          <>
            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                오늘의 문장 / 내용 요약
              </label>
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

            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                나만의 생각
              </label>
              <textarea
                value={thoughts}
                onChange={(e) => setThoughts(e.target.value)}
                placeholder="읽으면서 든 생각이나 느낀 점을 자유롭게 적어보세요..."
                rows={4}
                className="w-full px-4 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900 placeholder-gray-400 resize-none"
              />
            </div>
          </>
        )}

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

export default function BookDetail({ book, onBack, onBackToHome, onDelete, onUpdate, isEnglishBook, certificationPhotos }: BookDetailProps) {
  const isPercent = book.trackingType === "percent";
  const [showAddRecord, setShowAddRecord] = useState(false);
  const [records, setRecords] = useState<DailyReadingRecord[]>([]);
  const [expandedIds, setExpandedIds] = useState<number[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // DB에서 이 책의 기존 기록 불러오기
  const fetchRecords = useCallback(async () => {
    const { data } = await getMyRitualRecords({ routineType: isEnglishBook ? "english_book" : "reading" });
    if (data) {
      const bookRecords: DailyReadingRecord[] = data
        .filter((r) => {
          const d = r.record_data as unknown as ReadingRecordData;
          return d.bookId === book.id;
        })
        .map((r) => {
          const d = r.record_data as unknown as ReadingRecordData;
          return {
            id: r.id as unknown as number,
            date: r.record_date,
            trackingType: d.trackingType,
            startValue: d.startValue,
            endValue: d.endValue,
            progressAmount: d.progressAmount,
            noteType: d.noteType,
            note: d.note,
            thoughts: d.thoughts,
          };
        })
        .sort((a, b) => b.date.localeCompare(a.date));
      setRecords(bookRecords);
    }
  }, [book.id, isEnglishBook]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const progress = book.totalValue > 0 ? Math.round((book.currentValue / book.totalValue) * 100) : 0;
  const totalProgress = records.reduce((sum, r) => sum + r.progressAmount, 0);
  const uniqueDaysCount = new Set(records.map((r) => r.date)).size;

  const toggleExpand = (id: number) => {
    setExpandedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSave = async (record: Omit<DailyReadingRecord, "id">) => {
    // 원서읽기: 업로드된 스크린샷을 우선 사용. 그 외 루틴은 외부 certificationPhotos prop 사용
    const certPhotos = record.screenshot
      ? [record.screenshot]
      : certificationPhotos?.length
        ? certificationPhotos
        : undefined;

    // DB에 ritual_record 저장
    const recordData: ReadingRecordData = {
      bookId: book.id,
      trackingType: record.trackingType,
      startValue: record.startValue,
      endValue: record.endValue,
      progressAmount: record.progressAmount,
      noteType: record.noteType,
      note: record.note,
      thoughts: record.thoughts,
      certPhotos,
    };

    const { error } = await createRitualRecordAuto({
      routineType: isEnglishBook ? "english_book" : "reading",
      recordDate: record.date,
      recordData: recordData as unknown as Json,
    });

    if (error) {
      alert(`기록 저장 실패: ${error}`);
      return;
    }

    setShowAddRecord(false);
    fetchRecords(); // DB에서 다시 불러오기

    // 진행도 업데이트 + 100% 도달 시 완독 처리
    if (onUpdate && record.endValue > book.currentValue) {
      const isNowCompleted = record.endValue >= book.totalValue;
      await onUpdate(book.id, {
        currentValue: record.endValue,
        ...(isNowCompleted && { isCompleted: true }),
      });
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    setDeleting(true);
    await onDelete(book.id);
    setDeleting(false);
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
        isEnglishBook={isEnglishBook}
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

      {/* 헤더: 책 제목 + 기록 추가 / 삭제 버튼 */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-gray-900">{book.title}</h1>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            삭제
          </button>
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
      </div>

      {/* 삭제 확인 모달 */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-bold text-gray-900 mb-2">책을 삭제할까요?</h3>
            <p className="text-sm text-gray-500 mb-6">
              &ldquo;{book.title}&rdquo;을(를) 삭제하면 독서 기록도 함께 사라집니다.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-3 px-4 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 py-3 px-4 rounded-xl bg-red-500 text-white font-medium hover:bg-red-600 transition-colors disabled:bg-gray-300"
              >
                {deleting ? "삭제 중..." : "삭제하기"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 책 정보 카드 */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 mb-4">
        <div className="flex gap-4">
          <div className="w-[72px] h-[100px] bg-gradient-to-br from-orange-300 to-orange-500 rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden">
            {book.coverImageUrl ? (
              <img src={book.coverImageUrl} alt={book.title} className="w-full h-full object-cover" />
            ) : (
              <span className="text-white text-xs font-medium">책 표지</span>
            )}
          </div>
          <div className="flex-1 flex flex-col justify-between py-1">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">{book.author}</p>
              <button
                type="button"
                onClick={async () => {
                  if (!onUpdate) return;
                  await onUpdate(book.id, { isCompleted: !book.isCompleted });
                }}
                className={`text-xs font-medium px-2.5 py-1 rounded-full transition-colors ${
                  book.isCompleted
                    ? "bg-green-100 text-green-600 hover:bg-green-200"
                    : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                }`}
              >
                {book.isCompleted ? "완독" : "읽는 중"}
              </button>
            </div>
            <div>
              <div className="flex items-center justify-between text-sm text-gray-600 mb-1.5">
                {isPercent ? (
                  <span>{book.currentValue}% 진행</span>
                ) : (
                  <span>{book.currentValue} / {book.totalValue} 페이지</span>
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
            <div className="text-4xl font-bold text-gray-900">{uniqueDaysCount}</div>
            <div className="text-sm text-gray-500">읽은 날</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-gray-900">
              {totalProgress}{isPercent ? "%" : "p"}
            </div>
            <div className="text-sm text-gray-500">
              {isPercent ? "진행한 %" : "총 읽은 페이지"}
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
                    <div className="px-4 pb-4 pt-1 border-t border-gray-100 space-y-2">
                      <div className="text-xs text-gray-400">
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
                      {record.thoughts && (
                        <div className="bg-gray-50 rounded-xl p-3">
                          <p className="text-xs text-gray-400 font-medium mb-1">나만의 생각</p>
                          <p className="text-sm text-gray-700 leading-relaxed">{record.thoughts}</p>
                        </div>
                      )}
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
