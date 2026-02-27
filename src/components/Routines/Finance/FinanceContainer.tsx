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
    const necessaryPct = totalMonthlyExpense > 0
      ? Math.round((totalNecessaryExpense / totalMonthlyExpense) * 100) : 0;
    const emotionalPct = totalMonthlyExpense > 0
      ? Math.round((totalEmotionalExpense / totalMonthlyExpense) * 100) : 0;

    return (
      <>
        {/* 네비게이션 */}
        <div className="flex items-center justify-end mb-4">
          <button
            type="button"
            onClick={onBackToHome}
            className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 히어로 헤더 */}
        <div
          className="rounded-3xl p-5 mb-5 text-white relative overflow-hidden"
          style={{ background: "linear-gradient(135deg, #059669 0%, #10b981 60%, #34d399 100%)" }}
        >
          <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/10" />
          <div className="absolute -bottom-4 -left-4 w-16 h-16 rounded-full bg-white/10" />
          <div className="relative">
            <p className="text-white/70 text-xs font-medium mb-1">자산관리 리추얼</p>
            <h1 className="text-xl font-bold mb-1">💰 이번 달 소비 현황</h1>
            <p className="text-2xl font-bold mb-4">
              {totalMonthlyExpense.toLocaleString()}
              <span className="text-sm font-medium ml-1 text-white/80">원</span>
            </p>
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-white/20 rounded-2xl p-3 text-center backdrop-blur-sm">
                <p className="text-lg font-bold">{recordCount}</p>
                <p className="text-white/75 text-xs mt-0.5">기록한 날</p>
              </div>
              <div className="bg-white/20 rounded-2xl p-3 text-center backdrop-blur-sm">
                <p className="text-lg font-bold">{necessaryPct}%</p>
                <p className="text-white/75 text-xs mt-0.5">필요소비</p>
              </div>
              <div className="bg-white/20 rounded-2xl p-3 text-center backdrop-blur-sm">
                <p className="text-lg font-bold">{emotionalPct}%</p>
                <p className="text-white/75 text-xs mt-0.5">감성소비</p>
              </div>
            </div>
            {/* 비율 바 */}
            {totalMonthlyExpense > 0 && (
              <div className="h-2 bg-white/20 rounded-full overflow-hidden flex mt-3">
                <div className="h-full bg-white/70 transition-all" style={{ width: `${necessaryPct}%` }} />
                <div className="h-full bg-orange-300/80 transition-all" style={{ width: `${emotionalPct}%` }} />
              </div>
            )}
          </div>
        </div>

        {/* 기록 추가 버튼 */}
        <div className="mb-4">
          <button
            type="button"
            onClick={() => setShowAddRecord(true)}
            className="w-full py-3 rounded-2xl text-sm font-bold text-white shadow-sm transition-all hover:shadow-md active:scale-[0.98]"
            style={{ background: "linear-gradient(135deg, #059669 0%, #10b981 100%)" }}
          >
            + 오늘 소비 기록하기
          </button>
        </div>

        {/* 자산관리 기록 섹션 */}
        <RecordFinance financeRecords={financeRecords} />
      </>
    );
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-4">
      {renderContent()}
    </div>
  );
}
