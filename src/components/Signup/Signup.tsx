"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { signup, checkUsername } from "@/api/auth";

export default function Signup() {
  const router = useRouter();
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    passwordConfirm: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState<
    "idle" | "checking" | "available" | "taken"
  >("idle");

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (field === "username") {
      setUsernameStatus("idle");
    }
  };

  const handleCheckUsername = useCallback(async () => {
    const username = form.username.trim();
    if (!username) return;

    setUsernameStatus("checking");
    const result = await checkUsername(username);
    setUsernameStatus(result.available ? "available" : "taken");
  }, [form.username]);

  const validate = () => {
    if (!form.username.trim()) return "닉네임을 입력해주세요.";
    if (!form.email.trim()) return "이메일을 입력해주세요.";
    if (!form.password) return "비밀번호를 입력해주세요.";
    if (form.password.length < 6) return "비밀번호는 6자 이상이어야 합니다.";
    if (form.password !== form.passwordConfirm) return "비밀번호가 일치하지 않습니다.";
    if (usernameStatus === "taken") return "이미 사용 중인 닉네임입니다.";
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);
    try {
      const result = await signup({
        name: form.username.trim(),
        username: form.username.trim(),
        email: form.email.trim(),
        password: form.password,
      });

      if (result.error) {
        setError(result.error);
        return;
      }

      router.push("/login?registered=true");
    } catch {
      setError("회원가입 중 오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="flex min-h-screen items-center justify-center px-4 py-8"
      style={{
        background: "linear-gradient(135deg, #fef7e6 0%, #fff4e5 40%, #fce9b8 100%)",
      }}
    >
      {/* 배경 장식 */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div
          className="absolute -top-20 -right-20 w-72 h-72 rounded-full opacity-20"
          style={{ background: "radial-gradient(circle, #eab32e, transparent)" }}
        />
        <div
          className="absolute -bottom-20 -left-20 w-60 h-60 rounded-full opacity-15"
          style={{ background: "radial-gradient(circle, #ff9c28, transparent)" }}
        />
      </div>

      <div className="w-full max-w-md relative">
        <div className="rounded-3xl bg-white p-8 shadow-xl sm:p-10">
          {/* 로고 */}
          <div className="mb-8 text-center">
            <img
              src="/images/common/LolaumLogo.png"
              alt="Lolaum Logo"
              className="mx-auto h-10 w-auto mb-3"
            />
            <p className="text-sm text-gray-400">새로운 리추얼 여정을 시작하세요</p>
          </div>

          {/* 에러 메시지 */}
          {error && (
            <div className="mb-5 rounded-2xl bg-red-50 p-4 border border-red-100">
              <p className="text-sm text-red-600 font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 닉네임 */}
            <div>
              <label htmlFor="username" className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">
                닉네임
              </label>
              <div className="flex gap-2">
                <input
                  id="username"
                  type="text"
                  required
                  value={form.username}
                  onChange={(e) => updateField("username", e.target.value)}
                  className="block w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-sm text-gray-900 placeholder-gray-300 transition-all focus:border-[var(--gold-400)] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[var(--gold-400)]/20"
                  placeholder="닉네임을 입력하세요"
                />
                <button
                  type="button"
                  onClick={handleCheckUsername}
                  disabled={!form.username.trim() || usernameStatus === "checking"}
                  className="shrink-0 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-xs font-semibold text-gray-500 transition-all hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {usernameStatus === "checking" ? "확인중..." : "중복확인"}
                </button>
              </div>
              {usernameStatus === "available" && (
                <p className="mt-1.5 text-xs text-green-600 font-medium">사용 가능한 닉네임입니다.</p>
              )}
              {usernameStatus === "taken" && (
                <p className="mt-1.5 text-xs text-red-500 font-medium">이미 사용 중인 닉네임입니다.</p>
              )}
            </div>

            {/* 이메일 */}
            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">
                이메일
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={form.email}
                onChange={(e) => updateField("email", e.target.value)}
                className="block w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-sm text-gray-900 placeholder-gray-300 transition-all focus:border-[var(--gold-400)] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[var(--gold-400)]/20"
                placeholder="your@email.com"
              />
            </div>

            {/* 비밀번호 */}
            <div>
              <label htmlFor="password" className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">
                비밀번호
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  value={form.password}
                  onChange={(e) => updateField("password", e.target.value)}
                  className="block w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3.5 pr-12 text-sm text-gray-900 placeholder-gray-300 transition-all focus:border-[var(--gold-400)] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[var(--gold-400)]/20"
                  placeholder="6자 이상"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-300 hover:text-gray-500 transition-colors"
                >
                  {showPassword ? (
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* 비밀번호 확인 */}
            <div>
              <label htmlFor="passwordConfirm" className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">
                비밀번호 확인
              </label>
              <input
                id="passwordConfirm"
                type="password"
                autoComplete="new-password"
                required
                value={form.passwordConfirm}
                onChange={(e) => updateField("passwordConfirm", e.target.value)}
                className="block w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-sm text-gray-900 placeholder-gray-300 transition-all focus:border-[var(--gold-400)] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[var(--gold-400)]/20"
                placeholder="비밀번호를 다시 입력하세요"
              />
              {form.passwordConfirm && form.password !== form.passwordConfirm && (
                <p className="mt-1.5 text-xs text-red-500 font-medium">비밀번호가 일치하지 않습니다.</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="mt-2 w-full rounded-2xl py-4 text-sm font-bold text-white shadow-md transition-all hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
              style={{
                background: isLoading
                  ? "#d4a017"
                  : "linear-gradient(135deg, #c99315 0%, #eab32e 50%, #ff9c28 100%)",
              }}
            >
              {isLoading ? "가입 중..." : "회원가입"}
            </button>
          </form>

          {/* 로그인 링크 */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-400">
              이미 계정이 있으신가요?{" "}
              <a href="/login" className="font-bold text-[var(--gold-500)] hover:text-[var(--gold-600)] transition-colors">
                로그인
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
