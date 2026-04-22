"use client";

import { useState, useEffect, useCallback } from "react";
import { Loader2, ExternalLink, ImagePlus, X as XIcon } from "lucide-react";
import { createRitualRecordAuto, getMyRitualRecords } from "@/api/ritual-record";
import { applyTimestamp, fileToBase64 } from "@/lib/utils";
import type { RecordingRecordData, Json } from "@/types/supabase";

interface RecordingContainerProps {
  elapsedSeconds?: number;
  certificationPhotos?: string[];
  onBackToTimer: () => void;
  onBackToHome: () => void;
}

type InputMode = "text" | "photo";

interface RecordingRecord {
  id: string;
  date: string;
  content: string;
  link?: string;
  photos?: string[];
}

export default function RecordingContainer({
  elapsedSeconds = 0,
  certificationPhotos,
  onBackToTimer,
  onBackToHome,
}: RecordingContainerProps) {
  const [records, setRecords] = useState<RecordingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // 폼 상태
  const [mode, setMode] = useState<InputMode>("text");
  const [content, setContent] = useState("");
  const [link, setLink] = useState("");
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [photoProcessing, setPhotoProcessing] = useState(false);

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
          photos: d.certPhotos,
        };
      });
      setRecords(mapped);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setPhotoProcessing(true);
    const stamped = await applyTimestamp(file).catch(() => fileToBase64(file));
    setPhotoDataUrl(stamped);
    setPhotoProcessing(false);
  };

  const clearPhoto = () => {
    setPhotoDataUrl(null);
  };

  const resetForm = () => {
    setContent("");
    setLink("");
    clearPhoto();
    setMode("text");
    setShowForm(false);
  };

  const handleSubmit = async () => {
    if (mode === "text" && !content.trim()) return;
    if (mode === "photo" && !photoDataUrl) return;

    setSubmitting(true);

    const photos: string[] | undefined =
      mode === "photo" && photoDataUrl
        ? [photoDataUrl]
        : certificationPhotos?.length
          ? certificationPhotos
          : undefined;

    const today = new Date().toISOString().split("T")[0];
    const recordData: RecordingRecordData = {
      content: mode === "text" ? content.trim() : "",
      link: link.trim() || undefined,
      certPhotos: photos,
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
    resetForm();
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

        {/* 모드 선택 */}
        <div className="flex gap-2 p-1 bg-gray-100 rounded-2xl mb-4">
          <button
            type="button"
            onClick={() => setMode("text")}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
              mode === "text"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            글로 작성
          </button>
          <button
            type="button"
            onClick={() => setMode("photo")}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
              mode === "photo"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            사진 업로드
          </button>
        </div>

        {mode === "text" ? (
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
        ) : (
          <div className="mb-4">
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
              사진 <span className="text-red-400">*</span>
            </label>
            {photoDataUrl ? (
              <div className="relative w-full rounded-2xl overflow-hidden bg-gray-50 border border-gray-200">
                <img
                  src={photoDataUrl}
                  alt="미리보기"
                  className="w-full max-h-80 object-contain"
                />
                <button
                  type="button"
                  onClick={clearPhoto}
                  className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors"
                  aria-label="사진 제거"
                >
                  <XIcon className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-48 rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors">
                <ImagePlus className="w-8 h-8 text-gray-300 mb-2" />
                <span className="text-sm text-gray-400">탭하여 사진 선택</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoChange}
                />
              </label>
            )}
            {photoProcessing && (
              <p className="text-xs text-gray-400 mt-2">타임스탬프 적용 중...</p>
            )}
          </div>
        )}

        {/* 링크 (선택) — 공통 */}
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
          disabled={
            submitting ||
            (mode === "text" ? !content.trim() : !photoDataUrl || photoProcessing)
          }
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
              {record.content && (
                <p className="text-sm text-gray-800 whitespace-pre-wrap">{record.content}</p>
              )}
              {record.photos && record.photos.length > 0 && (
                <div className={`grid gap-2 ${record.content ? "mt-2" : ""} ${record.photos.length > 1 ? "grid-cols-2" : "grid-cols-1"}`}>
                  {record.photos.map((url, i) => (
                    <img
                      key={i}
                      src={url}
                      alt={`기록 사진 ${i + 1}`}
                      className="w-full rounded-xl object-cover max-h-64"
                    />
                  ))}
                </div>
              )}
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
