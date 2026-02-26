import React from "react";
import { User } from "lucide-react";
import { FeedItem as FeedItemType, RoutineCategory } from "@/types/feed";
import {
  BookText,
  Dumbbell,
  BookA,
  Sun,
  Languages,
  CircleDollarSign,
} from "lucide-react";

interface FeedItemProps {
  item: FeedItemType;
  onClick?: () => void;
}

// 루틴 카테고리별 아이콘 및 텍스트 매핑
const getRoutineIcon = (category: RoutineCategory) => {
  switch (category) {
    case "독서":
      return <BookText className="w-5 h-5 text-gray-400" />;
    case "운동":
      return <Dumbbell className="w-5 h-5 text-gray-400" />;
    case "영어":
      return <BookA className="w-5 h-5 text-gray-400" />;
    case "모닝":
      return <Sun className="w-5 h-5 text-gray-400" />;
    case "제2외국어":
      return <Languages className="w-5 h-5 text-gray-400" />;
    case "자산관리":
      return <CircleDollarSign className="w-5 h-5 text-gray-400" />;
    default:
      return <BookText className="w-5 h-5 text-gray-400" />;
  }
};

// 루틴 카테고리별 표시 텍스트
const getRoutineText = (category: RoutineCategory) => {
  switch (category) {
    case "독서":
      return "독서 30분";
    case "운동":
      return "아침 운동";
    case "영어":
      return "영어 공부";
    case "모닝":
      return "모닝 루틴";
    case "제2외국어":
      return "제2외국어 학습";
    case "자산관리":
      return "자산 관리";
    default:
      return category;
  }
};

// 날짜 포맷 함수 (YY.MM.DD 형식)
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const year = String(date.getFullYear()).slice(2); // 24, 25, 26 등
  const month = String(date.getMonth() + 1).padStart(2, "0"); // 01, 02, ..., 12
  const day = String(date.getDate()).padStart(2, "0"); // 01, 02, ..., 31

  return `${year}.${month}.${day}`;
};

export default function FeedItem({ item, onClick }: FeedItemProps) {
  const icon = getRoutineIcon(item.routineCategory);
  const routineText = getRoutineText(item.routineCategory);
  const formattedDate = formatDate(item.date);

  return (
    <div
      className="flex items-start gap-3 py-4 border-b border-gray-100 last:border-b-0 cursor-pointer hover:bg-gray-50 rounded-xl px-2 -mx-2 transition-colors"
      onClick={onClick}
    >
      {/* 프로필 이미지 */}
      <div className="flex-shrink-0">
        <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
          <User className="w-6 h-6 text-gray-400" />
        </div>
      </div>

      {/* 내용 */}
      <div className="flex-1 min-w-0">
        {/* 이름 및 날짜 */}
        <div className="flex items-center justify-between mb-1">
          <span className="text-base font-semibold text-gray-900">
            {item.userName}
          </span>
          <span className="text-sm text-gray-400 content-center">{formattedDate}</span>
        </div>

        {/* 루틴 정보 */}
        <div className="flex items-center gap-1">
          <span className="text-lg">{icon}</span>
          <span className="text-sm text-gray-600">{routineText}</span>
        </div>
      </div>
    </div>
  );
}
