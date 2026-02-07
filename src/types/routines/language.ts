// 언어 학습 관련 타입 정의

export interface LanguageRecord {
  id: number;
  date: string;
  word: string;
  meanings: string[];
  examples?: string[];
  expressionCount: number;
}

export interface LanguageContainerProps {
  onBackToTimer?: () => void;
}

export interface LanguageFormData {
  word: string;
  meanings: string[];
  examples: string[];
}

export interface AddNewLanguageProps {
  onCancel: () => void;
  onSubmit?: (recordData: LanguageFormData) => void;
}

export interface Expression {
  id: number;
  text: string;
}
