"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Loader2,
  ExternalLink,
  X,
  Plus,
  Pencil,
  Trash2,
  Upload,
} from "lucide-react";
import LinkifiedText from "@/components/common/LinkifiedText";
import EditFeedRecord from "@/components/Feed/EditFeedRecord";
import {
  createRitualRecordAuto,
  deleteRitualRecord,
  getMyRitualRecords,
} from "@/api/ritual-record";
import { isDateInCurrentKoreaWeek } from "@/lib/current-week";
import { formatKoreaDateKey } from "@/lib/korea-date";
import { fileToBase64 } from "@/lib/utils";
import { uploadImages } from "@/lib/upload-image";
import {
  normalizeRecordingEntries,
  type RecordingEntry,
  type RecordingMode,
  type RecordingRecordData,
  type Json,
} from "@/types/supabase";
import type { FeedItem, RecordingFeedData } from "@/types/feed";

interface RecordingContainerProps {
  mode?: "main" | "new";
  elapsedSeconds?: number;
}

interface RecordingRecord {
  id: string;
  date: string;
  entries: RecordingEntry[];
  photos?: string[];
}

const DURATION_OPTIONS = [10, 20, 30, 40, 50, 60];
const MAX_RECORDING_PHOTOS = 4;
const WEEKLY_READ_LIMIT = 2;

const emptyWrite = (): RecordingEntry => ({
  type: "write",
  title: "",
  content: "",
  link: "",
  duration: undefined,
});

const emptyRead = (): RecordingEntry => ({
  type: "read",
  readSourceTitle: "",
  readResonatedPart: "",
  readReason: "",
});

const isEntryValid = (e: RecordingEntry): boolean => {
  if (e.type === "write") {
    return (
      !!(e.title ?? "").trim() &&
      (!!e.content.trim() || !!(e.link ?? "").trim()) &&
      !!e.duration
    );
  }
  return (
    !!e.readSourceTitle.trim() &&
    !!e.readResonatedPart.trim() &&
    !!e.readReason.trim()
  );
};

export default function RecordingContainer({
  mode = "main",
  elapsedSeconds = 0,
}: RecordingContainerProps) {
  const router = useRouter();
  const [records, setRecords] = useState<RecordingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // 폼 상태: 모드(글 작성/글 읽기 대체) + 항목 묶음
  const [formMode, setFormMode] = useState<RecordingMode>("write");
  const [writeInputMode, setWriteInputMode] = useState<"link" | "content">(
    "link",
  );
  const [entries, setEntries] = useState<RecordingEntry[]>([emptyWrite()]);
  const [certPhotos, setCertPhotos] = useState<string[]>([]);
  const [weeklyReadDates, setWeeklyReadDates] = useState<string[]>([]);
  const [weeklyReadLoading, setWeeklyReadLoading] = useState(true);

  const goHome = () => router.push("/home");
  const goMain = () => router.push("/home/recording");
  const goNew = () => router.push("/home/recording/new");

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
          entries: normalizeRecordingEntries(d),
          photos: d.certPhotos,
        };
      });
      setRecords(mapped);
    }
    setLoading(false);
  }, []);

  const fetchWeeklyReadCount = useCallback(async () => {
    setWeeklyReadLoading(true);
    const { data } = await getMyRitualRecords({
      routineType: "recording",
      currentPeriodOnly: true,
    });
    const readDates = new Set<string>();
    for (const r of data ?? []) {
      if (!isDateInCurrentKoreaWeek(r.record_date)) continue;
      const d = r.record_data as unknown as RecordingRecordData;
      if (normalizeRecordingEntries(d).some((entry) => entry.type === "read")) {
        readDates.add(r.record_date);
      }
    }
    setWeeklyReadDates([...readDates]);
    setWeeklyReadLoading(false);
  }, []);

  useEffect(() => {
    void Promise.resolve().then(() => {
      if (mode === "main") return fetchRecords();
      if (mode === "new") return fetchWeeklyReadCount();
      return undefined;
    });
  }, [fetchRecords, fetchWeeklyReadCount, mode]);

  const handleDelete = async () => {
    if (!deleteTargetId) return;
    setDeleting(true);
    const { error } = await deleteRitualRecord(deleteTargetId);
    setDeleting(false);
    setDeleteTargetId(null);
    if (error) {
      alert(`삭제 실패: ${error}`);
      return;
    }
    fetchRecords();
  };

  const today = formatKoreaDateKey();
  const readLimitReached =
    weeklyReadDates.length >= WEEKLY_READ_LIMIT &&
    !weeklyReadDates.includes(today);
  const readSelectDisabled = weeklyReadLoading || readLimitReached;

  useEffect(() => {
    if (formMode !== "read" || !readLimitReached) return;
    setFormMode("write");
    setEntries([emptyWrite()]);
    setCertPhotos([]);
  }, [formMode, readLimitReached]);

  const switchFormMode = (next: RecordingMode) => {
    if (next === "read" && readSelectDisabled) return;
    if (next === formMode) return;
    setFormMode(next);
    setEntries([next === "write" ? emptyWrite() : emptyRead()]);
    setWriteInputMode("link");
    if (next === "read") setCertPhotos([]);
  };

  const updateEntry = (index: number, patch: Partial<RecordingEntry>) => {
    setEntries((prev) =>
      prev.map((e, i) =>
        i === index ? ({ ...e, ...patch } as RecordingEntry) : e,
      ),
    );
  };

  const removeEntry = (index: number) => {
    setEntries((prev) => prev.filter((_, i) => i !== index));
  };

  const addReadEntry = () => {
    setEntries((prev) => [...prev, emptyRead()]);
  };

  const handlePhotoFiles = async (files: FileList | null) => {
    if (!files) return;
    const remaining = MAX_RECORDING_PHOTOS - certPhotos.length;
    if (remaining <= 0) return;
    const imageFiles = Array.from(files)
      .filter((file) => file.type.startsWith("image/"))
      .slice(0, remaining);
    if (imageFiles.length === 0) return;
    const nextPhotos = await Promise.all(imageFiles.map(fileToBase64));
    setCertPhotos((prev) =>
      [...prev, ...nextPhotos].slice(0, MAX_RECORDING_PHOTOS),
    );
  };

  const removePhoto = (index: number) => {
    setCertPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const canSubmit =
    entries.length > 0 &&
    entries.every(isEntryValid) &&
    !(formMode === "read" && readLimitReached);

  const handleSubmit = async () => {
    if (submittingRef.current) return;
    if (!canSubmit) return;

    submittingRef.current = true;
    setSubmitting(true);

    try {
      const today = formatKoreaDateKey();
      const cleaned: RecordingEntry[] = entries.map((e) =>
        e.type === "write"
          ? {
              type: "write",
              title: (e.title ?? "").trim(),
              content: e.content.trim(),
              link: (e.link ?? "").trim(),
              duration: e.duration,
            }
          : {
              type: "read",
              readSourceTitle: e.readSourceTitle.trim(),
              readResonatedPart: e.readResonatedPart.trim(),
              readReason: e.readReason.trim(),
            },
      );
      const uploadedPhotos =
        formMode === "write" &&
        writeInputMode === "content" &&
        certPhotos.length > 0
          ? await uploadImages(certPhotos)
          : undefined;
      const recordData: RecordingRecordData = {
        entries: cleaned,
        ...(uploadedPhotos ? { certPhotos: uploadedPhotos } : {}),
      };
      const { error } = await createRitualRecordAuto({
        routineType: "recording",
        recordDate: today,
        recordData: recordData as unknown as Json,
      });
      if (error) {
        alert(`기록 저장 실패: ${error}`);
        return;
      }
      goMain();
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}분 ${s}초`;
  };

  const makeFeedItem = (record: RecordingRecord): FeedItem => ({
    id: record.id,
    odOriginalId: record.id,
    userId: "",
    userName: "",
    date: record.date,
    routineCategory: "기록",
    routineId: 0,
    recordId: 0,
    routineData: {
      entries: record.entries,
      certPhotos: record.photos,
    } satisfies RecordingFeedData,
  });

  if (mode === "new") {
    return (
      <div className="w-full max-w-2xl mx-auto px-4 py-4">
        {/* 네비게이션 */}
        <div className="flex items-center justify-between mb-4">
          <button
            type="button"
            onClick={goMain}
            className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            기록 관리로 돌아가기
          </button>
          <button
            type="button"
            onClick={goHome}
            className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <h2 className="text-lg font-bold text-gray-900 mb-4">기록 작성</h2>

        {/* 모드 선택 */}
        <div className="flex gap-2 mb-5">
          <button
            type="button"
            onClick={() => switchFormMode("write")}
            className={`flex-1 py-3 rounded-xl text-sm font-bold transition-colors ${
              formMode === "write"
                ? "bg-rose-500 text-white"
                : "bg-gray-100 text-gray-500 hover:bg-gray-200"
            }`}
          >
            글 작성
          </button>
          <button
            type="button"
            onClick={() => switchFormMode("read")}
            disabled={readSelectDisabled}
            aria-disabled={readSelectDisabled}
            title={
              readLimitReached
                ? "글 읽기 대체는 일주일 중 2일까지만 달성할 수 있어요"
                : weeklyReadLoading
                  ? "글 읽기 대체 인증 날짜를 확인하는 중이에요"
                : undefined
            }
            className={`flex-1 py-3 rounded-xl text-sm font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-45 ${
              formMode === "read"
                ? "bg-rose-500 text-white"
                : "bg-gray-100 text-gray-500 hover:bg-gray-200"
            }`}
          >
            {weeklyReadLoading ? "확인 중..." : "글 읽기 대체"}
          </button>
        </div>

        {readLimitReached && (
          <p className="-mt-3 mb-4 rounded-xl bg-rose-50 px-3 py-2 text-xs font-medium text-rose-600">
            이번 주 글 읽기 대체를 2일 달성했어요. 다음 주에 다시 선택할 수
            있어요.
          </p>
        )}

        {/* 글 읽기 대체: 다른 챌린저 글 보기 안내 */}
        {formMode === "read" && (
          <a
            href="/feeds"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between gap-2 mb-4 px-4 py-3 rounded-xl bg-violet-50 border border-violet-100 text-violet-700 hover:bg-violet-100 transition-colors"
          >
            <span className="text-sm font-medium">다른 챌린저 글 보러가기</span>
            <ExternalLink className="w-4 h-4" />
          </a>
        )}

        <div className="space-y-4 mb-4">
          {entries.map((entry, idx) => (
            <EntryCard
              key={idx}
              index={idx}
              entry={entry}
              canRemove={formMode === "read" && entries.length > 1}
              showIndex={formMode === "read"}
              writeInputMode={writeInputMode}
              onChange={(patch) => updateEntry(idx, patch)}
              onWriteInputModeChange={setWriteInputMode}
              certPhotos={certPhotos}
              onPhotoFiles={handlePhotoFiles}
              onRemovePhoto={removePhoto}
              onRemove={() => removeEntry(idx)}
            />
          ))}
        </div>

        {/* 글 읽기 대체 항목 추가 */}
        {formMode === "read" && (
          <div className="mb-6">
            <button
              type="button"
              onClick={addReadEntry}
              disabled={readLimitReached}
              className="w-full py-3 rounded-xl text-xs font-bold border-2 border-dashed border-violet-200 text-violet-500 hover:bg-violet-50 transition-colors flex items-center justify-center gap-1.5 disabled:cursor-not-allowed disabled:opacity-45"
            >
              <Plus className="w-4 h-4" />
              다른 사람 글 읽기 추가
            </button>
            {readLimitReached && (
              <p className="mt-2 text-center text-xs text-violet-500">
                글 읽기 대체는 일주일 중 2일까지만 추가할 수 있어요.
              </p>
            )}
          </div>
        )}

        {/* 저장 버튼 */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting || !canSubmit}
          className="w-full py-3.5 rounded-2xl text-sm font-bold text-white shadow-sm transition-all hover:shadow-md active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ backgroundColor: "#f43f5e" }}
        >
          {submitting ? "저장 중..." : "오늘의 리추얼 성공"}
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
          onClick={goHome}
          className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      {/* 헤더 */}
      <div className="rounded-2xl bg-white shadow-sm border border-gray-100 p-4 mb-4">
        <p className="text-xs text-gray-400 font-medium mb-0.5">기록 리추얼</p>
        <h1 className="text-lg font-bold text-gray-900 mb-4">
          오늘의 생각을 기록해요
        </h1>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-red-50 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-gray-900">
              {new Set(records.map((r) => r.date)).size}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">기록한 날</p>
          </div>
          {elapsedSeconds > 0 && (
            <div className="bg-red-50 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-gray-900">
                {formatTime(elapsedSeconds)}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">소요 시간</p>
            </div>
          )}
        </div>
      </div>

      {/* 기록 추가 버튼 */}
      <div className="mb-4">
        <button
          type="button"
          onClick={goNew}
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
        <p className="text-center text-sm text-gray-300 py-8">
          아직 작성한 기록이 없어요
        </p>
      ) : (
        <div className="space-y-3">
          {records.map((record) => (
            <div
              key={record.id}
              className="rounded-2xl bg-white shadow-sm border border-gray-100 p-4"
            >
              <p className="text-[10px] text-gray-300 font-medium mb-3">
                {record.date}
              </p>
              {editingRecordId === record.id ? (
                <EditFeedRecord
                  item={makeFeedItem(record)}
                  onCancel={() => {
                    setEditingRecordId(null);
                    fetchRecords();
                  }}
                />
              ) : (
                <>
              <div className="space-y-3">
                {record.entries.map((entry, i) => (
                  <RecordEntryView key={i} entry={entry} />
                ))}
              </div>
              {record.photos && record.photos.length > 0 && (
                <div
                  className={`grid gap-2 mt-3 ${record.photos.length > 1 ? "grid-cols-2" : "grid-cols-1"}`}
                >
                  {record.photos.map((url, i) => (
                    <Image
                      key={i}
                      src={url}
                      alt={`기록 사진 ${i + 1}`}
                      width={640}
                      height={360}
                      className="w-full rounded-xl object-cover max-h-64"
                      unoptimized
                    />
                  ))}
                </div>
              )}
              <div className="flex items-center justify-end gap-3 mt-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() =>
                    setEditingRecordId((current) =>
                      current === record.id ? null : record.id,
                    )
                  }
                  className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-800 transition-colors"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  {editingRecordId === record.id ? "수정 닫기" : "수정"}
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteTargetId(record.id)}
                  className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  삭제
                </button>
              </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 삭제 확인 모달 */}
      {deleteTargetId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-6"
          onClick={() => !deleting && setDeleteTargetId(null)}
        >
          <div
            className="w-full max-w-xs rounded-2xl bg-white p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-semibold text-gray-900">
              기록을 삭제하시겠습니까?
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              이 작업은 되돌릴 수 없습니다.
            </p>
            <div className="mt-5 flex gap-2">
              <button
                onClick={() => setDeleteTargetId(null)}
                disabled={deleting}
                className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
              >
                취소
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 rounded-xl py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: "#ef4444" }}
              >
                {deleting ? "삭제 중..." : "삭제"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function RecordEntryView({ entry }: { entry: RecordingEntry }) {
  if (entry.type === "read") {
    return (
      <div className="rounded-xl bg-violet-50 p-3 space-y-2 overflow-hidden">
        <span className="inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded-md text-violet-600 bg-violet-100">
          글 읽기 대체
        </span>
        {entry.readSourceTitle && (
          <div className="min-w-0">
            <p className="text-[10px] text-gray-400 font-medium">
              챌린저 닉네임
            </p>
            <LinkifiedText
              text={entry.readSourceTitle}
              className="text-sm text-gray-800"
            />
          </div>
        )}
        {entry.readResonatedPart && (
          <div className="min-w-0">
            <p className="text-[10px] text-gray-400 font-medium">
              마음에 닿은 부분
            </p>
            <LinkifiedText
              text={entry.readResonatedPart}
              className="text-sm text-gray-800"
            />
          </div>
        )}
        {entry.readReason && (
          <div className="min-w-0">
            <p className="text-[10px] text-gray-400 font-medium">
              마음에 닿은 이유 / 닮고 싶은 부분
            </p>
            <LinkifiedText
              text={entry.readReason}
              className="text-sm text-gray-800"
            />
          </div>
        )}
      </div>
    );
  }
  return (
    <div className="rounded-xl bg-rose-50 p-3 space-y-2 overflow-hidden">
      <span className="inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded-md text-rose-600 bg-rose-100">
        글 작성
      </span>
      {entry.title && (
        <div className="min-w-0">
          <p className="text-[10px] text-gray-400 font-medium">제목</p>
          <LinkifiedText
            text={entry.title}
            className="text-sm font-semibold text-gray-800"
          />
        </div>
      )}
      {entry.content && (
        <div className="min-w-0">
          <p className="text-[10px] text-gray-400 font-medium">작성한 글</p>
          <LinkifiedText
            text={entry.content}
            className="text-sm text-gray-800"
          />
        </div>
      )}
      {entry.duration ? (
        <p className="text-xs text-gray-500">작성 시간 {entry.duration}분</p>
      ) : null}
      {entry.link && (
        <a
          href={entry.link}
          target="_blank"
          rel="noopener noreferrer"
          className="block text-xs text-blue-500 hover:underline break-all"
        >
          {entry.link}
        </a>
      )}
    </div>
  );
}

function EntryCard({
  index,
  entry,
  canRemove,
  showIndex,
  writeInputMode,
  onChange,
  onWriteInputModeChange,
  certPhotos,
  onPhotoFiles,
  onRemovePhoto,
  onRemove,
}: {
  index: number;
  entry: RecordingEntry;
  canRemove: boolean;
  showIndex: boolean;
  writeInputMode: "link" | "content";
  onChange: (patch: Partial<RecordingEntry>) => void;
  onWriteInputModeChange: (mode: "link" | "content") => void;
  certPhotos: string[];
  onPhotoFiles: (files: FileList | null) => Promise<void>;
  onRemovePhoto: (index: number) => void;
  onRemove: () => void;
}) {
  const isWrite = entry.type === "write";
  const headerBg = isWrite ? "bg-rose-50" : "bg-violet-50";

  return (
    <div className={`rounded-2xl border border-gray-200 ${headerBg} p-4`}>
      {(showIndex || canRemove) && (
        <div className="flex items-center justify-between mb-3">
          {showIndex ? (
            <span className="text-xs text-gray-500 font-semibold">
              #{index + 1}
            </span>
          ) : (
            <span />
          )}
          {canRemove && (
            <button
              type="button"
              onClick={onRemove}
              className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-white rounded-full transition-colors"
              aria-label="항목 삭제"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {isWrite ? (
        <WriteFields
          entry={entry as Extract<RecordingEntry, { type: "write" }>}
          writeInputMode={writeInputMode}
          onChange={onChange}
          onWriteInputModeChange={onWriteInputModeChange}
          certPhotos={certPhotos}
          onPhotoFiles={onPhotoFiles}
          onRemovePhoto={onRemovePhoto}
        />
      ) : (
        <ReadFields
          entry={entry as Extract<RecordingEntry, { type: "read" }>}
          onChange={onChange}
        />
      )}
    </div>
  );
}

function WriteFields({
  entry,
  writeInputMode,
  onChange,
  onWriteInputModeChange,
  certPhotos,
  onPhotoFiles,
  onRemovePhoto,
}: {
  entry: Extract<RecordingEntry, { type: "write" }>;
  writeInputMode: "link" | "content";
  onChange: (patch: Partial<RecordingEntry>) => void;
  onWriteInputModeChange: (mode: "link" | "content") => void;
  certPhotos: string[];
  onPhotoFiles: (files: FileList | null) => Promise<void>;
  onRemovePhoto: (index: number) => void;
}) {
  const canAddPhoto = certPhotos.length < MAX_RECORDING_PHOTOS;

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-semibold text-gray-500 mb-1.5">
          작성에 걸린 시간 (분) <span className="text-red-400">*</span>
        </label>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {DURATION_OPTIONS.map((min) => (
            <button
              key={min}
              type="button"
              onClick={() =>
                onChange({ duration: entry.duration === min ? undefined : min })
              }
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                entry.duration === min
                  ? "bg-rose-500 text-white"
                  : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
              }`}
            >
              {min}분
            </button>
          ))}
        </div>
        <input
          type="number"
          value={entry.duration ?? ""}
          onChange={(e) =>
            onChange({
              duration: e.target.value ? parseInt(e.target.value) : undefined,
            })
          }
          placeholder="직접 입력 (분)"
          min="1"
          className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[var(--gold-400)]/30 focus:border-[var(--gold-400)] transition-all"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-500 mb-1.5">
          인증 방식 <span className="text-red-400">*</span>
        </label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => {
              onWriteInputModeChange("link");
              onChange({ content: "" });
            }}
            className={`rounded-xl border px-3 py-2.5 text-sm font-semibold transition-colors ${
              writeInputMode === "link"
                ? "border-rose-300 bg-white text-rose-600"
                : "border-gray-200 bg-white text-gray-500 hover:bg-gray-50"
            }`}
          >
            링크
          </button>
          <button
            type="button"
            onClick={() => {
              onWriteInputModeChange("content");
              onChange({ link: "" });
            }}
            className={`rounded-xl border px-3 py-2.5 text-sm font-semibold transition-colors ${
              writeInputMode === "content"
                ? "border-rose-300 bg-white text-rose-600"
                : "border-gray-200 bg-white text-gray-500 hover:bg-gray-50"
            }`}
          >
            글 작성
          </button>
        </div>
      </div>

      {writeInputMode === "link" ? (
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">
              제목 <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={entry.title ?? ""}
              onChange={(e) => onChange({ title: e.target.value })}
              placeholder="오늘 작성한 글 제목"
              className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[var(--gold-400)]/30 focus:border-[var(--gold-400)] transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">
              작성 링크 <span className="text-red-400">*</span>
            </label>
            <input
              type="url"
              value={entry.link ?? ""}
              onChange={(e) => onChange({ link: e.target.value })}
              placeholder="https://..."
              className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[var(--gold-400)]/30 focus:border-[var(--gold-400)] transition-all"
            />
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">
              제목 <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={entry.title ?? ""}
              onChange={(e) => onChange({ title: e.target.value })}
              placeholder="오늘 작성한 글 제목"
              className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[var(--gold-400)]/30 focus:border-[var(--gold-400)] transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">
              글 작성 <span className="text-red-400">*</span>
            </label>
            <textarea
              value={entry.content}
              onChange={(e) => onChange({ content: e.target.value })}
              placeholder="오늘 작성한 글을 자유롭게 적어주세요"
              rows={8}
              className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-800 resize-y focus:outline-none focus:ring-2 focus:ring-[var(--gold-400)]/30 focus:border-[var(--gold-400)] transition-all"
            />
          </div>
        </div>
      )}

      {writeInputMode === "content" && (
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1.5">
            사진 <span className="text-gray-400">(선택)</span>
          </label>
          {canAddPhoto && (
            <label
              className="flex min-h-28 w-full cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-rose-200 bg-white/70 px-4 py-5 text-center transition-colors hover:border-rose-300 hover:bg-white"
              onDragOver={(e) => e.preventDefault()}
              onDrop={async (e) => {
                e.preventDefault();
                await onPhotoFiles(e.dataTransfer.files);
              }}
            >
              <Upload className="mb-2 h-6 w-6 text-rose-300" />
              <span className="text-xs font-semibold text-gray-600">
                사진 업로드
              </span>
              <span className="mt-1 text-[11px] text-gray-400">
                클릭하거나 드래그해서 최대 {MAX_RECORDING_PHOTOS}장까지 첨부
              </span>
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={async (e) => {
                  await onPhotoFiles(e.target.files);
                  e.target.value = "";
                }}
              />
            </label>
          )}
          {certPhotos.length > 0 && (
            <div className="mt-3 grid grid-cols-2 gap-2">
              {certPhotos.map((photo, index) => (
                <div
                  key={`${photo.slice(0, 32)}-${index}`}
                  className="relative overflow-hidden rounded-xl border border-rose-100 bg-white"
                >
                  <Image
                    src={photo}
                    alt={`인증 사진 ${index + 1}`}
                    width={320}
                    height={180}
                    className="h-36 w-full object-cover"
                    unoptimized
                  />
                  <button
                    type="button"
                    onClick={() => onRemovePhoto(index)}
                    className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-white transition-colors hover:bg-black/70"
                    aria-label="사진 삭제"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ReadFields({
  entry,
  onChange,
}: {
  entry: Extract<RecordingEntry, { type: "read" }>;
  onChange: (patch: Partial<RecordingEntry>) => void;
}) {
  return (
    <div className="space-y-3">
      <div>
        <label className="mb-1.5 block text-xs font-semibold text-gray-500">
          오늘 읽은 다른 챌린저 글 <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          value={entry.readSourceTitle}
          onChange={(e) => onChange({ readSourceTitle: e.target.value })}
          placeholder="챌린저 닉네임"
          className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[var(--gold-400)]/30 focus:border-[var(--gold-400)] transition-all"
        />
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-semibold text-gray-500">
          1. 마음에 닿은 부분 <span className="text-red-400">*</span>
        </label>
        <textarea
          value={entry.readResonatedPart}
          onChange={(e) => onChange({ readResonatedPart: e.target.value })}
          placeholder="마음에 닿은 부분"
          rows={3}
          className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-800 resize-y focus:outline-none focus:ring-2 focus:ring-[var(--gold-400)]/30 focus:border-[var(--gold-400)] transition-all"
        />
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-semibold text-gray-500">
          2. 마음에 닿았던 이유 / 닮고 싶은 부분{" "}
          <span className="text-red-400">*</span>
        </label>
        <textarea
          value={entry.readReason}
          onChange={(e) => onChange({ readReason: e.target.value })}
          placeholder="마음에 닿았던 이유 / 닮고 싶은 부분"
          rows={3}
          className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-800 resize-y focus:outline-none focus:ring-2 focus:ring-[var(--gold-400)]/30 focus:border-[var(--gold-400)] transition-all"
        />
      </div>
    </div>
  );
}
