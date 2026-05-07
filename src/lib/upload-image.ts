import { createClient } from "@/lib/supabase/client";

/**
 * base64 Data URL을 Supabase Storage에 업로드하고 public URL을 반환한다.
 * 빈 문자열이나 이미 URL인 경우 그대로 반환한다.
 */
export async function uploadImage(dataUrl: string): Promise<string> {
  if (!dataUrl || !dataUrl.startsWith("data:")) return dataUrl;

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("인증이 필요합니다.");

  const res = await fetch(dataUrl);
  const blob = await res.blob();

  const ext = blob.type.split("/")[1]?.replace("jpeg", "jpg") || "jpg";
  const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const { error } = await supabase.storage
    .from("certification-photos")
    .upload(fileName, blob, { upsert: true });

  if (error) throw new Error(`이미지 업로드 실패: ${error.message}`);

  const { data } = supabase.storage
    .from("certification-photos")
    .getPublicUrl(fileName);

  return data.publicUrl;
}

/**
 * 여러 base64 Data URL을 병렬로 업로드한다.
 */
export async function uploadImages(dataUrls: string[]): Promise<string[]> {
  return Promise.all(dataUrls.map(uploadImage));
}
