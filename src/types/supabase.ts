// Supabase Database 타입 정의
// Supabase CLI로 자동 생성할 수도 있지만, 초기 설정용으로 수동 작성

export type RoutineTypeDB =
  | "morning"
  | "exercise"
  | "reading"
  | "english"
  | "second_language"
  | "recording"
  | "finance"
  | "english_book";

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Tables: {
      profiles: {
        Row: {
          id: string;
          name: string;
          username: string;
          email: string;
          avatar_url: string | null;
          emoji: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          name: string;
          username: string;
          email: string;
          avatar_url?: string | null;
          emoji?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          username?: string;
          email?: string;
          avatar_url?: string | null;
          emoji?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      teams: {
        Row: {
          id: string;
          name: string;
          max_members: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          max_members?: number;
          created_at?: string;
        };
        Update: {
          name?: string;
          max_members?: number;
        };
        Relationships: [];
      };
      team_members: {
        Row: {
          id: string;
          team_id: string;
          user_id: string;
          role: "admin" | "member";
          joined_at: string;
        };
        Insert: {
          id?: string;
          team_id: string;
          user_id: string;
          role?: "admin" | "member";
          joined_at?: string;
        };
        Update: {
          role?: "admin" | "member";
        };
        Relationships: [];
      };
      challenges: {
        Row: {
          id: string;
          team_id: string | null;
          user_id: string | null;
          year: number;
          month: number;
          start_date: string;
          end_date: string;
          weekly_target: number;
          total_weeks: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          team_id?: string | null;
          user_id?: string | null;
          year: number;
          month: number;
          start_date: string;
          end_date: string;
          weekly_target?: number;
          total_weeks?: number;
          created_at?: string;
        };
        Update: {
          start_date?: string;
          end_date?: string;
          weekly_target?: number;
          total_weeks?: number;
        };
        Relationships: [];
      };
      challenge_registrations: {
        Row: {
          id: string;
          challenge_id: string;
          user_id: string;
          routine_type: RoutineTypeDB;
          registered_at: string;
        };
        Insert: {
          id?: string;
          challenge_id: string;
          user_id: string;
          routine_type: RoutineTypeDB;
          registered_at?: string;
        };
        Update: {
          routine_type?: RoutineTypeDB;
        };
        Relationships: [];
      };
      ritual_records: {
        Row: {
          id: string;
          user_id: string;
          challenge_id: string;
          routine_type: RoutineTypeDB;
          record_date: string;
          record_data: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          challenge_id: string;
          routine_type: RoutineTypeDB;
          record_date: string;
          record_data: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          record_data?: Json;
          updated_at?: string;
        };
        Relationships: [];
      };
      books: {
        Row: {
          id: string;
          user_id: string;
          challenge_id: string;
          routine_type: "reading" | "english_book";
          title: string;
          author: string;
          tracking_type: "page" | "percent";
          current_value: number;
          total_value: number;
          cover_image_url: string | null;
          is_completed: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          challenge_id: string;
          routine_type: "reading" | "english_book";
          title: string;
          author: string;
          tracking_type: "page" | "percent";
          current_value?: number;
          total_value: number;
          cover_image_url?: string | null;
          is_completed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          author?: string;
          current_value?: number;
          total_value?: number;
          cover_image_url?: string | null;
          is_completed?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      feeds: {
        Row: {
          id: string;
          user_id: string;
          challenge_id: string;
          ritual_record_id: string | null;
          routine_type: RoutineTypeDB;
          feed_date: string;
          feed_data: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          challenge_id: string;
          ritual_record_id?: string | null;
          routine_type: RoutineTypeDB;
          feed_date: string;
          feed_data: Json;
          created_at?: string;
        };
        Update: {
          feed_data?: Json;
        };
        Relationships: [];
      };
      feed_comments: {
        Row: {
          id: string;
          feed_id: string;
          user_id: string;
          text: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          feed_id: string;
          user_id: string;
          text: string;
          created_at?: string;
        };
        Update: {
          text?: string;
        };
        Relationships: [];
      };
      declarations: {
        Row: {
          id: string;
          user_id: string;
          challenge_id: string;
          routine_type: RoutineTypeDB;
          answers: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          challenge_id: string;
          routine_type: RoutineTypeDB;
          answers: Json;
          created_at?: string;
        };
        Update: {
          answers?: Json;
        };
        Relationships: [];
      };
      mid_reviews: {
        Row: {
          id: string;
          user_id: string;
          challenge_id: string;
          routine_type: RoutineTypeDB;
          good_conditions: string[];
          good_condition_details: Json;
          hard_conditions: string[];
          hard_condition_details: Json;
          why_started: string;
          keep_doing: string;
          will_change: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          challenge_id: string;
          routine_type: RoutineTypeDB;
          good_conditions?: string[];
          good_condition_details?: Json;
          hard_conditions?: string[];
          hard_condition_details?: Json;
          why_started: string;
          keep_doing: string;
          will_change: string;
          created_at?: string;
        };
        Update: {
          good_conditions?: string[];
          good_condition_details?: Json;
          hard_conditions?: string[];
          hard_condition_details?: Json;
          why_started?: string;
          keep_doing?: string;
          will_change?: string;
        };
        Relationships: [];
      };
      daily_completions: {
        Row: {
          id: string;
          user_id: string;
          challenge_id: string;
          completion_date: string;
          total_registered: number;
          total_completed: number;
          is_fully_complete: boolean;
          is_happy_chance: boolean;
          has_penalty: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          challenge_id: string;
          completion_date: string;
          total_registered: number;
          total_completed: number;
          is_happy_chance?: boolean;
          has_penalty?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          total_registered?: number;
          total_completed?: number;
          is_happy_chance?: boolean;
          has_penalty?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      todos: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          completed: boolean;
          todo_date: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          completed?: boolean;
          todo_date: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          completed?: boolean;
          todo_date?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
  };
}

// 편의 타입 aliases
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Team = Database["public"]["Tables"]["teams"]["Row"];
export type TeamMember = Database["public"]["Tables"]["team_members"]["Row"];
export type Challenge = Database["public"]["Tables"]["challenges"]["Row"];
export type ChallengeRegistration =
  Database["public"]["Tables"]["challenge_registrations"]["Row"];
export type RitualRecord =
  Database["public"]["Tables"]["ritual_records"]["Row"];
export type Book = Database["public"]["Tables"]["books"]["Row"];
export type Feed = Database["public"]["Tables"]["feeds"]["Row"];
export type FeedComment =
  Database["public"]["Tables"]["feed_comments"]["Row"];
export type Declaration =
  Database["public"]["Tables"]["declarations"]["Row"];
export type MidReviewDB = Database["public"]["Tables"]["mid_reviews"]["Row"];
export type DailyCompletion =
  Database["public"]["Tables"]["daily_completions"]["Row"];
export type Todo = Database["public"]["Tables"]["todos"]["Row"];

// record_data JSONB 타입들
export interface MorningRecordData {
  sleepHours: number;
  condition: "상" | "중" | "하";
  successAndReflection: string;
  gift: string;
  image?: string;
}

export interface ExerciseRecordData {
  exerciseName: string;
  duration: number;
  images?: string[];
  achievement?: string;
}

export interface ReadingRecordData {
  bookId: string;
  trackingType: "page" | "percent";
  startValue: number;
  endValue: number;
  progressAmount: number;
  noteType: "sentence" | "summary";
  note: string;
  thoughts?: string;
}

export interface LanguageRecordData {
  achievement: string;
  expressions: { word: string; meaning: string; example: string }[];
  images?: string[];
}

export interface FinanceRecordData {
  dailyExpenses: {
    date: string;
    expenses: {
      id: string;
      name: string;
      amount: number;
      type: "emotional" | "necessary";
    }[];
  }[];
  studyContent: string;
  practice: string;
}

export interface RecordingRecordData {
  content: string;
  link?: string;
}

// routine_type 한글-영문 매핑
export const ROUTINE_TYPE_MAP: Record<string, RoutineTypeDB> = {
  모닝리추얼: "morning",
  운동리추얼: "exercise",
  독서리추얼: "reading",
  영어리추얼: "english",
  제2외국어리추얼: "second_language",
  기록리추얼: "recording",
  자산관리리추얼: "finance",
  원서읽기리추얼: "english_book",
};

export const ROUTINE_TYPE_LABEL: Record<RoutineTypeDB, string> = {
  morning: "모닝리추얼",
  exercise: "운동리추얼",
  reading: "독서리추얼",
  english: "영어리추얼",
  second_language: "제2외국어리추얼",
  recording: "기록리추얼",
  finance: "자산관리리추얼",
  english_book: "원서읽기리추얼",
};
