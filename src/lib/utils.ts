import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

const IMAGE_MIME_BY_EXTENSION: Record<string, string> = {
  avif: "image/avif",
  bmp: "image/bmp",
  gif: "image/gif",
  heic: "image/heic",
  heif: "image/heif",
  jpeg: "image/jpeg",
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

function getImageMimeTypeFromName(fileName: string): string | null {
  const extension = fileName.split(".").pop()?.toLowerCase();
  return extension ? (IMAGE_MIME_BY_EXTENSION[extension] ?? null) : null;
}

function getImageMimeTypeFromBytes(bytes: Uint8Array): string | null {
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "image/jpeg";
  }
  if (
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return "image/png";
  }

  const ascii = String.fromCharCode(...bytes);
  if (ascii.startsWith("GIF87a") || ascii.startsWith("GIF89a")) {
    return "image/gif";
  }
  if (ascii.startsWith("RIFF") && ascii.slice(8, 12) === "WEBP") {
    return "image/webp";
  }
  if (ascii.startsWith("BM")) return "image/bmp";

  if (ascii.slice(4, 8) === "ftyp") {
    const brand = ascii.slice(8, 12);
    if (brand === "avif" || brand === "avis") return "image/avif";
    if (
      [
        "heic",
        "heix",
        "hevc",
        "hevx",
        "heim",
        "heis",
        "mif1",
        "msf1",
      ].includes(brand)
    ) {
      return "image/heic";
    }
  }

  return null;
}

/**
 * Android 인앱 WebView가 MIME 타입을 비워 전달하는 경우 파일명과 시그니처로
 * 이미지 타입을 복원한다. 이미지가 아니면 null을 반환한다.
 */
export async function normalizeImageFile(file: File): Promise<File | null> {
  const declaredMimeType = file.type.trim().toLowerCase();
  let imageMimeType = declaredMimeType.startsWith("image/")
    ? declaredMimeType
    : getImageMimeTypeFromName(file.name);

  if (!imageMimeType) {
    try {
      const bytes = new Uint8Array(await file.slice(0, 16).arrayBuffer());
      imageMimeType = getImageMimeTypeFromBytes(bytes);
    } catch {
      return null;
    }
  }

  if (!imageMimeType) return null;
  if (declaredMimeType === imageMimeType) return file;

  return new File([file], file.name || "image", {
    type: imageMimeType,
    lastModified: file.lastModified,
  });
}

export async function normalizeImageFiles(
  files: FileList | readonly File[] | null,
): Promise<File[]> {
  if (!files) return [];
  const normalized = await Promise.all(
    Array.from(files).map(normalizeImageFile),
  );
  return normalized.filter((file): file is File => file !== null);
}

/**
 * Tailwind CSS 클래스를 병합하는 유틸리티 함수
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** File → 긴 변 maxSize, JPEG quality로 리사이즈한 File 반환. 책 표지처럼 큰 해상도가 불필요한 이미지용. */
export async function resizeImageFile(
  file: File,
  maxSize = 800,
  quality = 0.85,
): Promise<File> {
  const normalizedFile = await normalizeImageFile(file);
  if (!normalizedFile) return file;

  const url = URL.createObjectURL(normalizedFile);
  try {
    const bitmap = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("이미지 로드 실패"));
      img.src = url;
    });

    let w = bitmap.naturalWidth;
    let h = bitmap.naturalHeight;
    if (w > maxSize || h > maxSize) {
      const ratio = Math.min(maxSize / w, maxSize / h);
      w = Math.round(w * ratio);
      h = Math.round(h * ratio);
    }

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return normalizedFile;
    ctx.drawImage(bitmap, 0, 0, w, h);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", quality),
    );
    if (!blob) return normalizedFile;

    return new File([blob], normalizedFile.name.replace(/\.[^.]+$/, ".jpg"), {
      type: "image/jpeg",
      lastModified: Date.now(),
    });
  } finally {
    URL.revokeObjectURL(url);
  }
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

export const CERT_PHOTO_MIN_INTERVAL_MINUTES = 10;
export const CERT_PHOTO_INTERVAL_MESSAGE =
  "시작 사진과 종료 사진의 촬영 시간이 10분 이상 차이 나는 사진으로 다시 업로드해 주십시오.";

/** 사진 파일의 EXIF 촬영 시각을 읽고, 없으면 파일 수정 시각을 사용한다. */
export async function getPhotoTakenAt(file: File): Promise<Date> {
  const exifr = (await import("exifr")).default;

  try {
    const exif = await exifr.parse(file, [
      "DateTimeOriginal",
      "CreateDate",
      "ModifyDate",
    ]);
    const exifDate =
      exif?.DateTimeOriginal ?? exif?.CreateDate ?? exif?.ModifyDate;
    if (exifDate instanceof Date && !Number.isNaN(exifDate.getTime())) {
      return exifDate;
    }
  } catch {
    // EXIF를 읽을 수 없는 캡처/압축 이미지도 파일 메타데이터로 검증을 이어간다.
  }

  return new Date(file.lastModified || Date.now());
}

export function hasMinimumPhotoInterval(
  takenAtTimes: number[],
  minMinutes = CERT_PHOTO_MIN_INTERVAL_MINUTES,
): boolean {
  if (takenAtTimes.length < 2) return true;

  const sorted = [...takenAtTimes].sort((a, b) => a - b);
  return sorted[sorted.length - 1] - sorted[0] >= minMinutes * 60 * 1000;
}

/** File → EXIF 날짜/시간을 중앙에 찍은 base64 이미지 반환 (최대 1920px 리사이즈) */
export async function applyTimestamp(
  file: File,
  takenAt?: Date,
): Promise<string> {
  const MAX_SIZE = 1280;
  const photoDate = takenAt ?? (await getPhotoTakenAt(file));

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
      resolve(canvas.toDataURL("image/jpeg", 0.75));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("이미지 로드 실패"));
    };
    img.src = url;
  });
}
