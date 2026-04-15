"use client";

import { useRef, useState } from "react";
import { Camera, X } from "lucide-react";

interface PhotoCertificationProps {
  mode: "start" | "end";
  taskTitle: string;
  color: string;
  elapsedSeconds?: number;
  onPhotoTaken: (photoDataUrl: string) => void;
  onClose: () => void;
}

const MAX_IMAGE_SIZE = 1200;

function resizeCanvas(img: HTMLImageElement): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  let { naturalWidth: w, naturalHeight: h } = img;
  if (w > MAX_IMAGE_SIZE || h > MAX_IMAGE_SIZE) {
    const ratio = Math.min(MAX_IMAGE_SIZE / w, MAX_IMAGE_SIZE / h);
    w = Math.round(w * ratio);
    h = Math.round(h * ratio);
  }
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0, w, h);
  return canvas;
}

function applyTimestamp(file: File): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = resizeCanvas(img);
      const ctx = canvas.getContext("2d")!;

      const now = new Date();
      const pad = (n: number) => String(n).padStart(2, "0");
      const dateStr = `${now.getFullYear()}. ${pad(now.getMonth() + 1)}. ${pad(now.getDate())}`;
      const timeStr = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
      const text = `${dateStr}  ${timeStr}`;

      const fontSize = Math.max(24, Math.round(canvas.width * 0.07));
      ctx.font = `bold ${fontSize}px Arial, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      ctx.strokeStyle = "rgba(0, 0, 0, 0.8)";
      ctx.lineWidth = fontSize * 0.15;
      ctx.lineJoin = "round";
      ctx.strokeText(text, canvas.width / 2, canvas.height / 2);

      ctx.fillStyle = "white";
      ctx.fillText(text, canvas.width / 2, canvas.height / 2);

      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", 0.8));
    };
    img.src = url;
  });
}

function resizeImage(file: File): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = resizeCanvas(img);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", 0.8));
    };
    img.src = url;
  });
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
      resizeImage(file),
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
