"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Declaration, RoutineType } from "@/types/routines/declaration";
import { getAllDeclarations } from "@/api/declaration";
import { ROUTINE_CONFIG, ALL_ROUTINE_TYPES } from "@/lib/routineConfig";
import DeclarationItem from "./DeclarationItem";

const PAGE_SIZE = 8;

export default function DeclarationContainer() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<RoutineType | "전체">("전체");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [allDecls, setAllDecls] = useState<Declaration[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDeclarations() {
      setLoading(true);
      try {
        const res = await getAllDeclarations();
        setAllDecls(res.data ?? []);
        setCurrentUserId(res.currentUserId ?? "");
      } catch (e) {
        console.error("선언 조회 실패:", e);
      } finally {
        setLoading(false);
      }
    }
    fetchDeclarations();
  }, []);

  const availableTypes = ALL_ROUTINE_TYPES.filter((type) =>
    allDecls.some((d) => d.routineType === type)
  );

  const filtered =
    activeTab === "전체"
      ? allDecls
      : allDecls.filter((d) => d.routineType === activeTab);

  const visible = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [activeTab]);

  const loadMore = useCallback(() => {
    setVisibleCount((prev) => prev + PAGE_SIZE);
  }, []);

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
    <div className="max-w-3xl mx-auto px-4 py-6 pb-8">
      {/* 헤더 */}
      <div className="rounded-2xl bg-white shadow-sm border border-gray-100 p-4 mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-xl hover:bg-gray-100 transition-colors text-gray-500"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <p className="text-xs text-gray-400 font-medium mb-0.5">챌린저들의 다짐</p>
            <h1 className="text-xl font-bold text-gray-900">리추얼 선언</h1>
          </div>
        </div>
      </div>

      {/* 탭 필터 */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 mb-5 scrollbar-hide">
        <button
          onClick={() => setActiveTab("전체")}
          className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 ${
            activeTab === "전체"
              ? "bg-[var(--gold-400)] text-white shadow-sm"
              : "bg-gray-100 text-gray-500 hover:bg-gray-200"
          }`}
        >
          전체
        </button>
        {availableTypes.map((type) => {
          const cfg = ROUTINE_CONFIG[type];
          return (
            <button
              key={type}
              onClick={() => setActiveTab(type)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 flex items-center gap-1.5 ${
                activeTab === type
                  ? "bg-[var(--gold-400)] text-white shadow-sm"
                  : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              }`}
            >
              {cfg.icon(13)} {cfg.label}
            </button>
          );
        })}
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <Loader2 size={24} className="animate-spin mb-3" />
          <p className="text-sm">선언을 불러오는 중...</p>
        </div>
      )}

      {!loading && (
        <>
          {/* 카드 그리드 */}
          <div className="grid grid-cols-2 gap-3">
            {visible.length === 0 ? (
              <div className="col-span-2 text-center py-16 text-gray-400 bg-white rounded-2xl shadow-sm border border-gray-100">
                <span className="text-4xl block mb-3">📋</span>
                <p className="text-sm font-medium">아직 선언이 없어요</p>
              </div>
            ) : (
              visible.map((decl) => (
                <DeclarationItem
                  key={decl.id}
                  decl={decl}
                  isMine={decl.userId === currentUserId}
                />
              ))
            )}
          </div>

          {/* 무한 스크롤 sentinel */}
          <div ref={sentinelRef} className="h-8" />

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
        </>
      )}
    </div>
  );
}
