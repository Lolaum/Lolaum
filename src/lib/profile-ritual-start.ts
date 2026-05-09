import { createAdminClient } from "@/lib/supabase/admin";

export interface ProfileRitualStart {
  ritual_start_year: number | null;
  ritual_start_month: number | null;
}

const BUCKET = "avatars";

function getPath(userId: string) {
  return `profile-meta/${userId}.json`;
}

export async function getProfileRitualStart(
  userId: string,
): Promise<ProfileRitualStart> {
  const admin = createAdminClient();
  const { data, error } = await admin.storage
    .from(BUCKET)
    .download(getPath(userId));

  if (error || !data) {
    return { ritual_start_year: null, ritual_start_month: null };
  }

  try {
    const raw = JSON.parse(await data.text()) as Partial<ProfileRitualStart>;
    return {
      ritual_start_year:
        typeof raw.ritual_start_year === "number"
          ? raw.ritual_start_year
          : null,
      ritual_start_month:
        typeof raw.ritual_start_month === "number"
          ? raw.ritual_start_month
          : null,
    };
  } catch {
    return { ritual_start_year: null, ritual_start_month: null };
  }
}

export async function saveProfileRitualStart(
  userId: string,
  input: ProfileRitualStart,
): Promise<{ error?: string }> {
  const admin = createAdminClient();
  const body = JSON.stringify(input);
  const { error } = await admin.storage
    .from(BUCKET)
    .upload(getPath(userId), body, {
      contentType: "application/json",
      upsert: true,
    });

  if (error) return { error: error.message };
  return {};
}
