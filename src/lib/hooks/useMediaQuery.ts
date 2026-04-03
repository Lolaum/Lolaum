"use client";

import { useSyncExternalStore } from "react";

/**
 * 미디어 쿼리 상태를 추적하는 커스텀 훅
 * @param query - 미디어 쿼리 문자열 (예: "(min-width: 768px)")
 */
export function useMediaQuery(query: string): boolean {
  const getSnapshot = () =>
    typeof window !== "undefined" ? window.matchMedia(query).matches : false;

  const subscribe = (notify: () => void) => {
    if (typeof window === "undefined") {
      return () => undefined;
    }

    const media = window.matchMedia(query);
    const handler = () => notify();
    media.addEventListener("change", handler);

    return () => media.removeEventListener("change", handler);
  };

  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}
