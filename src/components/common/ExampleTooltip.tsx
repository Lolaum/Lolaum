"use client";

import { useEffect, useRef, useState } from "react";
import { Info } from "lucide-react";

interface Props {
  content: string;
  /** 툴팁 패널의 추가 클래스. 기본은 라벨 우측 정렬 */
  panelClassName?: string;
}

/**
 * 라벨 옆 (i) 아이콘. 클릭/탭하면 예시 텍스트가 토글되어 펼쳐진다.
 * 외부 클릭/터치 시 자동으로 닫힘.
 */
export default function ExampleTooltip({ content, panelClassName }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent | TouchEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("touchstart", handler);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("touchstart", handler);
    };
  }, [open]);

  return (
    <div className="relative inline-block align-middle" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        onTouchEnd={(e) => {
          // 모바일에서 터치 → click 합성 이벤트 사이의 지연/중복 방지
          e.preventDefault();
          setOpen((v) => !v);
        }}
        aria-expanded={open}
        aria-label="예시 보기"
        className="inline-flex items-center justify-center w-5 h-5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors touch-manipulation"
      >
        <Info className="w-3.5 h-3.5" />
      </button>
      {open && (
        <div
          role="tooltip"
          className={`absolute z-30 mt-2 w-60 max-w-[calc(100vw-2rem)] rounded-xl border border-gray-200 bg-white shadow-lg p-3 text-xs text-gray-700 leading-relaxed whitespace-pre-line left-0 ${
            panelClassName ?? ""
          }`}
        >
          {content}
        </div>
      )}
    </div>
  );
}
