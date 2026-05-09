"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Search, X } from "lucide-react";
import { Declaration, RoutineType } from "@/types/routines/declaration";
import { getAllDeclarations } from "@/api/declaration";
import { ROUTINE_CONFIG, ALL_ROUTINE_TYPES } from "@/lib/routineConfig";
import DeclarationItem from "./DeclarationItem";

const PAGE_SIZE = 10;

export default function DeclarationContainer() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<RoutineType | "전체">("전체");
  const [currentPage, setCurrentPage] = useState(1);
  const [allDecls, setAllDecls] = useState<Declaration[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState("");

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

  const searchQuery = searchInput.trim().toLowerCase();
  const filtered = allDecls.filter((d) => {
    const matchesTab = activeTab === "전체" || d.routineType === activeTab;
    const matchesSearch =
      searchQuery.length === 0 ||
      d.userName.toLowerCase().includes(searchQuery);
    return matchesTab && matchesSearch;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const visible = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const handleTabChange = (tab: RoutineType | "전체") => {
    setActiveTab(tab);
    setCurrentPage(1);
  };

  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    setCurrentPage(1);
  };

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

      {/* 닉네임 검색 */}
      <div className="relative mb-4">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
        />
        <input
          type="text"
          value={searchInput}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder="닉네임으로 검색"
          className="w-full pl-9 pr-9 py-2.5 rounded-xl bg-white border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[var(--gold-400)] focus:ring-1 focus:ring-[var(--gold-400)] transition-colors"
        />
        {searchInput && (
          <button
            type="button"
            onClick={() => handleSearchChange("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            aria-label="검색어 지우기"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* 탭 필터 */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 mb-5 scrollbar-hide">
        <button
          onClick={() => handleTabChange("전체")}
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
              onClick={() => handleTabChange(type)}
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

          {/* 페이지네이션 */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-1 mt-6">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                이전
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-9 h-9 rounded-xl text-sm font-semibold transition-colors ${
                    currentPage === page
                      ? "bg-[var(--gold-400)] text-white"
                      : "text-gray-500 hover:bg-gray-100"
                  }`}
                >
                  {page}
                </button>
              ))}

              <button
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
                className="px-3 py-2 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                다음
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
