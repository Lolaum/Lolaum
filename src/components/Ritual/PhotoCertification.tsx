"use client";

import { useRef, useState } from "react";
import { Camera, X } from "lucide-react";
import { applyTimestamp } from "@/lib/utils";

interface PhotoCertificationProps {
  mode: "start" | "end";
  taskTitle: string;
  color: string;
  elapsedSeconds?: number;
  onPhotoTaken: (photoDataUrl: string) => void;
  onClose: () => void;
}

export default function PhotoCertification({
  mode,
  taskTitle,
  color,
  elapsedSeconds = 0,
  onPhotoTaken,
  onClose,
}: PhotoCertificationProps) {
  const [originalPhoto, setOriginalPhoto] = useState<string | null>(null);
  const [timestampedPhoto, setTimestampedPhoto] = useState<string | null>(null);
  const [removeTimestamp, setRemoveTimestamp] = useState(false);
  const [processing, setProcessing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const photo = removeTimestamp ? originalPhoto : timestampedPhoto;

  const totalMinutes = Math.floor(elapsedSeconds / 60);
  const totalSecs = elapsedSeconds % 60;
  const isStart = mode === "start";

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setProcessing(true);
    const [tsUrl, origUrl] = await Promise.all([
      applyTimestamp(file),
      new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      }),
    ]);
    setTimestampedPhoto(tsUrl);
    setOriginalPhoto(origUrl);
    setProcessing(false);
    e.target.value = "";
  };

  const handleReset = () => {
    setOriginalPhoto(null);
    setTimestampedPhoto(null);
    setRemoveTimestamp(false);
  };

  const handleConfirm = () => {
    if (photo) onPhotoTaken(photo);
  };

  return (
    <div className="max-w-sm mx-auto px-4 py-6">
      {/* 닫기 버튼 */}
      <div className="flex justify-end mb-4">
        <button
          type="button"
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* 헤더 */}
      <div className="text-center mb-6">
        <span
          className="inline-block px-4 py-1.5 rounded-full text-sm font-semibold text-white shadow-sm"
          style={{ backgroundColor: color }}
        >
          {taskTitle}
        </span>
        <h2 className="text-xl font-bold text-gray-900 mt-3">
          {isStart ? "시작 인증" : "종료 인증"}
        </h2>
        {!isStart && elapsedSeconds > 0 && (
          <p className="text-base font-semibold mt-1" style={{ color }}>
            총 {totalMinutes}분 {totalSecs}초 달성! 수고하셨어요
          </p>
        )}
        <p className="text-sm text-gray-400 mt-1">
          {isStart
            ? "사진을 찍어야 타이머를 시작할 수 있어요"
            : "종료 사진을 찍고 기록을 저장하세요"}
        </p>
      </div>

      {/* 사진 촬영 영역 */}
      {!photo ? (
        <label
          className="flex flex-col items-center justify-center w-full h-56 border-2 border-dashed rounded-2xl cursor-pointer transition-colors bg-gray-50 hover:bg-gray-100"
          style={{ borderColor: color + "80" }}
        >
          <Camera className="w-12 h-12 mb-3" style={{ color }} />
          <p className="text-sm font-medium text-gray-600">사진 찍기</p>
          <p className="text-xs text-gray-400 mt-1">카메라 또는 갤러리에서 선택</p>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
        </label>
      ) : (
        <>
          <div className="relative rounded-2xl overflow-hidden">
            <img
              src={photo!}
              alt="인증 사진"
              className="w-full object-cover rounded-2xl max-h-64"
            />
            <button
              type="button"
              onClick={handleReset}
              className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center bg-black bg-opacity-50 rounded-full text-white hover:bg-opacity-70"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 rounded-lg px-2 py-1">
              <p className="text-xs text-white">재촬영하려면 X를 누르세요</p>
            </div>
          </div>
          <label className="flex items-center gap-2 mt-3 cursor-pointer select-none w-fit">
            <input
              type="checkbox"
              checked={removeTimestamp}
              onChange={(e) => setRemoveTimestamp(e.target.checked)}
              className="w-4 h-4 rounded accent-gray-600 cursor-pointer"
            />
            <span className="text-sm text-gray-500">타임스탬프 삭제하기</span>
          </label>
        </>
      )}

      {processing && (
        <p className="text-center text-sm text-gray-400 mt-3">타임스탬프 적용 중...</p>
      )}

      {/* CTA 버튼 */}
      <button
        type="button"
        onClick={handleConfirm}
        disabled={!photo || processing}
        className="w-full mt-6 py-4 rounded-2xl text-base font-bold text-white shadow-md transition-all hover:shadow-lg active:scale-95 disabled:bg-gray-200 disabled:text-gray-400 disabled:shadow-none disabled:cursor-not-allowed"
        style={photo && !processing ? { backgroundColor: color } : {}}
      >
        {isStart ? "타이머 시작하기" : "기록 추가하기"}
      </button>
    </div>
  );
}
