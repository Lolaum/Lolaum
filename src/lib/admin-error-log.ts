import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/types/supabase";

export function getErrorMessage(error: unknown, fallback = "Unknown error") {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  if (
    error &&
    typeof error === "object" &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error.message;
  }
  return fallback;
}

export async function logAdminError(
  source: string,
  error: unknown,
  metadata?: Json,
) {
  try {
    const admin = createAdminClient();
    await admin.from("admin_error_logs").insert({
      source,
      message: getErrorMessage(error),
      metadata: metadata ?? null,
    });
  } catch {
    // The log table is optional during setup; logging must never break the user flow.
  }
}
