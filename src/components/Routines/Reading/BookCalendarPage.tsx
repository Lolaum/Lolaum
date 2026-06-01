"use client";

import { useRouter } from "next/navigation";
import BookCalendar from "./BookCalendar";

interface BookCalendarPageProps {
  isEnglishBook?: boolean;
}

export default function BookCalendarPage({
  isEnglishBook,
}: BookCalendarPageProps) {
  const router = useRouter();
  const backPath = isEnglishBook ? "/home/english-book" : "/home/reading";

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-4">
      <BookCalendar
        onBack={() => router.push(backPath)}
        onBookSelect={({ bookId, routineType }) => {
          const basePath =
            routineType === "english_book"
              ? "/home/english-book"
              : "/home/reading";
          router.push(`${basePath}?book=${encodeURIComponent(bookId)}`);
        }}
      />
    </div>
  );
}
