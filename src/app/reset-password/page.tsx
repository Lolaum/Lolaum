import { redirect } from "next/navigation";
import ResetPassword from "@/components/ResetPassword/ResetPassword";

interface ResetPasswordPageProps {
  searchParams: Promise<{
    code?: string | string[];
    error?: string | string[];
  }>;
}

export default async function ResetPasswordPage({
  searchParams,
}: ResetPasswordPageProps) {
  const params = await searchParams;
  const code = Array.isArray(params.code) ? params.code[0] : params.code;
  const error = Array.isArray(params.error) ? params.error[0] : params.error;

  // 이전에 발송된 /reset-password?code=... 링크도 새 콜백 흐름으로 연결한다.
  if (code) {
    redirect(`/auth/callback?code=${encodeURIComponent(code)}`);
  }

  const initialError =
    error === "invalid_recovery_link"
      ? "비밀번호 재설정 링크가 만료되었거나 이미 사용되었습니다. 새 링크를 요청해주세요."
      : undefined;

  return <ResetPassword initialError={initialError} />;
}
