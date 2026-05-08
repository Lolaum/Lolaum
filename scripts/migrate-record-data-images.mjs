import { randomUUID } from "node:crypto";
import nextEnv from "@next/env";
import { createClient } from "@supabase/supabase-js";

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);

const WRITE = process.argv.includes("--write");
const BUCKET = "certification-photos";
const IMAGE_ARRAY_FIELDS = ["certPhotos", "images"];
const IMAGE_STRING_FIELDS = ["image", "screenshot"];
const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);
const MAX_FILE_SIZE = 10 * 1024 * 1024;

function isDataUrl(value) {
  return typeof value === "string" && value.startsWith("data:");
}

function extFromMime(type) {
  return (type.split("/")[1] || "jpg").replace("jpeg", "jpg");
}

async function uploadDataUrl(dataUrl, userId, rowId, field, index) {
  const res = await fetch(dataUrl);
  const blob = await res.blob();

  if (!ALLOWED_MIME_TYPES.has(blob.type)) {
    throw new Error(`unsupported mime type: ${blob.type}`);
  }
  if (blob.size > MAX_FILE_SIZE) {
    throw new Error(`image exceeds ${MAX_FILE_SIZE} bytes`);
  }

  const fileName = `${userId}/migrated-${rowId}-${field}-${index ?? 0}-${randomUUID()}.${extFromMime(blob.type)}`;
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(fileName, blob, { contentType: blob.type, upsert: false });

  if (error) throw error;

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(fileName);
  return data.publicUrl;
}

async function normalizeRecord(row) {
  const original = row.record_data;
  if (!original || typeof original !== "object" || Array.isArray(original)) {
    return { changed: false, next: original, dataUrlCount: 0, dataUrlBytes: 0 };
  }

  const next = { ...original };
  let changed = false;
  let dataUrlCount = 0;
  let dataUrlBytes = 0;

  for (const field of IMAGE_ARRAY_FIELDS) {
    const value = next[field];
    if (!Array.isArray(value)) continue;

    const normalized = [];
    for (let i = 0; i < value.length; i++) {
      const item = value[i];
      if (isDataUrl(item)) {
        dataUrlCount++;
        dataUrlBytes += Buffer.byteLength(item);
        normalized.push(
          WRITE
            ? await uploadDataUrl(item, row.user_id, row.id, field, i)
            : item,
        );
        changed = true;
      } else {
        normalized.push(item);
      }
    }
    next[field] = normalized;
  }

  for (const field of IMAGE_STRING_FIELDS) {
    const value = next[field];
    if (!isDataUrl(value)) continue;

    dataUrlCount++;
    dataUrlBytes += Buffer.byteLength(value);
    next[field] = WRITE
      ? await uploadDataUrl(value, row.user_id, row.id, field, 0)
      : value;
    changed = true;
  }

  return { changed, next, dataUrlCount, dataUrlBytes };
}

async function main() {
  const { data: rows, error } = await supabase
    .from("ritual_records")
    .select("id,user_id,record_data")
    .order("created_at", { ascending: true })
    .limit(10000);

  if (error) throw error;

  const summary = {
    mode: WRITE ? "write" : "dry-run",
    scannedRows: rows?.length ?? 0,
    changedRows: 0,
    dataUrlCount: 0,
    dataUrlBytes: 0,
    updatedRows: 0,
  };

  for (const row of rows ?? []) {
    const result = await normalizeRecord(row);
    if (!result.changed) continue;

    summary.changedRows++;
    summary.dataUrlCount += result.dataUrlCount;
    summary.dataUrlBytes += result.dataUrlBytes;

    if (WRITE) {
      const { error: updateError } = await supabase
        .from("ritual_records")
        .update({ record_data: result.next })
        .eq("id", row.id);
      if (updateError) throw updateError;
      summary.updatedRows++;
    }
  }

  console.log(JSON.stringify(summary, null, 2));
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
