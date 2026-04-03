"use client";

import { useState, useEffect, useCallback } from "react";
import { Wallet, Loader2 } from "lucide-react";
import RecordFinance from "./RecordFinance";
import AddNewFinance from "./AddNewFinance";
import { FinanceRecord, FinanceContainerProps, FinanceFormData } from "@/types/routines/finance";
import { createRitualRecordAuto, getMyRitualRecords } from "@/actions/ritual-record";
import type { FinanceRecordData, Json } from "@/types/supabase";

export default function FinanceContainer({
  onBackToTimer,
  onBackToHome,
  certificationPhotos,
}: FinanceContainerProps) {
  const [showAddRecord, setShowAddRecord] = useState(!!certificationPhotos?.length);
  const [financeRecords, setFinanceRecords] = useState<FinanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    const { data } = await getMyRitualRecords({ routineType: "finance" });
    if (data) {
      const records: FinanceRecord[] = data.map((r) => {
        const d = r.record_data as unknown as FinanceRecordData;
        return {
          id: r.id as unknown as number,
          dailyExpenses: d.dailyExpenses ?? [],
          studyContent: d.studyContent ?? "",
          practice: d.practice ?? "",
        };
      });
      setFinanceRecords(records);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const handleSubmit = async (formData: FinanceFormData) => {
    const today = new Date().toISOString().split("T")[0];
    const recordData: FinanceRecordData = {
      dailyExpenses: formData.dailyExpenses,
      studyContent: formData.studyContent,
      practice: formData.practice,
    };
    const { error } = await createRitualRecordAuto({
      routineType: "finance",
      recordDate: today,
      recordData: recordData as unknown as Json,
    });
    if (error) {
      alert(`기록 저장 실패: ${error}`);
      return;
    }
    setShowAddRecord(false);
    fetchRecords();
  };

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
          onSubmit={handleSubmit}
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

        {/* 헤더 */}
        <div className="rounded-2xl bg-white shadow-sm border border-gray-100 p-4 mb-4">
          <p className="text-xs text-gray-400 font-medium mb-0.5">자산관리 리추얼</p>
          <div className="flex items-baseline gap-1.5 mb-4">
            <h1 className="text-lg font-bold text-gray-900">이번 달 소비 현황</h1>
            <span className="text-base font-bold text-gray-900 ml-auto">
              {totalMonthlyExpense.toLocaleString()}
              <span className="text-sm font-medium text-gray-400 ml-0.5">원</span>
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2 mb-3">
            <div className="bg-emerald-50 rounded-xl p-3 text-center">
              <p className="text-lg font-bold text-gray-900">{recordCount}</p>
              <p className="text-xs text-gray-400 mt-0.5">기록한 날</p>
            </div>
            <div className="bg-emerald-50 rounded-xl p-3 text-center">
              <p className="text-lg font-bold text-gray-900">{necessaryPct}%</p>
              <p className="text-xs text-gray-400 mt-0.5">필요소비</p>
            </div>
            <div className="bg-emerald-50 rounded-xl p-3 text-center">
              <p className="text-lg font-bold text-gray-900">{emotionalPct}%</p>
              <p className="text-xs text-gray-400 mt-0.5">감성소비</p>
            </div>
          </div>
          {/* 비율 바 */}
          {totalMonthlyExpense > 0 && (
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden flex">
              <div className="h-full bg-emerald-400 transition-all" style={{ width: `${necessaryPct}%` }} />
              <div className="h-full bg-orange-300 transition-all" style={{ width: `${emotionalPct}%` }} />
            </div>
          )}
        </div>

        {/* 기록 추가 버튼 */}
        <div className="mb-4">
          <button
            type="button"
            onClick={() => setShowAddRecord(true)}
            className="w-full py-3 rounded-2xl text-sm font-bold text-white shadow-sm transition-all hover:shadow-md active:scale-[0.98]"
            style={{ backgroundColor: "#10b981" }}
          >
            + 오늘 소비 기록하기
          </button>
        </div>

        {/* 자산관리 기록 섹션 */}
        {loading ? (
          <div className="text-center py-8 text-gray-400">
            <Loader2 size={20} className="animate-spin mx-auto mb-2" />
            <p className="text-xs">기록을 불러오는 중...</p>
          </div>
        ) : (
          <RecordFinance financeRecords={financeRecords} />
        )}
      </>
    );
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-4">
      {renderContent()}
    </div>
  );
}
