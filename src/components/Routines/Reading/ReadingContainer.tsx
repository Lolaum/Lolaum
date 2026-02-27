import React from "react";
import BookManage from "./BookManage";
import { ReadingContainerProps } from "@/types/routines/reading";

export default function ReadingContainer({
  onBackToTimer,
  onBackToHome,
}: ReadingContainerProps) {
  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-4">
      <BookManage onBackToTimer={onBackToTimer} onBackToHome={onBackToHome} />
    </div>
  );
}
