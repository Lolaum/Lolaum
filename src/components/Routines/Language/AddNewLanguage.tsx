"use client";

import { useState } from "react";
import { Plus, X, Upload } from "lucide-react";
import {
  AddNewLanguageProps,
  LanguageFormData,
  Expression,
} from "@/types/routines/language";

export default function AddNewLanguage({
  onCancel,
  onSubmit,
}: AddNewLanguageProps) {
  const [images, setImages] = useState<string[]>([]);
  const [achievement, setAchievement] = useState("");
  const [expressions, setExpressions] = useState<Expression[]>([
    { id: 1, word: "", meaning: "", example: "" },
  ]);

  const addExpression = () => {
    const newId = Math.max(...expressions.map((e) => e.id), 0) + 1;
    setExpressions([
      ...expressions,
      { id: newId, word: "", meaning: "", example: "" },
    ]);
  };

  const removeExpression = (id: number) => {
    if (expressions.length > 1) {
      setExpressions(expressions.filter((e) => e.id !== id));
    }
  };

  const updateExpression = (
    id: number,
    field: "word" | "meaning" | "example",
    value: string
  ) => {
    setExpressions(
      expressions.map((e) => (e.id === id ? { ...e, [field]: value } : e))
    );
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newImages = Array.from(files).slice(0, 2 - images.length);
    const imageUrls = newImages.map((file) => URL.createObjectURL(file));
    setImages([...images, ...imageUrls].slice(0, 2));
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    const validExpressions = expressions.filter(
      (e) => e.word.trim() || e.meaning.trim() || e.example.trim()
    );

    if (validExpressions.length === 0) return;

    const recordData: LanguageFormData = {
      images,
      achievement: achievement.trim(),
      expressions: validExpressions.map((e) => ({
        word: e.word.trim(),
        meaning: e.meaning.trim(),
        example: e.example.trim(),
      })),
    };

    onSubmit?.(recordData);
    onCancel();
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* 백 네비게이션 */}
      <button
        type="button"
        onClick={onCancel}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
      >
        <svg
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 19l-7-7 7-7"
          />
        </svg>
        <span className="text-sm">언어 학습으로 돌아가기</span>
      </button>

      {/* 메인 카드 */}
      <div className="max-w-2xl bg-white rounded-2xl border border-gray-200 p-8 mx-auto">
        {/* 헤더 */}
        <h2 className="text-xl font-bold text-gray-900 mb-6">언어 학습 기록</h2>

        {/* 인증 사진 */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            인증 사진 (최대 2장)
          </label>
          <div className="space-y-3">
            {/* 이미지 업로드 영역 */}
            {images.length < 2 && (
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-orange-400 transition-colors bg-gray-50">
                <div className="flex flex-col items-center justify-center">
                  <Upload className="w-8 h-8 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500">
                    이미지 업로드 또는 드래그
                  </p>
                </div>
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                />
              </label>
            )}

            {/* 업로드된 이미지 미리보기 */}
            {images.length > 0 && (
              <div className="grid grid-cols-2 gap-3">
                {images.map((image, index) => (
                  <div key={index} className="relative">
                    <img
                      src={image}
                      alt={`업로드 이미지 ${index + 1}`}
                      className="w-full h-32 object-cover rounded-xl"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center bg-black bg-opacity-50 rounded-full text-white hover:bg-opacity-70"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 오늘의 작은 성취 */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            오늘의 작은 성취
          </label>
          <input
            type="text"
            value={achievement}
            onChange={(e) => setAchievement(e.target.value)}
            placeholder="예: 20문, 5개 표현"
            className="w-full px-4 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900 placeholder-gray-400"
          />
        </div>

        {/* 오늘의 표현 */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <label className="block text-sm font-medium text-gray-700">
              오늘의 표현
            </label>
            <button
              type="button"
              onClick={addExpression}
              className="flex items-center gap-1 text-sm text-orange-500 hover:text-orange-600 hover:bg-orange-50 active:bg-orange-100 active:scale-95 px-3 py-1.5 rounded-lg transition-all duration-200"
            >
              <Plus className="w-4 h-4" />
              추가
            </button>
          </div>
          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
            {expressions.map((expr, index) => (
              <div
                key={expr.id}
                className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-3"
              >
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={expr.word}
                    onChange={(e) =>
                      updateExpression(expr.id, "word", e.target.value)
                    }
                    placeholder="표현 또는 단어"
                    className="flex-1 px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900 placeholder-gray-400"
                  />
                  {expressions.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeExpression(expr.id)}
                      className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-200"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  value={expr.meaning}
                  onChange={(e) =>
                    updateExpression(expr.id, "meaning", e.target.value)
                  }
                  placeholder="의미"
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900 placeholder-gray-400"
                />
                <textarea
                  value={expr.example}
                  onChange={(e) =>
                    updateExpression(expr.id, "example", e.target.value)
                  }
                  placeholder="배운 표현을 활용한 예문을 작성해보세요"
                  rows={3}
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900 placeholder-gray-400 resize-none"
                />
              </div>
            ))}
          </div>
        </div>

        {/* 버튼 */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={expressions.every(
              (e) => !e.word.trim() && !e.meaning.trim() && !e.example.trim()
            )}
            className="flex-1 py-4 px-4 rounded-xl bg-orange-500 text-white font-medium hover:bg-orange-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            기록 추가하기
          </button>
        </div>
      </div>
    </div>
  );
}
