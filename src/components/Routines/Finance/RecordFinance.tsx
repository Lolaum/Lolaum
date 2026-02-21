"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { RecordFinanceProps } from "@/types/routines/finance";

export default function RecordFinance({
  financeRecords,
}: RecordFinanceProps) {
  const [expandedIds, setExpandedIds] = useState<number[]>([]);

  const toggleExpand = (id: number) => {
    setExpandedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const formatDateToDisplay = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  return (
    <>
      {/* 자산관리 기록 섹션 */}
      <div className="mb-4">
        <h2 className="text-base font-semibold text-gray-900">자산관리 기록</h2>
      </div>

      {/* Collapsible 리스트 */}
      <div className="space-y-2">
        {financeRecords.map((record) => {
          const isExpanded = expandedIds.includes(record.id);

          // 전체 총액 계산
          const totalExpense = record.dailyExpenses.reduce((sum, daily) => {
            return (
              sum +
              daily.expenses.reduce((expSum, exp) => expSum + exp.amount, 0)
            );
          }, 0);

          // 날짜 범위 표시
          const dates = record.dailyExpenses.map((d) => d.date).sort();
          const dateRange =
            dates.length === 1
              ? formatDateToDisplay(dates[0])
              : `${formatDateToDisplay(dates[0])} - ${formatDateToDisplay(dates[dates.length - 1])}`;

          return (
            <div
              key={record.id}
              className="bg-white rounded-2xl border border-gray-200 overflow-hidden transition-all"
            >
              {/* 헤더 (클릭 가능) */}
              <button
                type="button"
                onClick={() => toggleExpand(record.id)}
                className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors text-left"
              >
                <div className="flex-1">
                  <h3 className="text-base font-bold text-gray-900 mb-1">
                    {dateRange} ({record.dailyExpenses.length}일)
                  </h3>
                  <p className="text-sm text-gray-600 line-clamp-1">
                    {record.practice}
                  </p>
                </div>
                <div className="flex items-center gap-3 ml-4">
                  <span className="text-sm text-green-600 font-semibold">
                    {totalExpense.toLocaleString()}원
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
                  {/* 자산관리 상세 정보 */}
                  <div className="space-y-4">
                    {/* 날짜별 소비 기록 */}
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-3">
                        소비 기록
                      </h4>

                      {record.dailyExpenses.map((daily, idx) => {
                        const necessaryExpenses = daily.expenses.filter(
                          (e) => e.type === "necessary",
                        );
                        const emotionalExpenses = daily.expenses.filter(
                          (e) => e.type === "emotional",
                        );

                        const totalNecessary = necessaryExpenses.reduce(
                          (sum, e) => sum + e.amount,
                          0,
                        );
                        const totalEmotional = emotionalExpenses.reduce(
                          (sum, e) => sum + e.amount,
                          0,
                        );
                        const dailyTotal = totalNecessary + totalEmotional;

                        return (
                          <div
                            key={idx}
                            className="mb-4 last:mb-0 bg-gray-50 rounded-xl p-4 border border-gray-200"
                          >
                            <h5 className="text-sm font-bold text-gray-800 mb-3">
                              📅 {formatDateToDisplay(daily.date)}
                            </h5>

                            {/* 필요소비 */}
                            {necessaryExpenses.length > 0 && (
                              <div className="mb-3">
                                <h6 className="text-xs font-semibold text-blue-700 mb-2">
                                  필요소비
                                </h6>
                                <div className="bg-blue-50 rounded-lg p-2 border border-blue-100 space-y-1">
                                  {necessaryExpenses.map((expense) => (
                                    <div
                                      key={expense.id}
                                      className="flex items-center justify-between text-sm"
                                    >
                                      <span className="text-gray-700">
                                        {expense.name}
                                      </span>
                                      <span className="font-semibold text-blue-600">
                                        {expense.amount.toLocaleString()}원
                                      </span>
                                    </div>
                                  ))}
                                  <div className="flex justify-end pt-1 border-t border-blue-200 mt-1">
                                    <span className="text-xs font-bold text-blue-700">
                                      소계: {totalNecessary.toLocaleString()}원
                                    </span>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* 감정소비 */}
                            {emotionalExpenses.length > 0 && (
                              <div className="mb-3">
                                <h6 className="text-xs font-semibold text-red-700 mb-2">
                                  감정소비
                                </h6>
                                <div className="bg-red-50 rounded-lg p-2 border border-red-100 space-y-1">
                                  {emotionalExpenses.map((expense) => (
                                    <div
                                      key={expense.id}
                                      className="flex items-center justify-between text-sm"
                                    >
                                      <span className="text-gray-700">
                                        {expense.name}
                                      </span>
                                      <span className="font-semibold text-red-600">
                                        {expense.amount.toLocaleString()}원
                                      </span>
                                    </div>
                                  ))}
                                  <div className="flex justify-end pt-1 border-t border-red-200 mt-1">
                                    <span className="text-xs font-bold text-red-700">
                                      소계: {totalEmotional.toLocaleString()}원
                                    </span>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* 일일 합계 */}
                            <div className="bg-white rounded-lg p-2 border border-green-200">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-gray-700">
                                  이날 합계
                                </span>
                                <span className="text-base font-bold text-green-600">
                                  {dailyTotal.toLocaleString()}원
                                </span>
                              </div>

                              {/* 비율 시각화 */}
                              {dailyTotal > 0 && (
                                <div className="mt-2">
                                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden flex">
                                    {totalNecessary > 0 && (
                                      <div
                                        className="h-full bg-blue-400 transition-all duration-300"
                                        style={{
                                          width: `${(totalNecessary / dailyTotal) * 100}%`,
                                        }}
                                      />
                                    )}
                                    {totalEmotional > 0 && (
                                      <div
                                        className="h-full bg-red-400 transition-all duration-300"
                                        style={{
                                          width: `${(totalEmotional / dailyTotal) * 100}%`,
                                        }}
                                      />
                                    )}
                                  </div>
                                  <div className="flex items-center justify-between text-xs mt-1">
                                    <span className="text-blue-600">
                                      필요{" "}
                                      {Math.round(
                                        (totalNecessary / dailyTotal) * 100,
                                      )}
                                      %
                                    </span>
                                    <span className="text-red-600">
                                      감정{" "}
                                      {Math.round(
                                        (totalEmotional / dailyTotal) * 100,
                                      )}
                                      %
                                    </span>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}

                      {/* 전체 합계 */}
                      {record.dailyExpenses.length > 1 && (
                        <div className="bg-green-50 rounded-xl p-3 border-2 border-green-300 mt-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold text-gray-700">
                              전체 총 소비
                            </span>
                            <span className="text-xl font-bold text-green-600">
                              {totalExpense.toLocaleString()}원
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* 오늘의 자산관리 공부 내용 */}
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">
                        오늘의 자산관리 공부 내용
                      </h4>
                      <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                        <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                          {record.studyContent}
                        </p>
                      </div>
                    </div>

                    {/* 오늘의 실천 (or 다짐) */}
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">
                        오늘의 실천
                      </h4>
                      <div className="bg-green-50 rounded-xl p-4 border border-green-100">
                        <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                          {record.practice}
                        </p>
                      </div>
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
