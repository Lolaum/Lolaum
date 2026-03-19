import React from "react";
import BookManage from "./BookManage";
import { ReadingContainerProps } from "@/types/routines/reading";

export default function ReadingContainer({
  onBackToTimer,
  onBackToHome,
}: ReadingContainerProps) {
  // certificationPhotos는 현재 독서 기록 폼에 별도 이미지 필드가 없어 전달하지 않음
  return (
    <div className="w-full h-full overflow-y-auto bg-white scale-[0.8] origin-top">
      <BookManage onBackToTimer={onBackToTimer} onBackToHome={onBackToHome} />
    </div>
  );
}
