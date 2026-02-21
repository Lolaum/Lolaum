import React from "react";
import BookManage from "./BookManage";
import { ReadingContainerProps } from "@/types/routines/reading";

export default function ReadingContainer({
  onBackToTimer,
  onBackToHome,
}: ReadingContainerProps) {
  return (
    <div className="w-full h-full overflow-y-auto bg-white">
      <BookManage onBackToTimer={onBackToTimer} onBackToHome={onBackToHome} />
    </div>
  );
}
