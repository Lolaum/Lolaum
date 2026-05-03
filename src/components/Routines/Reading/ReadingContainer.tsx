"use client";

import React from "react";
import { useRouter } from "next/navigation";
import BookManage from "./BookManage";
import AddNewBook from "./AddNewBook";
import { createBookAuto } from "@/api/book";
import type { BookFormData } from "@/types/routines/reading";

interface ReadingContainerProps {
  mode?: "main" | "new";
  isEnglishBook?: boolean;
}

export default function ReadingContainer({
  mode = "main",
  isEnglishBook,
}: ReadingContainerProps) {
  const router = useRouter();
  const basePath = isEnglishBook ? "/home/english-book" : "/home/reading";
  const goHome = () => router.push("/home");
  const goMain = () => router.push(basePath);
  const goNew = () => router.push(`${basePath}/new`);

  const handleBookCreated = async (bookData: BookFormData) => {
    await createBookAuto({
      routineType: isEnglishBook ? "english_book" : "reading",
      title: bookData.title,
      author: bookData.author,
      trackingType: bookData.trackingType,
      totalValue:
        bookData.trackingType === "percent" ? 100 : bookData.totalPages,
    });
    goMain();
  };

  if (mode === "new") {
    return (
      <div className="w-full max-w-2xl mx-auto px-4 py-4">
        <AddNewBook
          onCancel={goMain}
          onBackToHome={goHome}
          onSubmit={handleBookCreated}
          isEnglishBook={isEnglishBook}
        />
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-4">
      <BookManage
        onBackToHome={goHome}
        onAddBook={goNew}
        isEnglishBook={isEnglishBook}
      />
    </div>
  );
}
