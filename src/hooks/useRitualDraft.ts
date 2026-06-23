"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  deleteRitualDraft,
  getRitualDraft,
  saveRitualDraft,
} from "@/api/ritual-draft";
import type { Json } from "@/types/supabase";

function toJson<T>(draft: T): Json {
  return JSON.parse(JSON.stringify(draft)) as Json;
}

export function useRitualDraft<T>(draftKey: string) {
  const [hasDraft, setHasDraft] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const saveChainRef = useRef(Promise.resolve());
  const activeSaveIdRef = useRef(0);

  const loadDraft = useCallback(async (): Promise<T | null> => {
    setLoading(true);
    try {
      const result = await getRitualDraft({ draftKey });
      if (result.error) {
        console.error(result.error);
        setHasDraft(false);
        return null;
      }

      setHasDraft(result.data !== null);
      return (result.data?.draft_data as T | undefined) ?? null;
    } finally {
      setLoading(false);
    }
  }, [draftKey]);

  useEffect(() => {
    let cancelled = false;

    async function checkDraft() {
      setLoading(true);
      try {
        const result = await getRitualDraft({ draftKey });
        if (cancelled) return;

        if (result.error) {
          console.error(result.error);
          setHasDraft(false);
          return;
        }

        setHasDraft(result.data !== null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    checkDraft();

    return () => {
      cancelled = true;
    };
  }, [draftKey]);

  const saveDraft = useCallback(
    (draft: T): Promise<{ error?: string }> => {
      const saveId = activeSaveIdRef.current + 1;
      activeSaveIdRef.current = saveId;

      const saveJob = saveChainRef.current
        .catch(() => undefined)
        .then(async () => {
          setSaving(true);
          try {
            const result = await saveRitualDraft({
              draftKey,
              draftData: toJson(draft),
            });

            if (result.error) {
              console.error(result.error);
              return { error: result.error };
            }

            setHasDraft(true);
            return {};
          } finally {
            if (activeSaveIdRef.current === saveId) {
              setSaving(false);
            }
          }
        });

      saveChainRef.current = saveJob.then(() => undefined, () => undefined);
      return saveJob;
    },
    [draftKey],
  );

  const clearDraft = useCallback(async (): Promise<{ error?: string }> => {
    setSaving(true);
    try {
      const result = await deleteRitualDraft({ draftKey });
      if (result.error) {
        console.error(result.error);
        return { error: result.error };
      }

      setHasDraft(false);
      return {};
    } finally {
      setSaving(false);
    }
  }, [draftKey]);

  return { hasDraft, loading, saving, saveDraft, loadDraft, clearDraft };
}
