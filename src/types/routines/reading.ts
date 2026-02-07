// 독서 관련 타입 정의

export interface Book {
  id: number;
  title: string;
  author: string;
  currentPage: number;
  totalPages: number;
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
  onSubmit?: (bookData: BookFormData) => void;
}

export interface BookManageProps {
  onBackToTimer?: () => void;
}

export interface ReadingContainerProps {
  onBackToTimer?: () => void;
}

export interface ReadingRecord {
  date: string; // YYYY-MM-DD
  bookCover: string;
  bookTitle: string;
}

export interface BookCalendarProps {
  onBack?: () => void;
}

export type ViewMode = "grid" | "list";
