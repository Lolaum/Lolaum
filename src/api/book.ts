"use server";

import { createClient, getCurrentUser } from "@/lib/supabase/server";
import { getCurrentChallengeId } from "@/lib/current-challenge";
import type { Book } from "@/types/supabase";

// ── 조회 ──────────────────────────────────────────────

export async function getBooks(
  challengeId: string,
  routineType: "reading" | "english_book" = "reading",
): Promise<{ data?: Book[]; error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { error: "인증이 필요합니다." };

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("books")
    .select("*")
    .eq("user_id", user.id)
    .eq("challenge_id", challengeId)
    .eq("routine_type", routineType)
    .order("created_at", { ascending: false });

  if (error) return { error: error.message };
  return { data: data ?? [] };
}

export async function getBooksAuto(
  routineType: "reading" | "english_book" = "reading",
): Promise<{ data?: Book[]; error?: string }> {
  const { challengeId, error } = await getCurrentChallengeId();
  if (!challengeId) return { error: error ?? "챌린지를 찾을 수 없습니다." };
  return getBooks(challengeId, routineType);
}

export async function getBook(
  id: string,
): Promise<{ data?: Book; error?: string }> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("books")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return { error: error.message };
  return { data };
}

export async function getCompletedBooksAuto(
  routineType: "reading" | "english_book" = "reading",
): Promise<{ data?: Book[]; error?: string }> {
  const { challengeId, error } = await getCurrentChallengeId();
  if (!challengeId) return { error: error ?? "챌린지를 찾을 수 없습니다." };

  const user = await getCurrentUser();
  if (!user) return { error: "인증이 필요합니다." };

  const supabase = await createClient();

  const { data, error: dbError } = await supabase
    .from("books")
    .select("*")
    .eq("user_id", user.id)
    .eq("challenge_id", challengeId)
    .eq("routine_type", routineType)
    .eq("is_completed", true)
    .order("updated_at", { ascending: false });

  if (dbError) return { error: dbError.message };
  return { data: data ?? [] };
}

// ── 생성 ──────────────────────────────────────────────

export async function createBook(input: {
  challengeId: string;
  routineType: "reading" | "english_book";
  title: string;
  author: string;
  trackingType: "page" | "percent";
  totalValue: number;
  coverImageUrl?: string;
}): Promise<{ data?: Book; error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { error: "인증이 필요합니다." };

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("books")
    .insert({
      user_id: user.id,
      challenge_id: input.challengeId,
      routine_type: input.routineType,
      title: input.title,
      author: input.author,
      tracking_type: input.trackingType,
      total_value: input.totalValue,
      cover_image_url: input.coverImageUrl ?? null,
    })
    .select()
    .single();

  if (error) return { error: error.message };
  return { data };
}

export async function createBookAuto(input: {
  routineType?: "reading" | "english_book";
  title: string;
  author: string;
  trackingType: "page" | "percent";
  totalValue: number;
  coverImageUrl?: string;
}): Promise<{ data?: Book; error?: string }> {
  const { challengeId, error } = await getCurrentChallengeId();
  if (!challengeId) return { error: error ?? "챌린지를 찾을 수 없습니다." };
  return createBook({
    challengeId,
    routineType: input.routineType ?? "reading",
    title: input.title,
    author: input.author,
    trackingType: input.trackingType,
    totalValue: input.totalValue,
    coverImageUrl: input.coverImageUrl,
  });
}

// ── 수정 ──────────────────────────────────────────────

export async function updateBook(
  id: string,
  input: {
    title?: string;
    author?: string;
    trackingType?: "page" | "percent";
    currentValue?: number;
    totalValue?: number;
    coverImageUrl?: string | null;
    isCompleted?: boolean;
  },
): Promise<{ data?: Book; error?: string }> {
  const supabase = await createClient();

  const updateData: Record<string, unknown> = {};
  if (input.title !== undefined) updateData.title = input.title;
  if (input.author !== undefined) updateData.author = input.author;
  if (input.trackingType !== undefined) updateData.tracking_type = input.trackingType;
  if (input.currentValue !== undefined) updateData.current_value = input.currentValue;
  if (input.totalValue !== undefined) updateData.total_value = input.totalValue;
  if (input.coverImageUrl !== undefined) updateData.cover_image_url = input.coverImageUrl;
  if (input.isCompleted !== undefined) updateData.is_completed = input.isCompleted;

  const { data, error } = await supabase
    .from("books")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) return { error: error.message };
  return { data };
}

// ── 삭제 ──────────────────────────────────────────────

export async function deleteBook(
  id: string,
): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createClient();

  const { error } = await supabase.from("books").delete().eq("id", id);

  if (error) return { error: error.message };
  return { success: true };
}

// ── 표지 이미지 업로드 ────────────────────────────────

export async function uploadBookCover(
  formData: FormData,
): Promise<{ url?: string; error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { error: "인증이 필요합니다." };

  const supabase = await createClient();

  const file = formData.get("file") as File | null;
  if (!file) return { error: "파일이 없습니다." };

  const ext = file.name.split(".").pop();
  const fileName = `${user.id}/${Date.now()}.${ext}`;

  const { error } = await supabase.storage
    .from("book-covers")
    .upload(fileName, file, { upsert: true });

  if (error) return { error: error.message };

  const { data: urlData } = supabase.storage
    .from("book-covers")
    .getPublicUrl(fileName);

  return { url: urlData.publicUrl };
}
