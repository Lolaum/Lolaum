"use server";

import { createClient, getCurrentUser } from "@/lib/supabase/server";
import type { Profile } from "@/types/supabase";

export async function getMe(): Promise<Profile | null> {
  const user = await getCurrentUser();
  if (!user) return null;

  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return data;
}
