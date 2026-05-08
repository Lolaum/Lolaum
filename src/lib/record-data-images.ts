import { randomUUID } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/types/supabase";

const IMAGE_ARRAY_FIELDS = ["certPhotos", "images"] as const;
const IMAGE_STRING_FIELDS = ["image", "screenshot"] as const;
const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);
const MAX_FILE_SIZE = 10 * 1024 * 1024;

type JsonObject = { [key: string]: Json | undefined };

function isJsonObject(value: Json): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isDataUrl(value: unknown): value is string {
  return typeof value === "string" && value.startsWith("data:");
}

async function uploadDataUrl(dataUrl: string, userId: string): Promise<string> {
  const res = await fetch(dataUrl);
  const blob = await res.blob();

  if (!ALLOWED_MIME_TYPES.has(blob.type)) {
    throw new Error("이미지 파일만 업로드 가능합니다. (jpeg, png, webp, gif)");
  }
  if (blob.size > MAX_FILE_SIZE) {
    throw new Error("파일 크기가 10MB를 초과합니다.");
  }

  const ext = blob.type.split("/")[1]?.replace("jpeg", "jpg") || "jpg";
  const fileName = `${userId}/${Date.now()}-${randomUUID()}.${ext}`;
  const admin = createAdminClient();
  const { error } = await admin.storage
    .from("certification-photos")
    .upload(fileName, blob, { contentType: blob.type, upsert: false });

  if (error) throw new Error(`이미지 업로드 실패: ${error.message}`);

  const { data } = admin.storage
    .from("certification-photos")
    .getPublicUrl(fileName);

  return data.publicUrl;
}

async function normalizeImageValue(
  value: Json | undefined,
  userId: string,
): Promise<Json | undefined> {
  if (isDataUrl(value)) return uploadDataUrl(value, userId);
  if (!Array.isArray(value)) return value;

  return Promise.all(
    value.map((item) => (isDataUrl(item) ? uploadDataUrl(item, userId) : item)),
  ) as Promise<Json[]>;
}

export async function normalizeRecordDataImages(
  recordData: Json,
  userId: string,
): Promise<Json> {
  if (!isJsonObject(recordData)) return recordData;

  let changed = false;
  const next: JsonObject = { ...recordData };

  for (const field of IMAGE_ARRAY_FIELDS) {
    const normalized = await normalizeImageValue(next[field], userId);
    if (normalized !== next[field]) {
      next[field] = normalized;
      changed = true;
    }
  }

  for (const field of IMAGE_STRING_FIELDS) {
    const normalized = await normalizeImageValue(next[field], userId);
    if (normalized !== next[field]) {
      next[field] = normalized;
      changed = true;
    }
  }

  return changed ? next : recordData;
}
