"use client";

import { useRef, useState } from "react";
import { Upload, X } from "lucide-react";
import { applyTimestamp, fileToBase64 } from "@/lib/utils";
import { uploadImages } from "@/lib/upload-image";
import { useRitualDraft } from "@/hooks/useRitualDraft";
import RitualDraftButtons from "@/components/common/RitualDraftButtons";
import type { AddNewCleanupProps } from "@/types/routines/cleanup";
import type { CleanupArea, CleanupMetricType } from "@/types/supabase";
import {
  CLEANUP_AREA_OPTIONS,
  CLEANUP_METRIC_OPTIONS,
  getCleanupMetricMeta,
} from "./constants";

const MAX_CERT_PHOTOS = 2;
const CLEANUP_DRAFT_KEY = "cleanup";

interface CleanupDraftData {
  area: CleanupArea | "";
  customArea: string;
  certPhotos: string[];
  metricType: CleanupMetricType | "";
  metricValue: string;
  note: string;
}

export default function AddNewCleanup({
  onCancel,
  onBackToHome,
  onSubmit,
}: AddNewCleanupProps) {
  const [area, setArea] = useState<CleanupArea | "">("");
  const [customArea, setCustomArea] = useState("");
  const [certPhotos, setCertPhotos] = useState<string[]>([]);
  const [metricType, setMetricType] = useState<CleanupMetricType | "">("");
  const [metricValue, setMetricValue] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);
  const loadedFromDraftRef = useRef(false);
  const {
    hasDraft,
    loading: draftLoading,
    saving: draftSaving,
    saveDraft,
    loadDraft,
    clearDraft,
  } = useRitualDraft<CleanupDraftData>(CLEANUP_DRAFT_KEY);

  const metricNumber = metricValue ? Number(metricValue) : NaN;
  const hasMetric = Boolean(metricType && metricValue.trim());
  const isMetricValid = !hasMetric || (!Number.isNaN(metricNumber) && metricNumber > 0);
  const isValid =
    Boolean(area) &&
    (area !== "other" || customArea.trim().length > 0) &&
    certPhotos.length > 0 &&
    note.trim().length > 0 &&
    isMetricValid;

  const handlePhotoFiles = async (files: FileList | null) => {
    if (!files) return;
    const remaining = MAX_CERT_PHOTOS - certPhotos.length;
    if (remaining <= 0) return;
    const newFiles = Array.from(files)
      .filter((file) => file.type.startsWith("image/"))
      .slice(0, remaining);
    const stamped = await Promise.all(
      newFiles.map((file) => applyTimestamp(file).catch(() => fileToBase64(file))),
    );
    setCertPhotos((prev) => [...prev, ...stamped].slice(0, MAX_CERT_PHOTOS));
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    await handlePhotoFiles(e.target.files);
    e.target.value = "";
  };

  const handlePhotoDrop = async (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    await handlePhotoFiles(e.dataTransfer.files);
  };

  const removePhoto = (index: number) => {
    setCertPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveDraft = async () => {
    return saveDraft({
      area,
      customArea,
      certPhotos,
      metricType,
      metricValue,
      note,
    });
  };

  const handleLoadDraft = async () => {
    const draft = await loadDraft();
    if (!draft) return;
    setArea(draft.area ?? "");
    setCustomArea(draft.customArea ?? "");
    setCertPhotos(draft.certPhotos ?? []);
    setMetricType(draft.metricType ?? "");
    setMetricValue(draft.metricValue ?? "");
    setNote(draft.note ?? "");
    loadedFromDraftRef.current = true;
  };

  const handleSubmit = async () => {
    if (submittingRef.current || !isValid || !area) return;
    submittingRef.current = true;
    setSubmitting(true);

    try {
      const uploadedPhotos = await uploadImages(certPhotos);
      await onSubmit?.({
        area,
        customArea: area === "other" ? customArea.trim() : undefined,
        certPhotos: uploadedPhotos,
        metric:
          hasMetric && metricType
            ? { type: metricType, value: metricNumber }
            : undefined,
        note: note.trim(),
      });
      if (!onSubmit) onCancel();
      if (loadedFromDraftRef.current) {
        await clearDraft();
        loadedFromDraftRef.current = false;
      }
    } catch {
      alert("기록 저장 중 문제가 발생했습니다. 다시 시도해 주세요.");
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  const selectedMetric = metricType ? getCleanupMetricMeta(metricType) : null;

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={onCancel}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="text-sm">정돈 리추얼로 돌아가기</span>
        </button>
        <button
          type="button"
          onClick={onBackToHome}
          className="flex items-center justify-center w-8 h-8 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="max-w-2xl bg-white rounded-2xl border border-gray-200 p-4 mx-auto">
        <h2 className="text-xl font-bold text-gray-900 mb-1">정돈 기록</h2>
        <p className="text-sm text-gray-500 mb-5">
          오늘 10분 동안 정리한 공간이나 디지털 환경을 인증해 주세요.
        </p>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            오늘 정리한 분야 <span className="text-red-400">*</span>
          </label>
          <select
            value={area}
            onChange={(e) => setArea(e.target.value as CleanupArea | "")}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-400/30 focus:border-teal-400"
          >
            <option value="">분야를 선택하세요</option>
            {CLEANUP_AREA_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {area === "other" && (
            <input
              type="text"
              value={customArea}
              onChange={(e) => setCustomArea(e.target.value)}
              placeholder="정리한 분야를 입력하세요"
              className="mt-2 w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-400/30 focus:border-teal-400"
            />
          )}
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            사진 업로드 <span className="text-red-400">*</span>
          </label>
          <p className="text-xs text-gray-500 mb-3 leading-relaxed">
            Before / After, 결과 화면 캡처, 정리 완료 사진 중 최대 2장
          </p>
          <div className="space-y-3">
            {certPhotos.length < MAX_CERT_PHOTOS && (
              <label
                className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-teal-400 transition-colors bg-gray-50"
                onDragOver={(e) => e.preventDefault()}
                onDrop={handlePhotoDrop}
              >
                <Upload className="w-8 h-8 text-gray-400 mb-2" />
                <p className="text-sm text-gray-500">
                  이미지 업로드 또는 드래그 ({certPhotos.length}/{MAX_CERT_PHOTOS})
                </p>
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  multiple
                  onChange={handlePhotoUpload}
                />
              </label>
            )}

            {certPhotos.length > 0 && (
              <div className="grid grid-cols-2 gap-3">
                {certPhotos.map((photo, index) => (
                  <div key={index} className="relative">
                    <img
                      src={photo}
                      alt={`정돈 인증 사진 ${index + 1}`}
                      className="w-full h-32 object-cover rounded-xl"
                    />
                    <button
                      type="button"
                      onClick={() => removePhoto(index)}
                      className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center bg-black/50 rounded-full text-white hover:bg-black/70"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            숫자 입력 <span className="text-gray-400 font-normal">(선택)</span>
          </label>
          <div className="grid grid-cols-[1fr_120px] gap-2">
            <select
              value={metricType}
              onChange={(e) => setMetricType(e.target.value as CleanupMetricType | "")}
              className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-400/30 focus:border-teal-400"
            >
              <option value="">항목 선택</option>
              {CLEANUP_METRIC_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <div className="relative">
              <input
                type="number"
                min="0"
                step="1"
                value={metricValue}
                onChange={(e) => setMetricValue(e.target.value)}
                placeholder="빈 값 가능"
                disabled={!metricType}
                className="w-full px-3 py-3 pr-9 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-400/30 focus:border-teal-400 disabled:text-gray-300"
              />
              {selectedMetric && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                  {selectedMetric.unit}
                </span>
              )}
            </div>
          </div>
          {!isMetricValid && (
            <p className="mt-1.5 text-xs text-red-400">
              숫자 입력 시 0보다 큰 값을 입력해 주세요.
            </p>
          )}
        </div>

        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            오늘의 한 줄 비움 소감 <span className="text-red-400">*</span>
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="다운로드 폴더를 드디어 정리했다. 너무 뿌듯해! 정신이 맑아지는 느낌 ㅎㅎ"
            rows={4}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 resize-none focus:outline-none focus:ring-2 focus:ring-teal-400/30 focus:border-teal-400"
          />
        </div>

        <RitualDraftButtons
          hasDraft={hasDraft}
          loading={draftLoading}
          saving={draftSaving}
          onSave={handleSaveDraft}
          onLoad={handleLoadDraft}
        />

        <button
          type="button"
          onClick={handleSubmit}
          disabled={!isValid || submitting}
          className="w-full py-3 rounded-2xl text-sm font-bold text-white shadow-sm transition-all hover:shadow-md active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ backgroundColor: "#14b8a6" }}
        >
          {submitting ? "저장 중..." : "정돈 인증 완료"}
        </button>
      </div>
    </div>
  );
}
