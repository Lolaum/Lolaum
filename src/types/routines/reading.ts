// 독서 관련 타입 정의

export interface Book {
  id: number;
  title: string;
  author: string;
  trackingType: "page" | "percent";
  currentPage: number; // page: 현재 페이지 / percent: 현재 % (0-100)
  totalPages: number;  // page: 총 페이지 / percent: 항상 100
  coverImage: string;
}

export interface BookFormData {
  title: string;
  author: string;
  trackingType: "page" | "percent";
  totalPages: number;
  coverImage?: File;
}

export interface AddNewBookProps {
  onCancel: () => void;
  onBackToHome?: () => void;
  onSubmit?: (bookData: BookFormData) => void;
}

export interface BookManageProps {
  onBackToTimer?: () => void;
  onBackToHome?: () => void;
}

export interface ReadingContainerProps {
  onBackToTimer?: () => void;
  onBackToHome?: () => void;
}

export interface ReadingRecord {
  date: string; // YYYY-MM-DD
  bookCover: string;
  bookTitle: string;
}

export interface BookCalendarProps {
  onBack?: () => void;
  onBookSelect?: (bookTitle: string) => void;
}

export type ViewMode = "grid" | "list";

export type NoteType = "sentence" | "summary";

export interface DailyReadingRecord {
  id: number;
  date: string; // YYYY-MM-DD
  trackingType: "page" | "percent";
  startValue: number;     // page: 시작 페이지 / percent: 시작 %
  endValue: number;       // page: 끝 페이지 / percent: 끝 %
  progressAmount: number; // page: 읽은 페이지 수 / percent: 진행한 %
  noteType: NoteType;
  note: string;
  thoughts?: string;      // 나만의 생각 (선택)
}

export interface BookDetailProps {
  book: Book;
  onBack: () => void;
  onBackToHome?: () => void;
}
