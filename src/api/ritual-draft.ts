"use server";

import { revalidatePath } from "next/cache";
import { createClient, getCurrentUser } from "@/lib/supabase/server";
import type { Json, RitualDraft } from "@/types/supabase";

const DRAFT_HOME_PATHS = [
  "/home/morning/new",
  "/home/exercise/new",
  "/home/english/new",
  "/home/second-language/new",
  "/home/finance/new",
  "/home/recording/new",
  "/home/reading",
  "/home/english-book",
];

function revalidateDraftSurfaces() {
  for (const path of DRAFT_HOME_PATHS) {
    revalidatePath(path);
  }
}

export async function getRitualDraft(input: {
  draftKey: string;
}): Promise<{ data?: RitualDraft | null; error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { error: "인증이 필요합니다." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ritual_drafts")
    .select("*")
    .eq("user_id", user.id)
    .eq("draft_key", input.draftKey)
    .maybeSingle();

  if (error) return { error: error.message };
  return { data: data ?? null };
}

export async function saveRitualDraft(input: {
  draftKey: string;
  draftData: Json;
}): Promise<{ data?: RitualDraft; error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { error: "인증이 필요합니다." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ritual_drafts")
    .upsert(
      {
        user_id: user.id,
        draft_key: input.draftKey,
        draft_data: input.draftData,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,draft_key" },
    )
    .select()
    .single();

  if (error) return { error: error.message };
  revalidateDraftSurfaces();
  return { data };
}

export async function deleteRitualDraft(input: {
  draftKey: string;
}): Promise<{ error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { error: "인증이 필요합니다." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("ritual_drafts")
    .delete()
    .eq("user_id", user.id)
    .eq("draft_key", input.draftKey);

  if (error) return { error: error.message };
  revalidateDraftSurfaces();
  return {};
}
