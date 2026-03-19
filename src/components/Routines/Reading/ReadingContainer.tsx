import React from "react";
import BookManage from "./BookManage";
import { ReadingContainerProps } from "@/types/routines/reading";

export default function ReadingContainer({
  onBackToTimer,
  onBackToHome,
}: ReadingContainerProps) {
  // certificationPhotos는 현재 독서 기록 폼에 별도 이미지 필드가 없어 전달하지 않음
  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-4">
      <BookManage onBackToTimer={onBackToTimer} onBackToHome={onBackToHome} />
    </div>
  );
}
