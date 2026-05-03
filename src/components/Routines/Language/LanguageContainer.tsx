"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Grid3x3, Loader2 } from "lucide-react";
import RecordStudy from "./RecordStudy";
import AddNewLanguage from "./AddNewLanguage";
import StudyPhrase from "./StudyPhrase";
import {
  LanguageRecord,
  LanguageFormData,
} from "@/types/routines/language";
import { createRitualRecordAuto, getMyRitualRecords } from "@/api/ritual-record";
import type { LanguageRecordData, Json, RoutineTypeDB } from "@/types/supabase";

interface LanguageContainerProps {
  mode?: "main" | "new";
  languageType?: "영어" | "제2외국어";
}

export default function LanguageContainer({
  mode = "main",
  languageType = "영어",
}: LanguageContainerProps) {
  const router = useRouter();
  const [showStudyPhrase, setShowStudyPhrase] = useState(false);
  const [languageRecords, setLanguageRecords] = useState<LanguageRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const isEnglish = languageType === "영어";
  const accentColor = isEnglish ? "#0ea5e9" : "#10b981";
  const accentBg = isEnglish ? "#f0f9ff" : "#ecfdf5";
  const routineType: RoutineTypeDB = isEnglish ? "english" : "second_language";
  const basePath = isEnglish ? "/home/english" : "/home/second-language";

  const goHome = () => router.push("/home");
  const goMain = () => router.push(basePath);
  const goNew = () => router.push(`${basePath}/new`);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    const { data } = await getMyRitualRecords({ routineType });
    if (data) {
      const records: LanguageRecord[] = data.map((r) => {
        const d = r.record_data as unknown as LanguageRecordData;
        const date = new Date(r.record_date);
        return {
          id: r.id as unknown as number,
          date: `${date.getMonth() + 1}월 ${date.getDate()}일`,
          achievement: d.achievement,
          expressions: d.expressions ?? [],
          expressionCount: d.expressions?.length ?? 0,
        };
      });
      setLanguageRecords(records);
    }
    setLoading(false);
  }, [routineType]);

  useEffect(() => {
    if (mode === "main") fetchRecords();
  }, [fetchRecords, mode]);

  const handleSubmit = async (formData: LanguageFormData) => {
    const today = new Date().toISOString().split("T")[0];
    const recordData: LanguageRecordData = {
      achievement: formData.achievement,
      expressions: formData.expressions,
      images: formData.images,
    };
    const { error } = await createRitualRecordAuto({
      routineType,
      recordDate: today,
      recordData: recordData as unknown as Json,
    });
    if (error) {
      alert(`기록 저장 실패: ${error}`);
      return;
    }
    goMain();
  };

  // 학습일은 같은 날 여러 기록이 있어도 1일로 카운트 (record_date 기준 unique)
  const studiedDays = new Set(languageRecords.map((r) => r.date)).size;
  const totalExpressions = languageRecords.reduce(
    (sum, r) => sum + r.expressionCount,
    0,
  );

  if (mode === "new") {
    return (
      <div className="w-full max-w-2xl mx-auto px-4 py-4">
        <AddNewLanguage
          onCancel={goMain}
          onBackToHome={goHome}
          onSubmit={handleSubmit}
          languageType={languageType}
        />
      </div>
    );
  }

  return (
    <>
      <div className="w-full max-w-2xl mx-auto px-4 py-4">
        {/* 네비게이션 */}
        <div className="flex items-center justify-end mb-4">
          <button
            type="button"
            onClick={goHome}
            className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* 헤더 */}
        <div className="rounded-2xl bg-white shadow-sm border border-gray-100 p-4 mb-4">
          <p className="text-xs text-gray-400 font-medium mb-0.5">
            {isEnglish ? "영어 리추얼" : "제2외국어 리추얼"}
          </p>
          <h1 className="text-lg font-bold text-gray-900 mb-4">
            {isEnglish ? "영어 학습 기록" : "제2외국어 학습 기록"}
          </h1>
          <div className="flex gap-3">
            <div
              className="flex-1 rounded-xl p-3 text-center"
              style={{ backgroundColor: accentBg }}
            >
              <p className="text-2xl font-bold text-gray-900">{studiedDays}</p>
              <p className="text-xs text-gray-400 mt-0.5">이번 달 학습일</p>
            </div>
            <div
              className="flex-1 rounded-xl p-3 text-center"
              style={{ backgroundColor: accentBg }}
            >
              <p className="text-2xl font-bold text-gray-900">
                {totalExpressions}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">공부한 표현</p>
            </div>
          </div>
        </div>

        {/* 단어 카드 복습 */}
        <button
          type="button"
          onClick={() => setShowStudyPhrase(true)}
          disabled={totalExpressions === 0}
          className="w-full flex items-center justify-between bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-4 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-sm disabled:hover:translate-y-0"
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: isEnglish ? "#f0f9ff" : "#ecfdf5" }}
            >
              <Grid3x3
                className="w-5 h-5"
                style={{ color: isEnglish ? "#0ea5e9" : "#10b981" }}
              />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-gray-900">
                단어 카드로 복습하기
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                {totalExpressions === 0
                  ? "기록된 표현이 없어요"
                  : `${totalExpressions}개의 표현`}
              </p>
            </div>
          </div>
          <svg
            className="w-4 h-4 text-gray-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>

        {/* 기록 추가 버튼 */}
        <div className="mb-4">
          <button
            type="button"
            onClick={goNew}
            className="w-full py-3 rounded-2xl text-sm font-bold text-white shadow-sm transition-all hover:shadow-md active:scale-[0.98]"
            style={{ backgroundColor: accentColor }}
          >
            + 오늘 학습 기록하기
          </button>
        </div>

        {/* 학습 기록 섹션 */}
        {loading ? (
          <div className="text-center py-8 text-gray-400">
            <Loader2 size={20} className="animate-spin mx-auto mb-2" />
            <p className="text-xs">기록을 불러오는 중...</p>
          </div>
        ) : (
          <RecordStudy languageRecords={languageRecords} />
        )}
      </div>
      {showStudyPhrase && (
        <StudyPhrase
          languageRecords={languageRecords}
          onClose={() => setShowStudyPhrase(false)}
          accentColor={accentColor}
        />
      )}
    </>
  );
}
