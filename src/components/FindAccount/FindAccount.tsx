"use client";

import { useState } from "react";
import { findEmail, resetPassword } from "@/api/auth";

type Tab = "id" | "password";

export default function FindAccount() {
  const [tab, setTab] = useState<Tab>("id");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState("");

  const handleFindEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setResult("");

    if (!username.trim()) {
      setError("닉네임을 입력해주세요.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await findEmail(username.trim());
      if (res.error) {
        setError(res.error);
      } else if (res.email) {
        setResult(res.email);
      }
    } catch {
      setError("오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setResult("");

    if (!email.trim()) {
      setError("이메일을 입력해주세요.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await resetPassword(email.trim());
      if (res.error) {
        setError(res.error);
      } else {
        setResult("비밀번호 재설정 링크를 이메일로 전송했습니다.");
      }
    } catch {
      setError("오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setIsLoading(false);
    }
  };

  const switchTab = (newTab: Tab) => {
    setTab(newTab);
    setError("");
    setResult("");
    setUsername("");
    setEmail("");
  };

  return (
    <div
      className="flex min-h-screen items-center justify-center px-4"
      style={{
        background:
          "linear-gradient(135deg, #fef7e6 0%, #fff4e5 40%, #fce9b8 100%)",
      }}
    >
      {/* 배경 장식 */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div
          className="absolute -top-20 -right-20 w-72 h-72 rounded-full opacity-20"
          style={{
            background: "radial-gradient(circle, #eab32e, transparent)",
          }}
        />
        <div
          className="absolute -bottom-20 -left-20 w-60 h-60 rounded-full opacity-15"
          style={{
            background: "radial-gradient(circle, #ff9c28, transparent)",
          }}
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
            <p className="text-sm text-gray-400">계정 찾기</p>
          </div>

          {/* 탭 */}
          <div className="flex mb-6 rounded-2xl bg-gray-100 p-1">
            <button
              type="button"
              onClick={() => switchTab("id")}
              className={`flex-1 rounded-xl py-2.5 text-sm font-semibold transition-all ${
                tab === "id"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-400 hover:text-gray-500"
              }`}
            >
              아이디 찾기
            </button>
            <button
              type="button"
              onClick={() => switchTab("password")}
              className={`flex-1 rounded-xl py-2.5 text-sm font-semibold transition-all ${
                tab === "password"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-400 hover:text-gray-500"
              }`}
            >
              비밀번호 찾기
            </button>
          </div>

          {/* 에러 메시지 */}
          {error && (
            <div className="mb-5 rounded-2xl bg-red-50 p-4 border border-red-100">
              <p className="text-sm text-red-600 font-medium">{error}</p>
            </div>
          )}

          {/* 결과 메시지 */}
          {result && (
            <div className="mb-5 rounded-2xl bg-green-50 p-4 border border-green-100">
              {tab === "id" ? (
                <div>
                  <p className="text-sm text-green-700 font-medium mb-1">
                    가입된 이메일을 찾았습니다.
                  </p>
                  <p className="text-sm text-green-600">{result}</p>
                </div>
              ) : (
                <p className="text-sm text-green-700 font-medium">{result}</p>
              )}
            </div>
          )}

          {/* 아이디 찾기 폼 */}
          {tab === "id" && (
            <form onSubmit={handleFindEmail} className="space-y-4">
              <div>
                <label
                  htmlFor="username"
                  className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wider"
                >
                  닉네임
                </label>
                <input
                  id="username"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="block w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-sm text-gray-900 placeholder-gray-300 transition-all focus:border-[var(--gold-400)] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[var(--gold-400)]/20"
                  placeholder="가입 시 입력한 닉네임"
                />
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
                {isLoading ? "찾는 중..." : "이메일 찾기"}
              </button>
            </form>
          )}

          {/* 비밀번호 찾기 폼 */}
          {tab === "password" && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label
                  htmlFor="email"
                  className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wider"
                >
                  이메일
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-sm text-gray-900 placeholder-gray-300 transition-all focus:border-[var(--gold-400)] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[var(--gold-400)]/20"
                  placeholder="가입 시 입력한 이메일"
                />
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
                {isLoading ? "전송 중..." : "재설정 링크 전송"}
              </button>
            </form>
          )}

          {/* 로그인으로 돌아가기 */}
          <div className="mt-6 text-center">
            <a
              href="/login"
              className="text-sm font-bold text-[var(--gold-500)] hover:text-[var(--gold-600)] transition-colors"
            >
              로그인으로 돌아가기
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
