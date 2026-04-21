import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Tailwind CSS 클래스를 병합하는 유틸리티 함수
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** File → base64 data URL 변환 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/** File → EXIF 날짜/시간을 중앙에 찍은 base64 이미지 반환 (최대 1920px 리사이즈) */
export async function applyTimestamp(file: File): Promise<string> {
  const MAX_SIZE = 1920;
  const exifr = (await import("exifr")).default;

  let photoDate: Date;
  try {
    const exif = await exifr.parse(file, [
      "DateTimeOriginal",
      "CreateDate",
      "ModifyDate",
    ]);
    const exifDate =
      exif?.DateTimeOriginal ?? exif?.CreateDate ?? exif?.ModifyDate;
    photoDate =
      exifDate instanceof Date
        ? exifDate
        : new Date(file.lastModified || Date.now());
  } catch {
    photoDate = new Date(file.lastModified || Date.now());
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      // 긴 변 기준 MAX_SIZE로 리사이즈
      let w = img.naturalWidth;
      let h = img.naturalHeight;
      if (w > MAX_SIZE || h > MAX_SIZE) {
        const ratio = Math.min(MAX_SIZE / w, MAX_SIZE / h);
        w = Math.round(w * ratio);
        h = Math.round(h * ratio);
      }

      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;

      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, w, h);

      const pad = (n: number) => String(n).padStart(2, "0");
      const dateStr = `${photoDate.getFullYear()}. ${pad(photoDate.getMonth() + 1)}. ${pad(photoDate.getDate())}`;
      const timeStr = `${pad(photoDate.getHours())}:${pad(photoDate.getMinutes())}:${pad(photoDate.getSeconds())}`;
      const text = `${dateStr}  ${timeStr}`;

      const fontSize = Math.max(28, Math.round(w * 0.06));
      ctx.font = `bold ${fontSize}px Arial, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      ctx.strokeStyle = "rgba(0, 0, 0, 0.8)";
      ctx.lineWidth = fontSize * 0.15;
      ctx.lineJoin = "round";
      ctx.strokeText(text, w / 2, h / 2);

      ctx.fillStyle = "white";
      ctx.fillText(text, w / 2, h / 2);

      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", 0.85));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("이미지 로드 실패"));
    };
    img.src = url;
  });
}
