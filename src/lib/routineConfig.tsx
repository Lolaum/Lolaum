import React from "react";
import {
  BookText,
  Dumbbell,
  BookA,
  Sun,
  Languages,
  Pen,
  CircleDollarSign,
  BookOpen,
} from "lucide-react";
import { RoutineType } from "@/types/routines/declaration";

export interface RoutineConfig {
  color: string;
  bgColor: string;
  icon: (size: number) => React.ReactNode;
  label: string; // "리추얼" 제거된 짧은 이름
}

export const ROUTINE_CONFIG: Record<RoutineType, RoutineConfig> = {
  모닝리추얼:       { color: "#eab32e", bgColor: "#fefce8", icon: (s) => <Sun size={s} />,               label: "모닝" },
  운동리추얼:       { color: "#ff8900", bgColor: "#fff4e5", icon: (s) => <Dumbbell size={s} />,           label: "운동" },
  독서리추얼:       { color: "#6366f1", bgColor: "#eef2ff", icon: (s) => <BookText size={s} />,           label: "독서" },
  영어리추얼:       { color: "#0ea5e9", bgColor: "#f0f9ff", icon: (s) => <BookA size={s} />,              label: "영어" },
  제2외국어리추얼:  { color: "#8b5cf6", bgColor: "#f5f3ff", icon: (s) => <Languages size={s} />,          label: "제2외국어" },
  기록리추얼:       { color: "#8b5cf6", bgColor: "#f5f3ff", icon: (s) => <Pen size={s} />,                label: "기록" },
  자산관리리추얼:   { color: "#10b981", bgColor: "#ecfdf5", icon: (s) => <CircleDollarSign size={s} />,   label: "자산관리" },
  원서읽기리추얼:   { color: "#ec4899", bgColor: "#fdf2f8", icon: (s) => <BookOpen size={s} />,           label: "원서읽기" },
};

export const ALL_ROUTINE_TYPES = Object.keys(ROUTINE_CONFIG) as RoutineType[];
