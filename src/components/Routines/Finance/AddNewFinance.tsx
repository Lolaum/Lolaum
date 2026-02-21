"use client";

import { useState, useRef, useEffect } from "react";
import { Plus, X, Calendar as CalendarIcon } from "lucide-react";
import {
  AddNewFinanceProps,
  FinanceFormData,
  ExpenseItem,
  DailyExpense,
} from "@/types/routines/finance";

interface DailyExpenseState extends DailyExpense {
  id: string; // UI에서 관리하기 위한 임시 ID
}

export default function AddNewFinance({
  onCancel,
  onBackToHome,
  onSubmit,
}: AddNewFinanceProps) {
  const [dailyExpenses, setDailyExpenses] = useState<DailyExpenseState[]>([
    { id: Date.now().toString(), date: "", expenses: [] },
  ]);
  const [studyContent, setStudyContent] = useState("");
  const [practice, setPractice] = useState("");
  const [showCalendar, setShowCalendar] = useState<string | null>(null); // 어떤 날짜 섹션의 캘린더를 보여줄지
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const calendarRef = useRef<HTMLDivElement>(null);

  // 각 날짜별 임시 입력 상태 (필요소비)
  const [necessaryInputs, setNecessaryInputs] = useState<
    Record<string, { name: string; amount: string }>
  >({});

  // 각 날짜별 임시 입력 상태 (감정소비)
  const [emotionalInputs, setEmotionalInputs] = useState<
    Record<string, { name: string; amount: string }>
  >({});

  // 캘린더 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        calendarRef.current &&
        !calendarRef.current.contains(event.target as Node)
      ) {
        setShowCalendar(null);
      }
    };

    if (showCalendar) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showCalendar]);

  // 캘린더 유틸 함수들
  const getMonthDates = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const dates: (Date | null)[] = [];

    for (let i = 0; i < firstDay.getDay(); i++) {
      dates.push(null);
    }

    for (let i = 1; i <= lastDay.getDate(); i++) {
      dates.push(new Date(year, month, i));
    }

    return dates;
  };

  const formatDateToString = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const formatDateToDisplay = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;
  };

  const handleDateSelect = (dailyId: string, selectedDate: Date) => {
    setDailyExpenses((prev) =>
      prev.map((daily) =>
        daily.id === dailyId
          ? { ...daily, date: formatDateToString(selectedDate) }
          : daily,
      ),
    );
    setShowCalendar(null);
  };

  const handlePrevMonth = () => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() - 1);
    setCurrentMonth(newMonth);
  };

  const handleNextMonth = () => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() + 1);
    setCurrentMonth(newMonth);
  };

  const isToday = (date: Date | null) => {
    if (!date) return false;
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isSelected = (checkDate: Date | null, dailyId: string) => {
    if (!checkDate) return false;
    const daily = dailyExpenses.find((d) => d.id === dailyId);
    if (!daily || !daily.date) return false;
    return formatDateToString(checkDate) === daily.date;
  };

  const isCurrentMonth = (checkDate: Date | null) => {
    if (!checkDate) return false;
    return checkDate.getMonth() === currentMonth.getMonth();
  };

  const monthDates = getMonthDates(currentMonth);
  const DAYS = ["일", "월", "화", "수", "목", "금", "토"];

  // 날짜 섹션 추가
  const addDailyExpense = () => {
    const newDaily: DailyExpenseState = {
      id: Date.now().toString(),
      date: "",
      expenses: [],
    };
    setDailyExpenses([...dailyExpenses, newDaily]);
  };

  // 날짜 섹션 삭제
  const removeDailyExpense = (dailyId: string) => {
    if (dailyExpenses.length === 1) return; // 최소 1개는 유지
    setDailyExpenses(dailyExpenses.filter((d) => d.id !== dailyId));
    // 해당 날짜의 입력 상태도 제거
    const newNecessary = { ...necessaryInputs };
    const newEmotional = { ...emotionalInputs };
    delete newNecessary[dailyId];
    delete newEmotional[dailyId];
    setNecessaryInputs(newNecessary);
    setEmotionalInputs(newEmotional);
  };

  // 필요소비 추가
  const addNecessaryExpense = (dailyId: string) => {
    const input = necessaryInputs[dailyId];
    if (!input || !input.name.trim() || !input.amount) return;

    const newExpense: ExpenseItem = {
      id: Date.now().toString(),
      name: input.name.trim(),
      amount: parseInt(input.amount),
      type: "necessary",
    };

    setDailyExpenses((prev) =>
      prev.map((daily) =>
        daily.id === dailyId
          ? { ...daily, expenses: [...daily.expenses, newExpense] }
          : daily,
      ),
    );

    // 입력 초기화
    setNecessaryInputs({ ...necessaryInputs, [dailyId]: { name: "", amount: "" } });
  };

  // 감정소비 추가
  const addEmotionalExpense = (dailyId: string) => {
    const input = emotionalInputs[dailyId];
    if (!input || !input.name.trim() || !input.amount) return;

    const newExpense: ExpenseItem = {
      id: Date.now().toString(),
      name: input.name.trim(),
      amount: parseInt(input.amount),
      type: "emotional",
    };

    setDailyExpenses((prev) =>
      prev.map((daily) =>
        daily.id === dailyId
          ? { ...daily, expenses: [...daily.expenses, newExpense] }
          : daily,
      ),
    );

    // 입력 초기화
    setEmotionalInputs({ ...emotionalInputs, [dailyId]: { name: "", amount: "" } });
  };

  // 소비 항목 제거
  const removeExpense = (dailyId: string, expenseId: string) => {
    setDailyExpenses((prev) =>
      prev.map((daily) =>
        daily.id === dailyId
          ? {
              ...daily,
              expenses: daily.expenses.filter((e) => e.id !== expenseId),
            }
          : daily,
      ),
    );
  };

  // 제출
  const handleSubmit = () => {
    // 유효성 검사
    const hasEmptyDate = dailyExpenses.some((d) => !d.date);
    const hasNoExpenses = dailyExpenses.every((d) => d.expenses.length === 0);

    if (hasEmptyDate || hasNoExpenses || !studyContent.trim() || !practice.trim()) {
      return;
    }

    const formData: FinanceFormData = {
      dailyExpenses: dailyExpenses.map(({ id, ...rest }) => rest),
      studyContent: studyContent.trim(),
      practice: practice.trim(),
    };

    onSubmit?.(formData);
    onCancel();
  };

  // 총액 계산
  const getTotalExpense = () => {
    return dailyExpenses.reduce((sum, daily) => {
      return (
        sum + daily.expenses.reduce((expSum, exp) => expSum + exp.amount, 0)
      );
    }, 0);
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      {/* 백 네비게이션 및 x버튼 */}
      <div className="flex items-center justify-between mb-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
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
              d="M15 19l-7-7 7-7"
            />
          </svg>
          <span className="text-sm">자산관리 리추얼로 돌아가기</span>
        </button>
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

      {/* 메인 카드 */}
      <div className="max-w-2xl bg-white rounded-2xl border border-gray-200 p-4 mx-auto">
        {/* 헤더 */}
        <h2 className="text-xl font-bold text-gray-900 mb-4">자산관리 기록</h2>

        {/* 날짜별 섹션들 */}
        <div className="mb-4 space-y-4">
          {dailyExpenses.map((daily, index) => {
            const necessaryExpenses = daily.expenses.filter(
              (e) => e.type === "necessary",
            );
            const emotionalExpenses = daily.expenses.filter(
              (e) => e.type === "emotional",
            );
            const dailyTotal = daily.expenses.reduce(
              (sum, e) => sum + e.amount,
              0,
            );

            return (
              <div
                key={daily.id}
                className="border-2 border-gray-200 rounded-2xl p-4 bg-gray-50"
              >
                {/* 날짜 섹션 헤더 */}
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900">
                    📅 {index + 1}일차
                  </h3>
                  {dailyExpenses.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeDailyExpense(daily.id)}
                      className="text-red-600 hover:text-red-700 text-sm font-medium"
                    >
                      삭제
                    </button>
                  )}
                </div>

                {/* 날짜 선택 */}
                <div className="mb-4 relative" ref={calendarRef}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    날짜
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setShowCalendar(showCalendar === daily.id ? null : daily.id)
                    }
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                  >
                    <span className={daily.date ? "text-gray-900" : "text-gray-400"}>
                      {daily.date ? formatDateToDisplay(daily.date) : "날짜를 선택하세요"}
                    </span>
                    <CalendarIcon className="w-5 h-5 text-gray-400" />
                  </button>

                  {/* 캘린더 드롭다운 */}
                  {showCalendar === daily.id && (
                    <div className="absolute z-50 mt-2 bg-white rounded-2xl shadow-xl border border-gray-200 p-4 w-full max-w-sm">
                      {/* 월 네비게이션 */}
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-base font-bold text-gray-900">
                          {currentMonth.getFullYear()}년{" "}
                          {currentMonth.getMonth() + 1}월
                        </h4>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={handlePrevMonth}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            <svg
                              className="w-4 h-4 text-gray-600"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 19l-7-7 7-7"
                              />
                            </svg>
                          </button>
                          <button
                            type="button"
                            onClick={handleNextMonth}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            <svg
                              className="w-4 h-4 text-gray-600"
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
                        </div>
                      </div>

                      {/* 요일 헤더 */}
                      <div className="grid grid-cols-7 gap-1 mb-2">
                        {DAYS.map((day) => (
                          <div
                            key={day}
                            className="text-center text-xs font-semibold text-gray-600 py-2"
                          >
                            {day}
                          </div>
                        ))}
                      </div>

                      {/* 날짜 그리드 */}
                      <div className="grid grid-cols-7 gap-1">
                        {monthDates.map((calDate, idx) =>
                          calDate === null ? (
                            <div key={idx} className="h-10" />
                          ) : (
                            <button
                              key={calDate.toISOString()}
                              type="button"
                              onClick={() => handleDateSelect(daily.id, calDate)}
                              className={`
                                h-10 rounded-lg transition-all text-sm
                                ${!isCurrentMonth(calDate) ? "text-gray-300" : "text-gray-700"}
                                ${
                                  isSelected(calDate, daily.id)
                                    ? "bg-green-500 text-white font-semibold"
                                    : "hover:bg-gray-100"
                                }
                                ${
                                  isToday(calDate) && !isSelected(calDate, daily.id)
                                    ? "bg-gray-100 font-medium"
                                    : ""
                                }
                              `}
                            >
                              {calDate.getDate()}
                            </button>
                          ),
                        )}
                      </div>

                      {/* 오늘 버튼 */}
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <button
                          type="button"
                          onClick={() => {
                            const today = new Date();
                            handleDateSelect(daily.id, today);
                            setCurrentMonth(today);
                          }}
                          className="w-full py-2 text-sm text-green-600 hover:text-green-700 font-medium transition-colors"
                        >
                          오늘
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* 필요소비 */}
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-blue-700 mb-2">
                    필요소비
                  </h4>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={necessaryInputs[daily.id]?.name || ""}
                      onChange={(e) =>
                        setNecessaryInputs({
                          ...necessaryInputs,
                          [daily.id]: {
                            ...necessaryInputs[daily.id],
                            name: e.target.value,
                          },
                        })
                      }
                      placeholder="품목명"
                      className="flex-1 px-3 py-2 bg-white border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"
                      onKeyPress={(e) =>
                        e.key === "Enter" && addNecessaryExpense(daily.id)
                      }
                    />
                    <input
                      type="number"
                      value={necessaryInputs[daily.id]?.amount || ""}
                      onChange={(e) =>
                        setNecessaryInputs({
                          ...necessaryInputs,
                          [daily.id]: {
                            ...necessaryInputs[daily.id],
                            amount: e.target.value,
                          },
                        })
                      }
                      placeholder="금액"
                      className="w-24 px-3 py-2 bg-white border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"
                      onKeyPress={(e) =>
                        e.key === "Enter" && addNecessaryExpense(daily.id)
                      }
                    />
                    <button
                      type="button"
                      onClick={() => addNecessaryExpense(daily.id)}
                      className="w-10 h-10 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  {necessaryExpenses.length > 0 && (
                    <div className="space-y-1">
                      {necessaryExpenses.map((exp) => (
                        <div
                          key={exp.id}
                          className="flex items-center justify-between bg-white rounded-lg p-2 text-sm"
                        >
                          <span className="text-gray-700">{exp.name}</span>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-blue-600">
                              {exp.amount.toLocaleString()}원
                            </span>
                            <button
                              type="button"
                              onClick={() => removeExpense(daily.id, exp.id)}
                              className="w-5 h-5 bg-red-100 text-red-600 rounded-full hover:bg-red-200 transition-colors flex items-center justify-center"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 감정소비 */}
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-red-700 mb-2">
                    감정소비
                  </h4>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={emotionalInputs[daily.id]?.name || ""}
                      onChange={(e) =>
                        setEmotionalInputs({
                          ...emotionalInputs,
                          [daily.id]: {
                            ...emotionalInputs[daily.id],
                            name: e.target.value,
                          },
                        })
                      }
                      placeholder="품목명"
                      className="flex-1 px-3 py-2 bg-white border border-red-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400 text-sm"
                      onKeyPress={(e) =>
                        e.key === "Enter" && addEmotionalExpense(daily.id)
                      }
                    />
                    <input
                      type="number"
                      value={emotionalInputs[daily.id]?.amount || ""}
                      onChange={(e) =>
                        setEmotionalInputs({
                          ...emotionalInputs,
                          [daily.id]: {
                            ...emotionalInputs[daily.id],
                            amount: e.target.value,
                          },
                        })
                      }
                      placeholder="금액"
                      className="w-24 px-3 py-2 bg-white border border-red-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400 text-sm"
                      onKeyPress={(e) =>
                        e.key === "Enter" && addEmotionalExpense(daily.id)
                      }
                    />
                    <button
                      type="button"
                      onClick={() => addEmotionalExpense(daily.id)}
                      className="w-10 h-10 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center justify-center"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  {emotionalExpenses.length > 0 && (
                    <div className="space-y-1">
                      {emotionalExpenses.map((exp) => (
                        <div
                          key={exp.id}
                          className="flex items-center justify-between bg-white rounded-lg p-2 text-sm"
                        >
                          <span className="text-gray-700">{exp.name}</span>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-red-600">
                              {exp.amount.toLocaleString()}원
                            </span>
                            <button
                              type="button"
                              onClick={() => removeExpense(daily.id, exp.id)}
                              className="w-5 h-5 bg-red-100 text-red-600 rounded-full hover:bg-red-200 transition-colors flex items-center justify-center"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 일일 합계 */}
                {dailyTotal > 0 && (
                  <div className="bg-white rounded-lg p-3 border border-green-200">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">
                        이날 합계
                      </span>
                      <span className="text-lg font-bold text-green-600">
                        {dailyTotal.toLocaleString()}원
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* 날짜 추가 버튼 */}
          <button
            type="button"
            onClick={addDailyExpense}
            className="w-full py-4 border-2 border-dashed border-gray-300 rounded-2xl text-gray-600 hover:border-green-500 hover:text-green-600 transition-colors flex items-center justify-center gap-2 font-medium"
          >
            <Plus className="w-5 h-5" />+ 날짜 추가
          </button>
        </div>

        {/* 전체 총 소비 금액 */}
        {getTotalExpense() > 0 && (
          <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-4 border-2 border-green-300 mb-6">
            <div className="flex items-center justify-between">
              <span className="text-base font-semibold text-gray-700">
                전체 총 소비
              </span>
              <span className="text-2xl font-bold text-green-600">
                {getTotalExpense().toLocaleString()}원
              </span>
            </div>
          </div>
        )}

        {/* 오늘의 자산관리 공부 내용 */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            오늘의 자산관리 공부 내용
          </label>
          <textarea
            value={studyContent}
            onChange={(e) => setStudyContent(e.target.value)}
            placeholder="오늘 배운 자산관리 내용을 적어보세요"
            rows={6}
            className="w-full px-4 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 placeholder-gray-400 resize-none"
          />
        </div>

        {/* 오늘의 실천 (or 다짐) */}
        <div className="mb-8">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            오늘의 실천 (or 다짐)
          </label>
          <textarea
            value={practice}
            onChange={(e) => setPractice(e.target.value)}
            placeholder="오늘 실천할 자산관리 행동이나 다짐을 적어보세요"
            rows={4}
            className="w-full px-4 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 placeholder-gray-400 resize-none"
          />
        </div>

        {/* 버튼 */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={
              dailyExpenses.some((d) => !d.date) ||
              dailyExpenses.every((d) => d.expenses.length === 0) ||
              !studyContent.trim() ||
              !practice.trim()
            }
            className="flex-1 py-4 px-4 rounded-xl bg-green-500 text-white font-medium hover:bg-green-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            기록 추가하기
          </button>
        </div>
      </div>
    </div>
  );
}
