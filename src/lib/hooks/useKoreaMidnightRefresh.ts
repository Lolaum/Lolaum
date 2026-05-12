"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { formatKoreaDateKey, KOREA_TIME_ZONE } from "@/lib/korea-date";

function getKoreaDateParts(date: Date) {
  const parts = new Intl.DateTimeFormat("en", {
    timeZone: KOREA_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const value = (type: string) =>
    Number(parts.find((part) => part.type === type)?.value ?? 0);
  return {
    year: value("year"),
    month: value("month"),
    day: value("day"),
  };
}

function getNextKoreaMidnightDelay(now = new Date()): number {
  const { year, month, day } = getKoreaDateParts(now);
  const nextMidnight = Date.UTC(year, month - 1, day + 1, -9, 0, 2);
  return Math.max(1000, nextMidnight - now.getTime());
}

export function useKoreaMidnightRefresh(onDateChange?: () => void) {
  const router = useRouter();
  const lastDateRef = useRef(formatKoreaDateKey());

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const refresh = () => {
      lastDateRef.current = formatKoreaDateKey();
      onDateChange?.();
      router.refresh();
    };

    const refreshIfDateChanged = () => {
      const currentDate = formatKoreaDateKey();
      if (currentDate === lastDateRef.current) return;
      lastDateRef.current = currentDate;
      onDateChange?.();
      router.refresh();
    };

    const schedule = () => {
      timeoutId = setTimeout(() => {
        refresh();
        schedule();
      }, getNextKoreaMidnightDelay());
    };

    schedule();

    window.addEventListener("focus", refreshIfDateChanged);
    document.addEventListener("visibilitychange", refreshIfDateChanged);

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      window.removeEventListener("focus", refreshIfDateChanged);
      document.removeEventListener("visibilitychange", refreshIfDateChanged);
    };
  }, [onDateChange, router]);
}
