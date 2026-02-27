"use client";

import { useState } from "react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      console.log("로그인 시도:", { email, password });
      window.location.href = "/home";
    } catch (error) {
      setError("로그인 중 오류가 발생했습니다. 다시 시도해주세요.");
      console.error("로그인 실패:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="flex min-h-screen items-center justify-center px-4"
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
            <p className="text-sm text-gray-400">매일 성장하는 나를 만드는 곳</p>
          </div>

          {/* 에러 메시지 */}
          {error && (
            <div className="mb-5 rounded-2xl bg-red-50 p-4 border border-red-100">
              <p className="text-sm text-red-600 font-medium">{error}</p>
            </div>
          )}

          {/* 로그인 폼 */}
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">
                이메일
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-sm text-gray-900 placeholder-gray-300 transition-all focus:border-[var(--gold-400)] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[var(--gold-400)]/20"
                placeholder="your@email.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">
                비밀번호
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3.5 pr-12 text-sm text-gray-900 placeholder-gray-300 transition-all focus:border-[var(--gold-400)] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[var(--gold-400)]/20"
                  placeholder="••••••••"
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

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-200 text-[var(--gold-400)] focus:ring-[var(--gold-400)]"
                />
                <span className="text-sm text-gray-500">로그인 상태 유지</span>
              </label>
              <a href="#" className="text-sm font-medium text-[var(--gold-500)] hover:text-[var(--gold-600)] transition-colors">
                비밀번호 찾기
              </a>
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
              {isLoading ? "로그인 중..." : "시작하기"}
            </button>
          </form>

          {/* 구분선 */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-100" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white px-3 text-xs text-gray-300">또는</span>
            </div>
          </div>

          {/* 회원가입 */}
          <div className="text-center">
            <p className="text-sm text-gray-400">
              아직 계정이 없으신가요?{" "}
              <a href="#" className="font-bold text-[var(--gold-500)] hover:text-[var(--gold-600)] transition-colors">
                회원가입
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
