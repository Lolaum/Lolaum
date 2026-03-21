"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Declaration, RoutineType } from "@/types/routines/declaration";
import { declarationQuestions } from "@/constants/declarationQuestions";
import { myDeclarations, challengerDeclarations } from "@/mock/declarationmock";

const PAGE_SIZE = 8;

const routineEmojis: Record<RoutineType, string> = {
  모닝리추얼: "🌅",
  운동리추얼: "💪",
  독서리추얼: "📚",
  영어리추얼: "🇺🇸",
  제2외국어리추얼: "🌍",
  기록리추얼: "✍️",
  자산관리리추얼: "💰",
  원서읽기리추얼: "📖",
};

const allRoutineTypes = Object.keys(routineEmojis) as RoutineType[];

function DeclarationCard({ decl }: { decl: Declaration }) {
  const questions = declarationQuestions[decl.routineType];
  return (
    <div className="rounded-3xl p-5 bg-white shadow-sm border border-gray-100">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-base">
          {decl.userEmoji ?? "👤"}
        </div>
        <div>
          <p className="text-sm font-bold text-gray-800">{decl.userName}</p>
          <p className="text-xs text-gray-400">
            {routineEmojis[decl.routineType]} {decl.routineType}
          </p>
        </div>
      </div>
      <div className="flex flex-col gap-2.5">
        {questions.map((q) => {
          const answer = decl.answers.find((a) => a.questionId === q.id);
          if (!answer) return null;
          return (
            <div key={q.id}>
              <p className="text-xs font-semibold text-gray-400 mb-0.5">{q.label}</p>
              <p className="text-sm text-gray-700 whitespace-pre-line">{answer.answer}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function DeclarationContainer() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<RoutineType | "전체">("전체");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const allDeclarations = [...myDeclarations, ...challengerDeclarations];
  const availableTypes = allRoutineTypes.filter((type) =>
    allDeclarations.some((d) => d.routineType === type)
  );

  const filteredMine =
    activeTab === "전체"
      ? myDeclarations
      : myDeclarations.filter((d) => d.routineType === activeTab);

  const filteredChallengers =
    activeTab === "전체"
      ? challengerDeclarations
      : challengerDeclarations.filter((d) => d.routineType === activeTab);

  const visibleChallengers = filteredChallengers.slice(0, visibleCount);
  const hasMore = visibleCount < filteredChallengers.length;

  // 탭 변경 시 visibleCount 리셋
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [activeTab]);

  const loadMore = useCallback(() => {
    setVisibleCount((prev) => prev + PAGE_SIZE);
  }, []);

  // IntersectionObserver로 sentinel이 뷰포트에 들어오면 loadMore
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loadMore]);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* 헤더 */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-xl hover:bg-gray-100 transition-colors text-gray-500"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-lg font-bold text-gray-800">리추얼 선언</h1>
      </div>

      {/* 탭 필터 */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
        <button
          onClick={() => setActiveTab("전체")}
          className={`flex-shrink-0 px-4 py-2 rounded-2xl text-sm font-semibold transition-colors ${
            activeTab === "전체"
              ? "text-white"
              : "bg-white border border-gray-200 text-gray-500 hover:bg-gray-50"
          }`}
          style={activeTab === "전체" ? { backgroundColor: "#eab32e" } : {}}
        >
          전체
        </button>
        {availableTypes.map((type) => (
          <button
            key={type}
            onClick={() => setActiveTab(type)}
            className={`flex-shrink-0 px-4 py-2 rounded-2xl text-sm font-semibold transition-colors ${
              activeTab === type
                ? "text-white"
                : "bg-white border border-gray-200 text-gray-500 hover:bg-gray-50"
            }`}
            style={activeTab === type ? { backgroundColor: "#eab32e" } : {}}
          >
            {routineEmojis[type]} {type.replace("리추얼", "")}
          </button>
        ))}
      </div>

      {/* 나의 선언 */}
      {filteredMine.length > 0 && (
        <section className="mb-8">
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">
            나의 선언
          </h2>
          <div className="flex flex-col gap-4">
            {filteredMine.map((decl) => {
              const questions = declarationQuestions[decl.routineType];
              return (
                <div
                  key={decl.id}
                  className="rounded-3xl p-5 bg-white shadow-sm"
                  style={{ border: "2px solid #eab32e" }}
                >
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-xl">{routineEmojis[decl.routineType]}</span>
                    <span className="text-base font-bold text-gray-800">
                      {decl.routineType}
                    </span>
                  </div>
                  <div className="flex flex-col gap-3">
                    {questions.map((q) => {
                      const answer = decl.answers.find((a) => a.questionId === q.id);
                      if (!answer) return null;
                      return (
                        <div key={q.id}>
                          <p className="text-xs font-semibold text-gray-400 mb-0.5">{q.label}</p>
                          <p className="text-sm text-gray-700 whitespace-pre-line">{answer.answer}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 챌린저 선언 */}
      {filteredChallengers.length > 0 && (
        <section>
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">
            챌린저 선언
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {visibleChallengers.map((decl) => (
              <DeclarationCard key={decl.id} decl={decl} />
            ))}
          </div>

          {/* 무한 스크롤 sentinel */}
          <div ref={sentinelRef} className="h-8" />

          {/* 로딩 인디케이터 */}
          {hasMore && (
            <div className="flex justify-center py-4">
              <div className="flex gap-1.5">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-1.5 h-1.5 rounded-full animate-bounce"
                    style={{ backgroundColor: "#eab32e", animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {filteredMine.length === 0 && filteredChallengers.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-gray-300">
          <span className="text-4xl mb-3">📋</span>
          <p className="text-sm font-medium">아직 선언이 없어요</p>
        </div>
      )}
    </div>
  );
}
