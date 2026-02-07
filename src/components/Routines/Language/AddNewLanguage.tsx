"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import {
  AddNewLanguageProps,
  LanguageFormData,
  Expression,
} from "@/types/routines/language";

export default function AddNewLanguage({
  onCancel,
  onSubmit,
}: AddNewLanguageProps) {
  const [word, setWord] = useState("");
  const [meanings, setMeanings] = useState<Expression[]>([{ id: 1, text: "" }]);
  const [examples, setExamples] = useState<Expression[]>([{ id: 1, text: "" }]);

  const addMeaning = () => {
    const newId = Math.max(...meanings.map((m) => m.id), 0) + 1;
    setMeanings([...meanings, { id: newId, text: "" }]);
  };

  const removeMeaning = (id: number) => {
    if (meanings.length > 1) {
      setMeanings(meanings.filter((m) => m.id !== id));
    }
  };

  const updateMeaning = (id: number, text: string) => {
    setMeanings(meanings.map((m) => (m.id === id ? { ...m, text } : m)));
  };

  const addExample = () => {
    const newId = Math.max(...examples.map((e) => e.id), 0) + 1;
    setExamples([...examples, { id: newId, text: "" }]);
  };

  const removeExample = (id: number) => {
    if (examples.length > 1) {
      setExamples(examples.filter((e) => e.id !== id));
    }
  };

  const updateExample = (id: number, text: string) => {
    setExamples(examples.map((e) => (e.id === id ? { ...e, text } : e)));
  };

  const handleSubmit = () => {
    if (!word.trim()) return;

    const recordData: LanguageFormData = {
      word: word.trim(),
      meanings: meanings.map((m) => m.text.trim()).filter((t) => t),
      examples: examples.map((e) => e.text.trim()).filter((t) => t),
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
        <h2 className="text-xl font-bold text-gray-900 mb-6">학습 기록</h2>

        {/* 단어/표현 */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            단어 또는 표현 <span className="text-orange-500">*</span>
          </label>
          <input
            type="text"
            value={word}
            onChange={(e) => setWord(e.target.value)}
            placeholder="예: profound"
            className="w-full px-4 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900 placeholder-gray-400"
          />
        </div>

        {/* 의미 */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <label className="block text-sm font-medium text-gray-700">
              의미
            </label>
            <button
              type="button"
              onClick={addMeaning}
              className="flex items-center gap-1 text-sm text-orange-500 hover:text-orange-600"
            >
              <Plus className="w-4 h-4" />
              추가
            </button>
          </div>
          <div className="space-y-3">
            {meanings.map((meaning, index) => (
              <div key={meaning.id} className="flex gap-2">
                <input
                  type="text"
                  value={meaning.text}
                  onChange={(e) => updateMeaning(meaning.id, e.target.value)}
                  placeholder={`의미 ${index + 1}`}
                  className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900 placeholder-gray-400"
                />
                {meanings.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeMeaning(meaning.id)}
                    className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 예문 */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <label className="block text-sm font-medium text-gray-700">
              예문
            </label>
            <button
              type="button"
              onClick={addExample}
              className="flex items-center gap-1 text-sm text-orange-500 hover:text-orange-600"
            >
              <Plus className="w-4 h-4" />
              추가
            </button>
          </div>
          <div className="space-y-3">
            {examples.map((example, index) => (
              <div key={example.id} className="flex gap-2">
                <input
                  type="text"
                  value={example.text}
                  onChange={(e) => updateExample(example.id, e.target.value)}
                  placeholder={`예문 ${index + 1}`}
                  className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900 placeholder-gray-400"
                />
                {examples.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeExample(example.id)}
                    className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 버튼 */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!word.trim()}
            className="flex-1 py-4 px-4 rounded-xl bg-orange-500 text-white font-medium hover:bg-orange-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            기록 추가하기
          </button>
        </div>
      </div>
    </div>
  );
}
