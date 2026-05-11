"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ProfileProps } from "@/types/home/profile";
import { Flame, Trophy, CheckCircle2 } from "lucide-react";
import { updateMe } from "@/api/user";
import { createClient } from "@/lib/supabase/client";
import {
  MyPageStats,
  CompletionRateStats,
  type HomeProfile,
} from "@/api/ritual-stats";

interface Props extends ProfileProps {
  stats?: MyPageStats | null;
  completionRate?: CompletionRateStats | null;
  initialProfile?: HomeProfile | null;
  period?: {
    start_date: string;
    end_date: string;
    label: string | null;
  } | null;
  onProfileUpdated?: () => void;
}

export default function Profile({
  stats: statsProp,
  completionRate: completionRateProp,
  initialProfile,
  period,
  onProfileUpdated,
}: Props) {
  const [showEditModal, setShowEditModal] = useState(false);
  const userName = initialProfile?.username ?? "";
  const userId = initialProfile?.id ?? "";
  const [editName, setEditName] = useState(initialProfile?.name ?? "");
  const [savedName, setSavedName] = useState(initialProfile?.name ?? "");
  const [savedPhoto, setSavedPhoto] = useState<string | null>(
    initialProfile?.avatar_url ?? null,
  );
  const [editPhoto, setEditPhoto] = useState<string | null>(
    initialProfile?.avatar_url ?? null,
  );
  const [editPhotoFile, setEditPhotoFile] = useState<File | null>(null);
  const [savedStartYear, setSavedStartYear] = useState<number | null>(
    initialProfile?.ritual_start_year ?? null,
  );
  const [savedStartMonth, setSavedStartMonth] = useState<number | null>(
    initialProfile?.ritual_start_month ?? null,
  );
  const [editStartYear, setEditStartYear] = useState(
    initialProfile?.ritual_start_year?.toString() ?? "",
  );
  const [editStartMonth, setEditStartMonth] = useState(
    initialProfile?.ritual_start_month?.toString() ?? "",
  );

  // 부모(HomeContainer)에서 stats/completionRate를 받아와 중복 호출을 피한다
  const stats = statsProp;
  const completionRate = completionRateProp;

  const [saving, setSaving] = useState(false);
  const editPhotoObjectUrlRef = useRef<string | null>(null);
  const router = useRouter();

  const startLabel =
    savedStartYear && savedStartMonth
      ? `${savedStartYear}.${String(savedStartMonth).padStart(2, "0")} 시작`
      : null;

  useEffect(() => {
    return () => {
      if (editPhotoObjectUrlRef.current) {
        URL.revokeObjectURL(editPhotoObjectUrlRef.current);
      }
    };
  }, []);

  const clearEditPhotoObjectUrl = () => {
    if (!editPhotoObjectUrlRef.current) return;
    URL.revokeObjectURL(editPhotoObjectUrlRef.current);
    editPhotoObjectUrlRef.current = null;
  };

  const handleSave = async () => {
    setSaving(true);
    let avatarUrl = savedPhoto;
    const ritualStartYear = editStartYear ? Number(editStartYear) : null;
    const ritualStartMonth = editStartMonth ? Number(editStartMonth) : null;

    if (
      (ritualStartYear !== null &&
        (ritualStartYear < 2000 || ritualStartYear > 2100)) ||
      (ritualStartMonth !== null &&
        (ritualStartMonth < 1 || ritualStartMonth > 12))
    ) {
      setSaving(false);
      alert("리추얼 시작 연도와 월을 확인해주세요.");
      return;
    }

    // 새 사진 파일이면 Storage에 바로 업로드한다.
    // data URL fetch 변환은 일부 환경에서 실패하고 불필요하게 느리다.
    if (editPhotoFile) {
      const supabase = createClient();
      const ext =
        editPhotoFile.type.split("/")[1]?.replace("jpeg", "jpg") || "jpg";
      const path = `${userId}/avatar-${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, editPhotoFile, {
          upsert: false,
          contentType: editPhotoFile.type,
        });
      if (uploadError) {
        setSaving(false);
        alert(`프로필 사진 업로드에 실패했어요: ${uploadError.message}`);
        return;
      }

      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
      avatarUrl = urlData.publicUrl;
    } else if (editPhoto !== savedPhoto) {
      avatarUrl = editPhoto;
    }

    const { error } = await updateMe({
      name: editName,
      avatarUrl,
      ritualStartYear,
      ritualStartMonth,
    });

    setSaving(false);

    if (!error) {
      setSavedName(editName);
      setSavedPhoto(avatarUrl);
      clearEditPhotoObjectUrl();
      setEditPhotoFile(null);
      setSavedStartYear(ritualStartYear);
      setSavedStartMonth(ritualStartMonth);
      onProfileUpdated?.();
      router.refresh();
      setShowEditModal(false);
    } else {
      alert(`프로필 저장에 실패했어요: ${error}`);
    }
  };

  const handleOpen = () => {
    clearEditPhotoObjectUrl();
    setEditName(savedName);
    setEditPhoto(savedPhoto);
    setEditPhotoFile(null);
    setEditStartYear(savedStartYear?.toString() ?? "");
    setEditStartMonth(savedStartMonth?.toString() ?? "");
    setShowEditModal(true);
  };

  const handleClose = () => {
    clearEditPhotoObjectUrl();
    setEditPhotoFile(null);
    setEditPhoto(savedPhoto);
    setShowEditModal(false);
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    clearEditPhotoObjectUrl();
    const objectUrl = URL.createObjectURL(file);
    editPhotoObjectUrlRef.current = objectUrl;
    setEditPhoto(objectUrl);
    setEditPhotoFile(file);
  };

  return (
    <>
    {showEditModal && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={handleClose}>
        <div className="bg-white rounded-3xl shadow-xl p-6 mx-4 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
          <h2 className="text-base font-bold text-gray-800 mb-5">프로필 수정</h2>

          {/* 아바타 */}
          <div className="flex justify-center mb-5">
            <div className="relative">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
                {editPhoto ? (
                  <Image src={editPhoto} alt="프로필" width={64} height={64} className="w-full h-full object-cover" unoptimized />
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

          {/* 리추얼 시작 시점 */}
          <div className="mb-6">
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
              리추얼 시작
            </label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                inputMode="numeric"
                min={2000}
                max={2100}
                value={editStartYear}
                onChange={(e) => setEditStartYear(e.target.value)}
                placeholder="연도"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[var(--gold-400)]/30 focus:border-[var(--gold-400)] focus:bg-white transition-all"
              />
              <select
                value={editStartMonth}
                onChange={(e) => setEditStartMonth(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[var(--gold-400)]/30 focus:border-[var(--gold-400)] focus:bg-white transition-all"
              >
                <option value="">월</option>
                {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                  <option key={month} value={month}>
                    {month}월
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 버튼 */}
          <div className="flex gap-2">
            <button
              onClick={handleClose}
              className="flex-1 py-3 rounded-2xl border border-gray-200 text-sm font-semibold text-gray-500 hover:bg-gray-50 transition-colors"
            >
              취소
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 py-3 rounded-2xl text-sm font-bold text-white shadow-sm transition-all hover:shadow-md disabled:opacity-50"
              style={{ backgroundColor: "#eab32e" }}
            >
              {saving ? "저장 중..." : "저장"}
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
            <Image src={savedPhoto} alt="프로필" width={40} height={40} className="w-full h-full object-cover" unoptimized />
          ) : (
            <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
            </svg>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 min-w-0">
            <p className="text-sm font-bold text-gray-900 truncate">{savedName || userName}</p>
            {startLabel && (
              <span className="flex-shrink-0 rounded-full bg-yellow-50 px-2 py-0.5 text-[11px] font-semibold text-yellow-600">
                {startLabel}
              </span>
            )}
          </div>
        </div>
      </button>

      {/* 마이페이지 통계 */}
      <div className="flex items-center justify-around mb-4 py-3 bg-gray-50 rounded-2xl">
        <div className="flex flex-col items-center gap-1">
          <Flame size={16} className="text-orange-400" />
          <span className="text-lg font-bold text-gray-900">{stats?.currentStreak ?? 0}</span>
          <span className="text-[10px] text-gray-400 font-medium">연속 실천</span>
        </div>
        <div className="w-px h-8 bg-gray-200" />
        <div className="flex flex-col items-center gap-1">
          <Trophy size={16} className="text-yellow-500" />
          <span className="text-lg font-bold text-gray-900">{stats?.longestStreak ?? 0}</span>
          <span className="text-[10px] text-gray-400 font-medium">최장 기록</span>
        </div>
        <div className="w-px h-8 bg-gray-200" />
        <div className="flex flex-col items-center gap-1">
          <CheckCircle2 size={16} className="text-green-500" />
          <span className="text-lg font-bold text-gray-900">{stats?.totalCompletions ?? 0}</span>
          <span className="text-[10px] text-gray-400 font-medium">총 완료</span>
        </div>
      </div>

      {/* 이번 챌린지 기간 */}
      {period && (
        <div className="mb-3 px-3 py-2 rounded-xl bg-yellow-50 border border-yellow-100">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-semibold text-yellow-700 uppercase tracking-wider">
              이번 챌린지 기간
            </span>
            {period.label && (
              <span className="text-[11px] text-yellow-600 truncate max-w-[60%] text-right">
                {period.label}
              </span>
            )}
          </div>
          <p className="text-sm font-bold text-gray-800 mt-0.5">
            {period.start_date} ~ {period.end_date}
          </p>
        </div>
      )}

      {/* 달성률 */}
      <div>
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-xs text-gray-400 font-medium">달성률</span>
          <span className="text-xs font-semibold text-gray-500">
            {completionRate?.totalAchieved ?? 0}/{completionRate?.totalDays ?? 0}
          </span>
        </div>
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-yellow-400 transition-all duration-500"
            style={{ width: `${completionRate?.rate ?? 0}%` }}
          />
        </div>
        <p className="text-lg font-bold text-gray-900 mt-2">{completionRate?.rate ?? 0}%</p>
      </div>
    </div>
    </>
  );
}
