"use client";

import { useState, useRef } from "react";
import { Upload, X } from "lucide-react";
import CertificationPhotoIntervalModal from "@/components/common/CertificationPhotoIntervalModal";
import {
  applyTimestamp,
  fileToBase64,
  getPhotoTakenAt,
  hasMinimumPhotoInterval,
} from "@/lib/utils";
import { uploadImages } from "@/lib/upload-image";
import {
  AddNewMorningProps,
  MorningFormData,
  ConditionLevel,
  MorningRecordType,
} from "@/types/routines/morning";

const WEEKEND_PHOTO_MIN_INTERVAL_MINUTES = 30;
const MORNING_START_LIMIT_SECONDS = 7 * 60 * 60 + 59;
const MORNING_START_TIME_MESSAGE =
  "시작 사진의 촬영 시간은 07:00:59를 넘을 수 없습니다.";

function isAfterMorningStartLimit(takenAtTimes: number[]) {
  if (takenAtTimes.length === 0) return false;

  const startTime = new Date(Math.min(...takenAtTimes));
  const seconds =
    startTime.getHours() * 60 * 60 +
    startTime.getMinutes() * 60 +
    startTime.getSeconds();

  return seconds > MORNING_START_LIMIT_SECONDS;
}

export default function AddNewMorning({
  onCancel,
  onBackToHome,
  onSubmit,
}: AddNewMorningProps) {
  const [recordType, setRecordType] = useState<MorningRecordType>("weekday");
  const [images, setImages] = useState<string[]>([]);
  const [imageTakenAtTimes, setImageTakenAtTimes] = useState<number[]>([]);
  const [sleepHours, setSleepHours] = useState("");
  const [sleepImprovement, setSleepImprovement] = useState("");
  const [condition, setCondition] = useState<ConditionLevel | "">("");
  const [success, setSuccess] = useState("");
  const [reflection, setReflection] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showPhotoIntervalModal, setShowPhotoIntervalModal] = useState(false);
  const [showStartTimeModal, setShowStartTimeModal] = useState(false);
  const submittingRef = useRef(false);

  const sleepHoursNum = sleepHours ? parseFloat(sleepHours) : NaN;
  const showSleepImprovement =
    !Number.isNaN(sleepHoursNum) && sleepHoursNum < 7;

  const isValid =
    !!sleepHours &&
    !!condition &&
    success.trim().length > 0 &&
    reflection.trim().length > 0 &&
    (recordType === "weekday" || images.length === 2) &&
    (!showSleepImprovement || sleepImprovement.trim().length > 0);

  const handleImageFiles = async (files: FileList | null) => {
    if (!files) return;

    const newFiles = Array.from(files)
      .filter((file) => file.type.startsWith("image/"))
      .slice(0, 2 - images.length);

    if (newFiles.length === 0) return;

    const imageDrafts = await Promise.all(
      newFiles.map(async (file) => {
        const takenAt = await getPhotoTakenAt(file);
        const image = await applyTimestamp(file, takenAt).catch(() =>
          fileToBase64(file),
        );
        return { image, takenAtTime: takenAt.getTime() };
      }),
    );

    const nextTakenAtTimes = [
      ...imageTakenAtTimes,
      ...imageDrafts.map((draft) => draft.takenAtTime),
    ].slice(0, 2);

    if (isAfterMorningStartLimit(nextTakenAtTimes)) {
      setShowStartTimeModal(true);
      return;
    }

    if (
      nextTakenAtTimes.length >= 2 &&
      !hasMinimumPhotoInterval(
        nextTakenAtTimes,
        WEEKEND_PHOTO_MIN_INTERVAL_MINUTES,
      )
    ) {
      setShowPhotoIntervalModal(true);
      return;
    }

    setImages(
      [...images, ...imageDrafts.map((draft) => draft.image)].slice(0, 2),
    );
    setImageTakenAtTimes(nextTakenAtTimes);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    await handleImageFiles(e.target.files);
    e.target.value = "";
  };

  const handleImageDrop = async (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    await handleImageFiles(e.dataTransfer.files);
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setImageTakenAtTimes((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (submittingRef.current || !isValid) return;
    submittingRef.current = true;
    setSubmitting(true);

    try {
      const imageUrls =
        recordType === "weekend" && images.length > 0
          ? await uploadImages(images)
          : [];

      const recordData: MorningFormData = {
        recordType,
        certPhotos: imageUrls,
        sleepHours: sleepHoursNum,
        condition: condition as ConditionLevel,
        success: success.trim(),
        reflection: reflection.trim(),
        ...(showSleepImprovement
          ? { sleepImprovement: sleepImprovement.trim() }
          : {}),
      };

      if (onSubmit) {
        await onSubmit(recordData);
      } else {
        onCancel();
      }
    } catch {
      alert("기록 저장 중 문제가 발생했습니다. 다시 시도해 주세요.");
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <CertificationPhotoIntervalModal
        open={showPhotoIntervalModal}
        onClose={() => setShowPhotoIntervalModal(false)}
        title="인증 사진은 30분 이상 간격이 필요합니다"
        message="시작 사진과 종료 사진의 촬영 시간이 30분 이상 차이 나는 사진으로 다시 업로드해 주십시오."
      />
      <CertificationPhotoIntervalModal
        open={showStartTimeModal}
        onClose={() => setShowStartTimeModal(false)}
        title="시작시간을 확인해 주세요"
        message={MORNING_START_TIME_MESSAGE}
      />

      {/* 백 네비게이션 및 x버튼 */}
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={onCancel}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
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
          <span className="text-sm">모닝 리추얼로 돌아가기</span>
        </button>
        <button
          type="button"
          onClick={onBackToHome}
          className="flex items-center justify-center w-8 h-8 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
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

      {/* 메인 카드 */}
      <div className="max-w-2xl bg-white rounded-2xl border border-gray-200 p-4 mx-auto">
        {/* 평일 / 주말 탭 */}
        <div className="flex gap-2 mb-5">
          <button
            type="button"
            onClick={() => setRecordType("weekday")}
            className={`flex-1 py-3 rounded-xl text-sm font-bold transition-colors ${
              recordType === "weekday"
                ? "bg-orange-500 text-white"
                : "bg-gray-100 text-gray-500 hover:bg-gray-200"
            }`}
          >
            평일 기록
          </button>
          <button
            type="button"
            onClick={() => setRecordType("weekend")}
            className={`flex-1 py-3 rounded-xl text-sm font-bold transition-colors ${
              recordType === "weekend"
                ? "bg-orange-500 text-white"
                : "bg-gray-100 text-gray-500 hover:bg-gray-200"
            }`}
          >
            주말 기록
          </button>
        </div>

        {/* 헤더 */}
        <h2 className="text-xl font-bold text-gray-900 mb-4">모닝 기록</h2>

        {recordType === "weekend" && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              인증 사진
            </label>
            <p className="text-xs text-gray-500 mb-3 leading-relaxed">
              시작 사진과 종료 사진을 각각 1장씩 업로드해 주세요.
              <br /> 두 사진의 촬영 시간은 30분 이상 차이 나야 하며,{" "}
              <strong className="font-semibold text-gray-700">
                시작 사진은 07:00:59 이전에 촬영된 사진만 인정됩니다.
              </strong>
            </p>
            <div className="space-y-3">
              {images.length < 2 && (
                <label
                  className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-orange-400 transition-colors bg-gray-50"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleImageDrop}
                >
                  <div className="flex flex-col items-center justify-center">
                    <Upload className="w-8 h-8 text-gray-400 mb-2" />
                    <p className="text-sm text-gray-500">
                      이미지 업로드 또는 드래그 ({images.length}/2)
                    </p>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                  />
                </label>
              )}

              {images.length > 0 && (
                <div className="grid grid-cols-2 gap-3">
                  {images.map((image, index) => (
                    <div key={index} className="relative">
                      <img
                        src={image}
                        alt={`모닝 인증 이미지 ${index + 1}`}
                        className="w-full h-32 object-cover rounded-xl"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center bg-black bg-opacity-50 rounded-full text-white hover:bg-opacity-70"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 수면 시간 + 컨디션 */}
        <div className="mb-4 grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              수면 시간 (시간)
            </label>
            <input
              type="number"
              value={sleepHours}
              onChange={(e) => setSleepHours(e.target.value)}
              placeholder="예: 7.5"
              min="0"
              max="24"
              step="0.5"
              className="w-full px-4 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900 placeholder-gray-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              컨디션
            </label>
            <div className="relative">
              <select
                value={condition}
                onChange={(e) =>
                  setCondition(e.target.value as ConditionLevel | "")
                }
                className="w-full px-4 py-4 pr-10 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900 appearance-none cursor-pointer"
              >
                <option value="">선택</option>
                <option value="상">상</option>
                <option value="중">중</option>
                <option value="하">하</option>
              </select>
              <svg
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* 수면 시간 7시간 미만 시 원인 & 개선 방법 */}
        {showSleepImprovement && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              수면이 부족한 원인과 개선할 수 있는 방법
            </label>
            <textarea
              value={sleepImprovement}
              onChange={(e) => setSleepImprovement(e.target.value)}
              placeholder="예: 늦게까지 휴대폰을 본 것이 원인. 잠자기 1시간 전에는 화면을 보지 않기."
              rows={3}
              className="w-full px-4 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900 placeholder-gray-400 resize-none"
            />
          </div>
        )}

        {/* 오늘의 작은 성공 (오늘 한 일) */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            오늘의 작은 성공 (오늘 한 일)
          </label>
          <textarea
            value={success}
            onChange={(e) => setSuccess(e.target.value)}
            placeholder="오늘 한 일 중 작은 성공을 적어보세요"
            rows={3}
            className="w-full px-4 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900 placeholder-gray-400 resize-none"
          />
        </div>

        {/* 한 줄 다짐 */}
        <div className="mb-8">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            한 줄 다짐
          </label>
          <textarea
            value={reflection}
            onChange={(e) => setReflection(e.target.value)}
            placeholder="오늘은 어떤 하루를 보내고 싶으신가요?"
            rows={2}
            className="w-full px-4 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900 placeholder-gray-400 resize-none"
          />
        </div>

        {/* 버튼 */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!isValid || submitting}
            className="flex-1 py-4 px-4 rounded-xl bg-orange-500 text-white font-medium hover:bg-orange-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {submitting ? "저장 중..." : "오늘의 리추얼 성공"}
          </button>
        </div>
      </div>
    </div>
  );
}
