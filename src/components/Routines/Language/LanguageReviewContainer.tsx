"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ChevronRight, Grid3x3, Loader2 } from "lucide-react";
import StudyPhrase from "./StudyPhrase";
import { getMyRitualRecordsAcrossChallenges } from "@/api/ritual-record";
import { formatKoreaDateKey } from "@/lib/korea-date";
import type { LanguageRecord } from "@/types/routines/language";
import type { LanguageRecordData, RoutineTypeDB } from "@/types/supabase";

interface LanguageReviewContainerProps {
  languageType: "영어" | "제2외국어";
}

interface MonthGroup {
  monthKey: string;
  label: string;
  records: LanguageRecord[];
  expressionCount: number;
  isCurrentMonth: boolean;
}

interface FlashCard {
  word: string;
  meaning: string;
  example: string;
}

interface SelectedReview {
  title: string;
  cards: FlashCard[];
}

function monthKeyFromDateKey(dateKey: string) {
  return dateKey.slice(0, 7);
}

function formatMonthLabel(monthKey: string, currentMonthKey: string) {
  if (monthKey === currentMonthKey) return "이번달 단어 카드로 복습하기";

  const [year, month] = monthKey.split("-");
  const currentYear = currentMonthKey.slice(0, 4);
  const monthNumber = Number(month);
  return year === currentYear
    ? `${monthNumber}월 단어 카드 복습하기`
    : `${year}년 ${monthNumber}월 단어 카드 복습하기`;
}

function buildReviewCards(group: MonthGroup) {
  const cards = group.records.flatMap((record) =>
    record.expressions.map((expression) => ({
      word: expression.word,
      meaning: expression.meaning,
      example: expression.example,
    })),
  );

  for (let index = cards.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [cards[index], cards[randomIndex]] = [cards[randomIndex], cards[index]];
  }

  return group.isCurrentMonth ? cards : cards.slice(0, 25);
}

export default function LanguageReviewContainer({
  languageType,
}: LanguageReviewContainerProps) {
  const router = useRouter();
  const isEnglish = languageType === "영어";
  const accentColor = isEnglish ? "#0ea5e9" : "#10b981";
  const accentBg = isEnglish ? "#f0f9ff" : "#ecfdf5";
  const routineType: RoutineTypeDB = isEnglish ? "english" : "second_language";
  const basePath = isEnglish ? "/home/english" : "/home/second-language";
  const currentMonthKey = monthKeyFromDateKey(formatKoreaDateKey());

  const [languageRecords, setLanguageRecords] = useState<LanguageRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReview, setSelectedReview] = useState<SelectedReview | null>(
    null,
  );

  useEffect(() => {
    let ignore = false;

    async function loadRecords() {
      const { data } = await getMyRitualRecordsAcrossChallenges({
        routineTypes: [routineType],
      });

      if (ignore) return;

      const records: LanguageRecord[] = (data ?? []).map((record) => {
        const recordData = record.record_data as unknown as LanguageRecordData;
        const date = new Date(record.record_date);
        const expressions = recordData.expressions ?? [];

        return {
          id: record.id,
          date: `${date.getMonth() + 1}월 ${date.getDate()}일`,
          recordDate: record.record_date,
          images: recordData.images ?? [],
          achievement: recordData.achievement,
          expressions,
          expressionCount: expressions.length,
        };
      });

      setLanguageRecords(records);
      setLoading(false);
    }

    void loadRecords();

    return () => {
      ignore = true;
    };
  }, [routineType]);

  const monthGroups = useMemo(() => {
    const grouped = new Map<string, LanguageRecord[]>();

    languageRecords.forEach((record) => {
      if (!record.recordDate || record.expressionCount === 0) return;
      const monthKey = monthKeyFromDateKey(record.recordDate);
      grouped.set(monthKey, [...(grouped.get(monthKey) ?? []), record]);
    });

    return Array.from(grouped.entries())
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([monthKey, records]) => ({
        monthKey,
        label: formatMonthLabel(monthKey, currentMonthKey),
        records,
        expressionCount: records.reduce(
          (sum, record) => sum + record.expressionCount,
          0,
        ),
        isCurrentMonth: monthKey === currentMonthKey,
      }));
  }, [currentMonthKey, languageRecords]);

  return (
    <>
      <div className="w-full max-w-2xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between mb-4">
          <button
            type="button"
            onClick={() => router.push(basePath)}
            className="w-9 h-9 flex items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 transition-colors"
            aria-label="뒤로가기"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <p className="text-sm font-semibold text-gray-900">
            단어 카드 복습
          </p>
          <div className="w-9" />
        </div>

        <div className="rounded-2xl bg-white shadow-sm border border-gray-100 p-4 mb-4">
          <p className="text-xs text-gray-400 font-medium mb-0.5">
            {isEnglish ? "영어 리추얼" : "제2외국어 리추얼"}
          </p>
          <h1 className="text-lg font-bold text-gray-900">
            월별 단어 카드 복습
          </h1>
        </div>

        {loading ? (
          <div className="text-center py-10 text-gray-400">
            <Loader2 size={20} className="animate-spin mx-auto mb-2" />
            <p className="text-xs">복습 목록을 불러오는 중...</p>
          </div>
        ) : monthGroups.length === 0 ? (
          <div className="rounded-2xl bg-white border border-gray-100 p-8 text-center">
            <p className="text-base font-semibold text-gray-900 mb-2">
              복습할 단어 카드가 없어요
            </p>
            <p className="text-sm text-gray-500">
              학습 기록에 단어와 뜻을 남기면 월별 복습이 생깁니다.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {monthGroups.map((group) => (
              <button
                key={group.monthKey}
                type="button"
                onClick={() =>
                  setSelectedReview({
                    title: group.label,
                    cards: buildReviewCards(group),
                  })
                }
                className="w-full flex items-center justify-between bg-white rounded-2xl shadow-sm border border-gray-100 p-4 text-left transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-10 h-10 rounded-xl flex shrink-0 items-center justify-center"
                    style={{ backgroundColor: accentBg }}
                  >
                    <Grid3x3
                      className="w-5 h-5"
                      style={{ color: accentColor }}
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {group.label}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {group.isCurrentMonth
                        ? `${group.expressionCount}개의 표현`
                        : `${group.expressionCount}개 중 최대 25개 랜덤`}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />
              </button>
            ))}
          </div>
        )}
      </div>

      {selectedReview && (
        <StudyPhrase
          cards={selectedReview.cards}
          onClose={() => setSelectedReview(null)}
          accentColor={accentColor}
          title={selectedReview.title}
        />
      )}
    </>
  );
}
