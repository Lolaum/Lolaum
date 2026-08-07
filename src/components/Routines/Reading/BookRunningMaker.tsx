"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Download, ImagePlus, X } from "lucide-react";

type TemplateId = "classic" | "hud" | "editorial" | "minimal";

interface BookRunningMakerProps {
  open: boolean;
  onClose: () => void;
  pages: number;
  bookTitle: string;
  date: string;
}

const WIDTH = 1080;
const HEIGHT = 1350;
const templates: { id: TemplateId; name: string; description: string }[] = [
  { id: "classic", name: "클래식", description: "사진 위에 큼직하게" },
  { id: "hud", name: "러닝 HUD", description: "하단 기록 패널" },
  { id: "editorial", name: "에디토리얼", description: "잡지 같은 레이아웃" },
  { id: "minimal", name: "미니멀", description: "깔끔한 카드 스타일" },
];

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new window.Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

function coverImage(
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight);
  const sourceWidth = width / scale;
  const sourceHeight = height / scale;
  const sourceX = (image.naturalWidth - sourceWidth) / 2;
  const sourceY = (image.naturalHeight - sourceHeight) / 2;
  context.drawImage(
    image,
    sourceX,
    sourceY,
    sourceWidth,
    sourceHeight,
    x,
    y,
    width,
    height,
  );
}

function formatTime(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours ? `${hours}h` : "", minutes ? `${minutes}m` : "", `${seconds}s`]
    .filter(Boolean)
    .join(" ");
}

function formatPace(totalSeconds: number, pages: number) {
  const secondsPerPage = Math.round(totalSeconds / Math.max(1, pages));
  const minutes = Math.floor(secondsPerPage / 60);
  const seconds = secondsPerPage % 60;
  return `${minutes ? `${minutes}m ` : ""}${seconds}s`;
}

function roundedRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  context.beginPath();
  context.roundRect(x, y, width, height, radius);
}

export default function BookRunningMaker({
  open,
  onClose,
  pages,
  bookTitle,
  date,
}: BookRunningMakerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [template, setTemplate] = useState<TemplateId>("classic");
  const [isDragging, setIsDragging] = useState(false);
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(30);
  const [seconds, setSeconds] = useState(0);

  const totalSeconds = hours * 3600 + minutes * 60 + seconds;
  const timeLabel = useMemo(() => formatTime(totalSeconds), [totalSeconds]);
  const paceLabel = useMemo(
    () => formatPace(totalSeconds, pages),
    [totalSeconds, pages],
  );

  useEffect(() => {
    return () => {
      if (photoUrl) URL.revokeObjectURL(photoUrl);
    };
  }, [photoUrl]);

  useEffect(() => {
    if (!open || !photoUrl || !canvasRef.current || totalSeconds <= 0) return;
    let cancelled = false;

    const draw = async () => {
      const [photo, logo] = await Promise.all([
        loadImage(photoUrl),
        loadImage("/images/common/LolaumLogo.png"),
      ]);
      await document.fonts.load("700 72px BookRunningPretendard");
      if (cancelled || !canvasRef.current) return;

      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");
      if (!context) return;
      const certificationDate = date.replaceAll("-", ".");
      canvas.width = WIDTH;
      canvas.height = HEIGHT;
      context.clearRect(0, 0, WIDTH, HEIGHT);
      coverImage(context, photo, 0, 0, WIDTH, HEIGHT);
      context.textBaseline = "alphabetic";

      const logoWidth = 190;
      const logoHeight = (logo.naturalHeight / logo.naturalWidth) * logoWidth;
      const drawLogo = (light = true) => {
        context.save();
        if (light) {
          context.filter = "brightness(0) invert(1)";
          context.globalAlpha = 0.95;
        }
        context.drawImage(logo, (WIDTH - logoWidth) / 2, 1262, logoWidth, logoHeight);
        context.restore();
      };

      if (template === "classic") {
        context.save();
        context.shadowColor = "rgba(0,0,0,.55)";
        context.shadowBlur = 22;
        context.shadowOffsetY = 4;
        context.fillStyle = "#fff";
        context.font = "700 28px BookRunningPretendard";
        context.fillText("BOOK RUNNING", 70, 88);
        context.textAlign = "right";
        context.fillText(certificationDate, WIDTH - 70, 88);
        context.textAlign = "start";
        context.font = "700 42px BookRunningPretendard";
        context.fillText(bookTitle.slice(0, 24), 70, 148);

        context.font = "700 30px BookRunningPretendard";
        context.fillText("PAGES", 70, 930);
        context.font = "700 138px BookRunningPretendard";
        context.fillText(String(pages), 64, 1055);

        context.font = "700 27px BookRunningPretendard";
        context.fillText("TIME", 430, 944);
        context.font = "700 58px BookRunningPretendard";
        context.fillText(timeLabel, 426, 1012);

        context.font = "700 27px BookRunningPretendard";
        context.fillText("PACE / PAGE", 430, 1082);
        context.font = "700 58px BookRunningPretendard";
        context.fillText(paceLabel, 426, 1150);
        context.restore();
        drawLogo();
      }

      if (template === "hud") {
        const gradient = context.createLinearGradient(0, 650, 0, HEIGHT);
        gradient.addColorStop(0, "rgba(6,12,10,0)");
        gradient.addColorStop(1, "rgba(6,12,10,.92)");
        context.fillStyle = gradient;
        context.fillRect(0, 500, WIDTH, 850);
        context.fillStyle = "#f3c75c";
        context.font = "700 34px BookRunningPretendard";
        context.strokeStyle = "rgba(10,14,12,.78)";
        context.lineWidth = 3;
        context.lineJoin = "round";
        context.strokeText("BOOK RUNNING", 64, 82);
        context.fillText("BOOK RUNNING", 64, 82);
        context.textAlign = "right";
        context.strokeText(certificationDate, WIDTH - 64, 82);
        context.fillText(certificationDate, WIDTH - 64, 82);
        context.textAlign = "start";
        context.fillStyle = "#fff";
        context.font = "700 52px BookRunningPretendard";
        context.fillText(bookTitle.slice(0, 22), 64, 1060);
        context.strokeStyle = "rgba(255,255,255,.25)";
        context.beginPath();
        context.moveTo(64, 1092);
        context.lineTo(1016, 1092);
        context.stroke();
        const items = [
          ["PAGES", String(pages)],
          ["TIME", timeLabel],
          ["PACE", paceLabel],
        ];
        items.forEach(([label, value], index) => {
          const x = 64 + index * 330;
          context.fillStyle = "#aab5af";
          context.font = "700 25px BookRunningPretendard";
          context.fillText(label, x, 1144);
          context.fillStyle = index === 0 ? "#f3c75c" : "#fff";
          context.font = "700 48px BookRunningPretendard";
          context.fillText(value, x, 1205);
        });
        drawLogo();
      }

      if (template === "editorial") {
        const sideWidth = WIDTH * 0.4;
        const sideCenter = sideWidth / 2;
        context.fillStyle = "rgba(249,244,232,.94)";
        context.fillRect(0, 0, sideWidth, HEIGHT);
        context.fillStyle = "#171713";
        context.font = "700 30px BookRunningPretendard";
        context.textAlign = "center";
        context.fillText("BOOK RUNNING", sideCenter, 90);
        context.fillStyle = "#8a8175";
        context.font = "700 22px BookRunningPretendard";
        context.fillText(certificationDate, sideCenter, 126);
        context.fillStyle = "#171713";
        context.font = "700 96px BookRunningPretendard";
        context.fillText(String(pages), sideCenter, 250);
        context.font = "700 30px BookRunningPretendard";
        context.fillText("PAGES", sideCenter, 292);
        context.font = "700 54px BookRunningPretendard";
        context.fillText(timeLabel, sideCenter, 438);
        context.font = "700 25px BookRunningPretendard";
        context.fillText("TIME", sideCenter, 478);
        context.font = "700 54px BookRunningPretendard";
        context.fillText(paceLabel, sideCenter, 622);
        context.font = "700 25px BookRunningPretendard";
        context.fillText("PACE / PAGE", sideCenter, 662);
        context.fillStyle = "#8a8175";
        context.font = "700 22px BookRunningPretendard";
        context.fillText("BOOK", sideCenter, 760);
        context.fillStyle = "#171713";
        context.font = "700 34px BookRunningPretendard";
        const editorialTitle = bookTitle.trim();
        const firstTitleLine = editorialTitle.slice(0, 11);
        const secondTitleLine = editorialTitle.slice(11, 22);
        context.fillText(firstTitleLine, sideCenter, 812);
        if (secondTitleLine) {
          context.fillText(
            `${secondTitleLine}${editorialTitle.length > 22 ? "…" : ""}`,
            sideCenter,
            858,
          );
        }
        context.textAlign = "start";
        context.save();
        context.globalAlpha = 0.78;
        context.drawImage(
          logo,
          sideCenter - 79,
          1248,
          158,
          (logo.naturalHeight / logo.naturalWidth) * 158,
        );
        context.restore();
      }

      if (template === "minimal") {
        context.fillStyle = "rgba(0,0,0,.12)";
        context.fillRect(0, 0, WIDTH, HEIGHT);
        context.fillStyle = "rgba(255,255,255,.93)";
        roundedRect(context, 70, 820, 940, 424, 34);
        context.fill();
        context.fillStyle = "#171717";
        context.font = "700 27px BookRunningPretendard";
        context.fillText(certificationDate, 112, 880);
        context.font = "700 44px BookRunningPretendard";
        context.fillText(bookTitle.slice(0, 24), 112, 950);
        const items = [
          ["pages", String(pages)],
          ["time", timeLabel],
          ["pace", paceLabel],
        ];
        items.forEach(([label, value], index) => {
          const x = 112 + index * 300;
          context.fillStyle = "#9a9a94";
          context.font = "700 24px BookRunningPretendard";
          context.fillText(label, x, 1038);
          context.fillStyle = "#171717";
          context.font = "700 48px BookRunningPretendard";
          context.fillText(value, x, 1100);
        });
        context.drawImage(logo, 112, 1162, 160, (logo.naturalHeight / logo.naturalWidth) * 160);
      }
    };

    draw().catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [
    bookTitle,
    date,
    open,
    pages,
    paceLabel,
    photoUrl,
    template,
    timeLabel,
    totalSeconds,
  ]);

  if (!open) return null;

  const handlePhoto = (file?: File) => {
    if (!file || !file.type.startsWith("image/")) return;
    setPhotoUrl((current) => {
      if (current) URL.revokeObjectURL(current);
      return URL.createObjectURL(file);
    });
  };

  const handleDragOver = (event: React.DragEvent<HTMLElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
    setIsDragging(true);
  };

  const handleDragLeave = (event: React.DragEvent<HTMLElement>) => {
    event.preventDefault();
    if (event.currentTarget.contains(event.relatedTarget as Node)) return;
    setIsDragging(false);
  };

  const handleDrop = (event: React.DragEvent<HTMLElement>) => {
    event.preventDefault();
    setIsDragging(false);
    handlePhoto(
      Array.from(event.dataTransfer.files).find((file) =>
        file.type.startsWith("image/"),
      ),
    );
  };

  const download = async () => {
    if (!canvasRef.current || !photoUrl || totalSeconds <= 0) return;
    const blob = await new Promise<Blob | null>((resolve) => {
      canvasRef.current?.toBlob(resolve, "image/png", 1);
    });
    if (!blob) return;

    const fileName = `lolaum-book-running-${date}.png`;
    const file = new File([blob], fileName, { type: "image/png" });
    const isIOS = /iPad|iPhone|iPod/i.test(navigator.userAgent);
    if (
      isIOS &&
      navigator.share &&
      navigator.canShare?.({ files: [file] })
    ) {
      try {
        await navigator.share({
          files: [file],
          title: "롤라움 북러닝 인증사진",
        });
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
      }
    }

    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.download = fileName;
    anchor.href = objectUrl;
    anchor.style.display = "none";
    document.body.appendChild(anchor);
    anchor.click();
    window.setTimeout(() => {
      anchor.remove();
      URL.revokeObjectURL(objectUrl);
    }, 3000);
  };

  return (
    <div className="fixed inset-0 z-[70] overflow-y-auto bg-black/60 p-4 backdrop-blur-sm">
      <style>{`@font-face{font-family:BookRunningPretendard;src:url('/fonts/Pretendard-Bold.woff2') format('woff2');font-weight:700;font-display:swap;}`}</style>
      <div className="mx-auto my-4 w-full max-w-4xl overflow-hidden rounded-3xl bg-[#f7f5f0] shadow-2xl">
        <div className="flex items-center justify-between border-b border-black/5 px-5 py-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange-500">Book Running</p>
            <h2 className="mt-1 text-lg font-bold text-gray-900">북러닝 인증사진 만들기</h2>
          </div>
          <button type="button" onClick={onClose} className="rounded-full p-2 text-gray-500 hover:bg-black/5" aria-label="닫기">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid gap-6 p-5 md:grid-cols-[minmax(0,1fr)_320px]">
          <div
            className={`relative mx-auto w-full max-w-[460px] rounded-2xl transition ${
              isDragging ? "ring-4 ring-orange-400 ring-offset-4" : ""
            }`}
            onDragEnter={handleDragOver}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {photoUrl ? (
              <>
                <canvas ref={canvasRef} className="aspect-[4/5] w-full rounded-2xl bg-gray-200 object-cover shadow-lg" />
                {isDragging && (
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-2xl bg-black/55 text-center text-white backdrop-blur-sm">
                    <div>
                      <ImagePlus className="mx-auto mb-3 h-10 w-10" />
                      <p className="font-bold">여기에 놓아 사진 교체</p>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <button type="button" onClick={() => fileInputRef.current?.click()} className="flex aspect-[4/5] w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 bg-white text-gray-500 transition hover:border-orange-400 hover:text-orange-500">
                <ImagePlus className="mb-3 h-9 w-9" />
                <span className="font-bold">
                  {isDragging ? "여기에 사진을 놓아주세요" : "인증 사진 업로드"}
                </span>
                <span className="mt-1 text-xs text-gray-400">
                  클릭 또는 드래그앤드롭 · 세로 사진 권장
                </span>
              </button>
            )}
          </div>

          <div className="space-y-5">
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(event) => { handlePhoto(event.target.files?.[0]); event.target.value = ""; }} />
            {photoUrl && (
              <button type="button" onClick={() => fileInputRef.current?.click()} className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50">
                <ImagePlus className="h-4 w-4" /> 사진 바꾸기
              </button>
            )}

            <div>
              <p className="mb-2 text-sm font-bold text-gray-800">읽은 시간</p>
              <div className="grid grid-cols-3 gap-2">
                {[
                  ["시간", hours, setHours, 23],
                  ["분", minutes, setMinutes, 59],
                  ["초", seconds, setSeconds, 59],
                ].map(([label, value, setter, max]) => (
                  <label key={label as string} className="rounded-xl border border-gray-200 bg-white p-2 text-center">
                    <input type="number" min={0} max={max as number} value={value as number} onChange={(event) => (setter as (value: number) => void)(Math.min(max as number, Math.max(0, Number(event.target.value))))} className="w-full bg-transparent text-center text-lg font-bold text-gray-900 outline-none" />
                    <span className="text-[11px] text-gray-400">{label as string}</span>
                  </label>
                ))}
              </div>
              <p className="mt-2 text-xs text-gray-500">{pages} pages · {totalSeconds > 0 ? `${paceLabel} / page` : "시간을 입력해주세요"}</p>
            </div>

            <div>
              <p className="mb-2 text-sm font-bold text-gray-800">디자인 선택</p>
              <div className="grid grid-cols-2 gap-2">
                {templates.map((item) => (
                  <button key={item.id} type="button" onClick={() => setTemplate(item.id)} className={`rounded-xl border p-3 text-left transition ${template === item.id ? "border-orange-500 bg-orange-50 ring-1 ring-orange-500" : "border-gray-200 bg-white hover:border-gray-300"}`}>
                    <span className="block text-sm font-bold text-gray-900">{item.name}</span>
                    <span className="mt-0.5 block text-[11px] text-gray-400">{item.description}</span>
                  </button>
                ))}
              </div>
            </div>

            <button type="button" onClick={() => void download()} disabled={!photoUrl || totalSeconds <= 0} className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-gray-300">
              <Download className="h-4 w-4" /> PNG로 다운로드
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
