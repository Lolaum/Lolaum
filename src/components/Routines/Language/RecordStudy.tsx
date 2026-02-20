"use client";

import { useState, useMemo } from "react";
import { ChevronDown } from "lucide-react";
import { LanguageRecord } from "@/types/routines/language";

interface Expression {
  word: string;
  meaning: string;
  example: string;
}

interface GroupedRecord {
  date: string;
  achievement: string;
  expressions: Expression[];
  totalExpressions: number;
}

interface RecordStudyProps {
  languageRecords: LanguageRecord[];
}

export default function RecordStudy({ languageRecords }: RecordStudyProps) {
  const [expandedDates, setExpandedDates] = useState<string[]>([]);

  // 날짜별로 그룹화
  const groupedRecords = useMemo(() => {
    const grouped = languageRecords.reduce(
      (acc, record) => {
        if (!acc[record.date]) {
          acc[record.date] = {
            date: record.date,
            achievement: record.achievement,
            expressions: [],
            totalExpressions: 0,
          };
        }

        acc[record.date].expressions.push(...record.expressions);
        acc[record.date].totalExpressions += record.expressionCount;

        return acc;
      },
      {} as Record<string, GroupedRecord>,
    );

    return Object.values(grouped);
  }, [languageRecords]);

  const toggleExpand = (date: string) => {
    setExpandedDates((prev) =>
      prev.includes(date) ? prev.filter((d) => d !== date) : [...prev, date],
    );
  };

  return (
    <>
      {/* 학습 기록 섹션 */}
      <div className="mb-4">
        <h2 className="text-base font-semibold text-gray-900">학습 기록</h2>
      </div>

      {/* Collapsible 리스트 */}
      <div className="space-y-2">
        {groupedRecords.map((group) => {
          const isExpanded = expandedDates.includes(group.date);

          return (
            <div
              key={group.date}
              className="bg-white rounded-2xl border border-gray-200 overflow-hidden transition-all"
            >
              {/* 헤더 (클릭 가능) */}
              <button
                type="button"
                onClick={() => toggleExpand(group.date)}
                className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors text-left"
              >
                <div className="flex-1">
                  <h3 className="text-base font-bold text-gray-900 mb-1">
                    {group.date}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {group.expressions.map((e) => e.word).join(", ")}
                  </p>
                </div>
                <div className="flex items-center gap-3 ml-4">
                  <span className="text-sm text-blue-600 font-medium">
                    {group.totalExpressions}개 표현
                  </span>
                  <ChevronDown
                    className={`w-5 h-5 text-gray-400 transition-transform ${
                      isExpanded ? "rotate-180" : ""
                    }`}
                  />
                </div>
              </button>

              {/* 확장된 내용 */}
              {isExpanded && (
                <div className="px-4 pb-4 pt-2 border-t border-gray-100">
                  {/* 오늘의 작은 성취 */}
                  {group.achievement && (
                    <div className="mb-4">
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">
                        오늘의 작은 성취
                      </h4>
                      <p className="text-sm text-gray-600 bg-gray-50 rounded-xl p-3">
                        {group.achievement}
                      </p>
                    </div>
                  )}

                  {/* 그 날 입력한 표현 */}
                  <div className="mb-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">
                      공부한 표현
                    </h4>
                    <div className="space-y-3">
                      {group.expressions.map((expr, index) => (
                        <div key={index} className="bg-gray-50 rounded-xl p-3">
                          <div className="font-semibold text-gray-900 mb-1">
                            {expr.word}
                          </div>
                          <div className="text-sm text-gray-600 mb-2">
                            {expr.meaning}
                          </div>
                          {expr.example && (
                            <div className="text-sm text-gray-500 pl-3 border-l-2 border-orange-200">
                              {expr.example}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
