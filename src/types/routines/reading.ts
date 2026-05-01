// 독서 관련 타입 정의

export interface Book {
  id: string;
  title: string;
  author: string;
  trackingType: "page" | "percent";
  currentValue: number; // page: 현재 페이지 / percent: 현재 % (0-100)
  totalValue: number;   // page: 총 페이지 / percent: 항상 100
  coverImageUrl: string | null;
  isCompleted: boolean;
  updatedAt: string;    // ISO date string
}

export interface BookFormData {
  title: string;
  author: string;
  trackingType: "page" | "percent";
  totalPages: number;
}

export interface AddNewBookProps {
  onCancel: () => void;
  onBackToHome?: () => void;
  onSubmit?: (bookData: BookFormData) => void | Promise<void>;
  isEnglishBook?: boolean;
}

export interface BookManageProps {
  onBackToTimer?: () => void;
  onBackToHome?: () => void;
  isEnglishBook?: boolean;
  certificationPhotos?: string[];
}

export interface ReadingContainerProps {
  onBackToTimer?: () => void;
  onBackToHome?: () => void;
  certificationPhotos?: string[]; // [시작 인증 사진, 종료 인증 사진]
  isEnglishBook?: boolean;        // 영어원서리추얼 여부
}

export interface ReadingRecord {
  date: string; // YYYY-MM-DD
  bookCover: string;
  bookTitle: string;
}

export interface CompletedBook {
  id: string;
  title: string;
  coverImageUrl: string | null;
  completedDate: string; // YYYY-MM-DD (updated_at)
}

export interface BookCalendarProps {
  onBack?: () => void;
  onBookSelect?: (bookTitle: string) => void;
  completedBooks?: CompletedBook[];
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
  screenshot?: string;    // 원서읽기 인증 스크린샷 (base64)
}

export interface BookDetailProps {
  book: Book;
  onBack: () => void;
  onBackToHome?: () => void;
  onDelete?: (bookId: string) => void | Promise<void>;
  onUpdate?: (bookId: string, input: {
    title?: string;
    author?: string;
    currentValue?: number;
    totalValue?: number;
    isCompleted?: boolean;
  }) => void | Promise<void>;
  isEnglishBook?: boolean;
  certificationPhotos?: string[];
}
