// 자산관리 리추얼 관련 타입 정의

// 소비 유형
export type ExpenseType = "emotional" | "necessary";

// 소비 항목
export interface ExpenseItem {
  id: string;
  name: string; // 품목명
  amount: number; // 금액
  type: ExpenseType; // 감정소비/필요소비
}

// 하루의 소비 기록
export interface DailyExpense {
  date: string; // 날짜
  expenses: ExpenseItem[]; // 그 날의 소비 항목들
}

// 자산관리 기록
export interface FinanceRecord {
  id: number;
  dailyExpenses: DailyExpense[]; // 여러 날짜의 소비 기록
  studyContent: string; // 오늘의 자산관리 공부 내용
  practice: string; // 오늘의 실천 (or 다짐)
}

export interface FinanceContainerProps {
  onBackToTimer?: () => void;
  onBackToHome?: () => void;
}

export interface FinanceFormData {
  dailyExpenses: DailyExpense[];
  studyContent: string;
  practice: string;
}

export interface AddNewFinanceProps {
  onCancel: () => void;
  onBackToHome?: () => void;
  onSubmit?: (recordData: FinanceFormData) => void;
}

export interface RecordFinanceProps {
  financeRecords: FinanceRecord[];
}
