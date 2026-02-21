"use client";

import { useState } from "react";
import { Wallet } from "lucide-react";
import RecordFinance from "./RecordFinance";
import AddNewFinance from "./AddNewFinance";
import { FinanceRecord, FinanceContainerProps } from "@/types/routines/finance";

export default function FinanceContainer({
  onBackToTimer,
  onBackToHome,
}: FinanceContainerProps) {
  const [showAddRecord, setShowAddRecord] = useState(false);

  // 자산관리 리추얼 기록 데이터
  const financeRecords: FinanceRecord[] = [
    {
      id: 1,
      dailyExpenses: [
        {
          date: "2024-02-21",
          expenses: [
            { id: "1", name: "점심 식사", amount: 12000, type: "necessary" },
            { id: "2", name: "카페", amount: 5500, type: "emotional" },
            { id: "3", name: "저녁 회식", amount: 35000, type: "necessary" },
          ],
        },
      ],
      studyContent: `나스닥100 ETF : 기술혁신기업 100개
> 기술주 비중 5-60%, 성장주/빅테크 집중
> 단점: S&P500에 비해서는 높은 변동성, 기술주는 금리에 민감`,
      practice: `1. 이번주 소비 10만원 이내로 !
2. 토스증권계좌 내일 일어나자마자 한투 ISA로 옮기기`,
    },
    {
      id: 2,
      dailyExpenses: [
        {
          date: "2024-02-19",
          expenses: [
            { id: "4", name: "점심 식사", amount: 9000, type: "necessary" },
            { id: "5", name: "커피", amount: 4500, type: "emotional" },
          ],
        },
        {
          date: "2024-02-20",
          expenses: [
            { id: "6", name: "아침 식사", amount: 8000, type: "necessary" },
            { id: "7", name: "택시비", amount: 15000, type: "necessary" },
            { id: "8", name: "간식", amount: 4500, type: "emotional" },
          ],
        },
      ],
      studyContent: `주식과 펀드의 차이
- 주식: 기업의 소유권을 나누어 가진 것, 높은 수익과 높은 위험
- 펀드: 여러 투자자의 돈을 모아 전문가가 운용, 분산 투자로 위험 감소`,
      practice: `점심 도시락 싸가기 일주일에 3번 이상`,
    },
  ];

  // 이번 달 통계 계산
  const recordCount = financeRecords.length;

  // 전체 소비 금액 계산
  const totalMonthlyExpense = financeRecords.reduce((sum, record) => {
    const recordTotal = record.dailyExpenses.reduce((dailySum, daily) => {
      return (
        dailySum +
        daily.expenses.reduce((expSum, exp) => expSum + exp.amount, 0)
      );
    }, 0);
    return sum + recordTotal;
  }, 0);

  // 필요소비 총합
  const totalNecessaryExpense = financeRecords.reduce((sum, record) => {
    const necessaryTotal = record.dailyExpenses.reduce((dailySum, daily) => {
      return (
        dailySum +
        daily.expenses
          .filter((e) => e.type === "necessary")
          .reduce((expSum, exp) => expSum + exp.amount, 0)
      );
    }, 0);
    return sum + necessaryTotal;
  }, 0);

  // 감정소비 총합
  const totalEmotionalExpense = financeRecords.reduce((sum, record) => {
    const emotionalTotal = record.dailyExpenses.reduce((dailySum, daily) => {
      return (
        dailySum +
        daily.expenses
          .filter((e) => e.type === "emotional")
          .reduce((expSum, exp) => expSum + exp.amount, 0)
      );
    }, 0);
    return sum + emotionalTotal;
  }, 0);

  const renderContent = () => {
    // 새 기록 추가하기 화면
    if (showAddRecord) {
      return (
        <AddNewFinance
          onCancel={() => setShowAddRecord(false)}
          onBackToHome={onBackToHome}
        />
      );
    }

    // 메인 화면
    return (
      <>
        {/* 뒤로가기 버튼 및 x버튼 */}
        <div className="flex items-center justify-end mb-2">
          <button
            type="button"
            onClick={onBackToHome}
            className="flex items-center justify-center w-8 h-8 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
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
        <div className="mb-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold text-gray-900">자산관리 리추얼</h1>
            <button
              type="button"
              onClick={() => setShowAddRecord(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-orange-500 hover:text-orange-600 transition-colors"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              기록 추가
            </button>
          </div>

          {/* 이번 달 통계 */}
          <div className="bg-white rounded-2xl border border-gray-200 p-4 mb-3">
            <div className="flex items-center gap-2 text-gray-600 mb-3">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              <span className="text-sm font-semibold">이번 달 소비 현황</span>
            </div>

            {/* 기록한 날 */}
            <div className="mb-3">
              <div className="text-3xl font-bold text-gray-900">
                {recordCount}일
              </div>
              <div className="text-sm text-gray-500">기록한 날</div>
            </div>

            {/* 누적 소비 금액 */}
            <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-4 mb-3 border border-green-200">
              <div className="text-sm text-green-700 mb-1">누적 소비</div>
              <div className="text-3xl font-bold text-green-600">
                {totalMonthlyExpense.toLocaleString()}원
              </div>
            </div>

            {/* 필요소비 / 감정소비 분석 */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                <div className="text-xs text-blue-700 mb-1">필요소비</div>
                <div className="text-xl font-bold text-blue-600">
                  {totalNecessaryExpense.toLocaleString()}원
                </div>
                <div className="text-xs text-blue-600 mt-1">
                  {totalMonthlyExpense > 0
                    ? `${Math.round((totalNecessaryExpense / totalMonthlyExpense) * 100)}%`
                    : "0%"}
                </div>
              </div>

              <div className="bg-red-50 rounded-xl p-4 border border-red-200">
                <div className="text-xs text-red-700 mb-1">감정소비</div>
                <div className="text-xl font-bold text-red-600">
                  {totalEmotionalExpense.toLocaleString()}원
                </div>
                <div className="text-xs text-red-600 mt-1">
                  {totalMonthlyExpense > 0
                    ? `${Math.round((totalEmotionalExpense / totalMonthlyExpense) * 100)}%`
                    : "0%"}
                </div>
              </div>
            </div>

            {/* 비율 시각화 */}
            {totalMonthlyExpense > 0 && (
              <div className="mt-3">
                <div className="h-3 bg-gray-200 rounded-full overflow-hidden flex">
                  <div
                    className="h-full bg-blue-400 transition-all duration-300"
                    style={{
                      width: `${(totalNecessaryExpense / totalMonthlyExpense) * 100}%`,
                    }}
                  />
                  <div
                    className="h-full bg-red-400 transition-all duration-300"
                    style={{
                      width: `${(totalEmotionalExpense / totalMonthlyExpense) * 100}%`,
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 자산관리 기록 섹션 */}
        <RecordFinance financeRecords={financeRecords} />
      </>
    );
  };

  return (
    <div className="w-full max-w-3xl mx-auto scale-[0.8] origin-top">
      {renderContent()}
    </div>
  );
}
