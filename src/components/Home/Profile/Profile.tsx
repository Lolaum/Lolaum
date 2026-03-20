"use client";

import { useState } from "react";
import { ProfileProps } from "@/types/home/profile";
import { Flame } from "lucide-react";

export default function Profile({
  name = "사용자 이름",
  description = "매일 성장하는 습관 만들기",
  completedCount = 3,
  totalCount = 4,
}: ProfileProps) {
  const progressPercent =
    totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState(name);
  const [editDescription, setEditDescription] = useState(description);
  const [savedName, setSavedName] = useState(name);
  const [savedDescription, setSavedDescription] = useState(description);
  const [savedPhoto, setSavedPhoto] = useState<string | null>(null);
  const [editPhoto, setEditPhoto] = useState<string | null>(null);

  const handleSave = () => {
    setSavedName(editName);
    setSavedDescription(editDescription);
    setSavedPhoto(editPhoto);
    setShowEditModal(false);
  };

  const handleOpen = () => {
    setEditName(savedName);
    setEditDescription(savedDescription);
    setEditPhoto(savedPhoto);
    setShowEditModal(true);
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setEditPhoto(reader.result as string);
    reader.readAsDataURL(file);
  };

  return (
    <>
    {showEditModal && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowEditModal(false)}>
        <div className="bg-white rounded-3xl shadow-xl p-6 mx-4 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
          <h2 className="text-base font-bold text-gray-800 mb-5">프로필 수정</h2>

          {/* 아바타 */}
          <div className="flex justify-center mb-5">
            <div className="relative">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
                {editPhoto ? (
                  <img src={editPhoto} alt="프로필" className="w-full h-full object-cover" />
                ) : (
                  <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                  </svg>
                )}
              </div>
              <label className="absolute -bottom-0.5 -right-0.5 w-6 h-6 rounded-full flex items-center justify-center shadow-sm cursor-pointer" style={{ backgroundColor: "#eab32e" }}>
                <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828A2 2 0 019 17H7v-2a2 2 0 01.586-1.414z" />
                </svg>
                <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
              </label>
            </div>
          </div>

          {/* 이름 */}
          <div className="mb-4">
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">이름</label>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[var(--gold-400)]/30 focus:border-[var(--gold-400)] focus:bg-white transition-all"
            />
          </div>

          {/* 한줄 소개 */}
          <div className="mb-6">
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">한줄 소개</label>
            <input
              type="text"
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[var(--gold-400)]/30 focus:border-[var(--gold-400)] focus:bg-white transition-all"
            />
          </div>

          {/* 버튼 */}
          <div className="flex gap-2">
            <button
              onClick={() => setShowEditModal(false)}
              className="flex-1 py-3 rounded-2xl border border-gray-200 text-sm font-semibold text-gray-500 hover:bg-gray-50 transition-colors"
            >
              취소
            </button>
            <button
              onClick={handleSave}
              className="flex-1 py-3 rounded-2xl text-sm font-bold text-white shadow-sm transition-all hover:shadow-md"
              style={{ backgroundColor: "#eab32e" }}
            >
              저장
            </button>
          </div>
        </div>
      </div>
    )}
    <div className="rounded-2xl bg-white shadow-sm border border-gray-100 p-4 mb-4">
      {/* 유저 정보 */}
      <button type="button" onClick={handleOpen} className="flex items-center gap-3 mb-4 w-full text-left">
        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
          {savedPhoto ? (
            <img src={savedPhoto} alt="프로필" className="w-full h-full object-cover" />
          ) : (
            <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
            </svg>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-gray-900 truncate">{savedName}</p>
          <p className="text-xs text-gray-400 truncate">{savedDescription}</p>
        </div>
        <div className="flex items-center gap-1 bg-yellow-50 rounded-full px-2.5 py-1 flex-shrink-0">
          <Flame size={12} className="text-yellow-500" />
          <span className="text-xs font-bold text-yellow-500">12일</span>
        </div>
      </button>

      {/* 오늘의 진행률 */}
      <div>
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-xs text-gray-400 font-medium">오늘의 달성률</span>
          <span className="text-xs font-semibold text-gray-500">
            {completedCount}/{totalCount}
          </span>
        </div>
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-yellow-400 transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <p className="text-lg font-bold text-gray-900 mt-2">{progressPercent}%</p>
      </div>
    </div>
    </>
  );
}
