"use client";

import { useState, useEffect, useCallback } from "react";
import { Loader2, ExternalLink } from "lucide-react";
import { createRitualRecordAuto, getMyRitualRecords } from "@/api/ritual-record";
import type { RecordingRecordData, Json } from "@/types/supabase";

interface RecordingContainerProps {
  elapsedSeconds?: number;
  onBackToTimer: () => void;
  onBackToHome: () => void;
}

interface RecordingRecord {
  id: string;
  date: string;
  content: string;
  link?: string;
}

export default function RecordingContainer({
  elapsedSeconds = 0,
  onBackToTimer,
  onBackToHome,
}: RecordingContainerProps) {
  const [records, setRecords] = useState<RecordingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // 폼 상태
  const [content, setContent] = useState("");
  const [link, setLink] = useState("");

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    const { data } = await getMyRitualRecords({ routineType: "recording" });
    if (data) {
      const mapped: RecordingRecord[] = data.map((r) => {
        const d = r.record_data as unknown as RecordingRecordData;
        const date = new Date(r.record_date);
        return {
          id: r.id,
          date: `${date.getMonth() + 1}월 ${date.getDate()}일`,
          content: d.content,
          link: d.link,
        };
      });
      setRecords(mapped);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const handleSubmit = async () => {
    if (!content.trim()) return;
    setSubmitting(true);
    const today = new Date().toISOString().split("T")[0];
    const recordData: RecordingRecordData = {
      content: content.trim(),
      link: link.trim() || undefined,
    };
    const { error } = await createRitualRecordAuto({
      routineType: "recording",
      recordDate: today,
      recordData: recordData as unknown as Json,
    });
    setSubmitting(false);
    if (error) {
      alert(`기록 저장 실패: ${error}`);
      return;
    }
    setContent("");
    setLink("");
    setShowForm(false);
    fetchRecords();
  };

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}분 ${s}초`;
  };

  if (showForm) {
    return (
      <div className="w-full max-w-2xl mx-auto px-4 py-4">
        {/* 네비게이션 */}
        <div className="flex items-center justify-between mb-4">
          <button
            type="button"
            onClick={() => setShowForm(false)}
            className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            ← 뒤로
          </button>
          <button
            type="button"
            onClick={onBackToHome}
            className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <h2 className="text-lg font-bold text-gray-900 mb-4">기록 작성</h2>

        {/* 내용 */}
        <div className="mb-4">
          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
            내용 <span className="text-red-400">*</span>
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="오늘의 기록을 남겨주세요"
            rows={6}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm text-gray-800 resize-none focus:outline-none focus:ring-2 focus:ring-[var(--gold-400)]/30 focus:border-[var(--gold-400)] focus:bg-white transition-all"
          />
        </div>

        {/* 링크 (선택) */}
        <div className="mb-6">
          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
            관련 링크 (선택)
          </label>
          <input
            type="url"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="https://..."
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[var(--gold-400)]/30 focus:border-[var(--gold-400)] focus:bg-white transition-all"
          />
        </div>

        {/* 저장 버튼 */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!content.trim() || submitting}
          className="w-full py-3.5 rounded-2xl text-sm font-bold text-white shadow-sm transition-all hover:shadow-md active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ backgroundColor: "#f43f5e" }}
        >
          {submitting ? "저장 중..." : "기록 저장하기"}
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-4">
      {/* 네비게이션 */}
      <div className="flex items-center justify-end mb-4">
        <button
          type="button"
          onClick={onBackToHome}
          className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* 헤더 */}
      <div className="rounded-2xl bg-white shadow-sm border border-gray-100 p-4 mb-4">
        <p className="text-xs text-gray-400 font-medium mb-0.5">기록 리추얼</p>
        <h1 className="text-lg font-bold text-gray-900 mb-4">오늘의 생각을 기록해요</h1>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-red-50 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-gray-900">{records.length}</p>
            <p className="text-xs text-gray-400 mt-0.5">기록한 날</p>
          </div>
          {elapsedSeconds > 0 && (
            <div className="bg-red-50 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-gray-900">{formatTime(elapsedSeconds)}</p>
              <p className="text-xs text-gray-400 mt-0.5">소요 시간</p>
            </div>
          )}
        </div>
      </div>

      {/* 외부 링크 */}
      <a
        href="https://notion.so"
        target="_blank"
        rel="noopener noreferrer"
        className="w-full flex items-center gap-3 bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-4 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 no-underline"
      >
        <div className="w-10 h-10 bg-rose-500 rounded-xl flex items-center justify-center flex-shrink-0">
          <ExternalLink className="w-5 h-5 text-white" />
        </div>
        <div className="text-left flex-1">
          <p className="text-sm font-semibold text-gray-900">기록 자료 페이지</p>
          <p className="text-xs text-gray-400 mt-0.5">클릭하여 기록 자료 페이지로 이동</p>
        </div>
        <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </a>

      {/* 기록 추가 버튼 */}
      <div className="mb-4">
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="w-full py-3 rounded-2xl text-sm font-bold text-white shadow-sm transition-all hover:shadow-md active:scale-[0.98]"
          style={{ backgroundColor: "#f43f5e" }}
        >
          + 오늘 기록 작성하기
        </button>
      </div>

      {/* 기록 목록 */}
      {loading ? (
        <div className="text-center py-8 text-gray-400">
          <Loader2 size={20} className="animate-spin mx-auto mb-2" />
          <p className="text-xs">기록을 불러오는 중...</p>
        </div>
      ) : records.length === 0 ? (
        <p className="text-center text-sm text-gray-300 py-8">아직 작성한 기록이 없어요</p>
      ) : (
        <div className="space-y-3">
          {records.map((record) => (
            <div
              key={record.id}
              className="rounded-2xl bg-white shadow-sm border border-gray-100 p-4"
            >
              <p className="text-[10px] text-gray-300 font-medium mb-1.5">{record.date}</p>
              <p className="text-sm text-gray-800 whitespace-pre-wrap">{record.content}</p>
              {record.link && (
                <a
                  href={record.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block mt-2 text-xs text-blue-500 hover:underline truncate max-w-full"
                >
                  {record.link}
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
