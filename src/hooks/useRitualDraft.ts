"use client";

import { useCallback, useState } from "react";

const DRAFT_PREFIX = "lolaum:ritual-draft";

export function useRitualDraft<T>(draftKey: string) {
  const storageKey = `${DRAFT_PREFIX}:${draftKey}`;
  const [hasDraft, setHasDraft] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(storageKey) !== null;
  });

  const saveDraft = useCallback(
    (draft: T) => {
      if (typeof window === "undefined") return;
      window.localStorage.setItem(storageKey, JSON.stringify(draft));
      setHasDraft(true);
    },
    [storageKey],
  );

  const loadDraft = useCallback((): T | null => {
    if (typeof window === "undefined") return null;
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return null;

    try {
      return JSON.parse(raw) as T;
    } catch {
      window.localStorage.removeItem(storageKey);
      setHasDraft(false);
      return null;
    }
  }, [storageKey]);

  const clearDraft = useCallback(() => {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(storageKey);
    setHasDraft(false);
  }, [storageKey]);

  return { hasDraft, saveDraft, loadDraft, clearDraft };
}
