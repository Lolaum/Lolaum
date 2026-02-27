// 언어 학습 관련 타입 정의

export interface LanguageRecord {
  id: number;
  date: string;
  images?: string[];
  achievement: string;
  expressions: { word: string; meaning: string; example: string }[];
  expressionCount: number;
}

export interface LanguageContainerProps {
  onBackToTimer?: () => void;
  onBackToHome?: () => void;
  languageType?: "영어" | "제2외국어";
}

export interface LanguageFormData {
  images: string[];
  achievement: string;
  expressions: { word: string; meaning: string; example: string }[];
}

export interface AddNewLanguageProps {
  onCancel: () => void;
  onBackToHome?: () => void;
  onSubmit?: (recordData: LanguageFormData) => void;
}

export interface Expression {
  id: number;
  word: string;
  meaning: string;
  example: string;
}
