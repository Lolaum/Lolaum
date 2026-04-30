"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Loader2, Quote } from "lucide-react";
import { getMyRitualRecords } from "@/api/ritual-record";
import type { Book, ReadingRecordData } from "@/types/supabase";

interface BookRecordsProps {
  book: Book;
}

interface RecordItem {
  id: string;
  date: string;
  trackingType: "page" | "percent";
  startValue: number;
  endValue: number;
  progressAmount: number;
  noteType: "sentence" | "summary";
  note: string;
  thoughts?: string;
}

export default function BookRecords({ book }: BookRecordsProps) {
  const router = useRouter();
  const [records, setRecords] = useState<RecordItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedIds, setExpandedIds] = useState<string[]>([]);
  const isEnglishBook = book.routine_type === "english_book";

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  useEffect(() => {
    async function fetch() {
      setLoading(true);
      const { data } = await getMyRitualRecords({
        routineType: book.routine_type as "reading" | "english_book",
      });
      if (data) {
        const list: RecordItem[] = data
          .filter((r) => {
            const d = r.record_data as unknown as ReadingRecordData;
            return d.bookId === book.id;
          })
          .map((r) => {
            const d = r.record_data as unknown as ReadingRecordData;
            return {
              id: r.id,
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
        setRecords(list);
      }
      setLoading(false);
    }
    fetch();
  }, [book.id, book.routine_type]);

  const formatDate = (dateStr: string) => {
    const [, month, day] = dateStr.split("-");
    return `${month}월 ${day}일`;
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 pb-8">
      {/* 뒤로가기 */}
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          <span className="text-sm">돌아가기</span>
        </button>
      </div>

      {/* 책 정보 */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 mb-4">
        <h1 className="text-lg font-bold text-gray-900">{book.title}</h1>
        <p className="text-sm text-gray-500 mt-0.5">{book.author}</p>
      </div>

      {/* 독서 기록 (원서읽기는 스크린샷 인증 방식이라 텍스트 기록 섹션 숨김) */}
      {!isEnglishBook && (
        <>
      <h2 className="text-sm font-semibold text-gray-700 mb-3">나만의 독서기록</h2>
      {loading ? (
        <div className="text-center py-12 text-gray-400">
          <Loader2 size={20} className="animate-spin mx-auto mb-2" />
          <p className="text-xs">불러오는 중...</p>
        </div>
      ) : records.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 text-center">
          <p className="text-sm text-gray-400">이 책의 독서 기록이 없습니다.</p>
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
                      +{record.progressAmount}
                      {unit}
                    </span>
                    <span className="text-xs text-gray-400">
                      {record.noteType === "sentence"
                        ? "오늘의 문장"
                        : "내용 요약"}
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
                      {record.startValue}
                      {unit} → {record.endValue}
                      {unit}
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
                        <p className="text-xs text-gray-400 font-medium mb-1">
                          나만의 생각
                        </p>
                        <p className="text-sm text-gray-700 leading-relaxed">
                          {record.thoughts}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
        </>
      )}
    </div>
  );
}
