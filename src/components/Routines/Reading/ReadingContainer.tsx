import React from "react";
import BookManage from "./BookManage";

interface ReadingContainerProps {
  onBackToTimer?: () => void;
}

export default function ReadingContainer({ onBackToTimer }: ReadingContainerProps) {
  return (
    <div className="w-full h-full overflow-y-auto bg-white">
      <BookManage onBackToTimer={onBackToTimer} />
    </div>
  );
}
