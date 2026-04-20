import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

/**
 * RLS를 우회하는 서버 전용 관리자 클라이언트.
 * 피드처럼 모든 유저의 데이터를 조회해야 하는 경우에만 사용한다.
 * 절대 클라이언트(브라우저)에 노출되면 안 된다.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  return createSupabaseClient<Database>(url, serviceRoleKey, {
    auth: { persistSession: false },
  });
}
