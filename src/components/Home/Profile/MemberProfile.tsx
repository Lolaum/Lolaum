"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCurrentChallengers, type ChallengerSummary } from "@/api/user";
import UserAvatar from "@/components/common/UserAvatar";

interface MemberProfileProps {
  initialMembers?: ChallengerSummary[];
  selectedMemberId?: string;
  onSelectMember?: (memberId: string) => void;
  refreshKey?: number;
}

export default function MemberProfile({
  initialMembers,
  selectedMemberId,
  onSelectMember,
  refreshKey = 0,
}: MemberProfileProps) {
  const router = useRouter();
  const [members, setMembers] = useState<ChallengerSummary[]>(
    initialMembers ?? [],
  );

  useEffect(() => {
    // 최초 마운트(refreshKey===0)에서 SSR initialMembers를 받았다면 재페칭 불필요.
    // refreshKey가 증가했을 때만 (등록/탈퇴 등 외부 변경 신호) 다시 조회한다.
    if (refreshKey === 0) return;

    getCurrentChallengers().then((res) => {
      if (res.data) setMembers(res.data);
    });
  }, [refreshKey]);

  const selectedMember = members.find(
    (member) => member.id === selectedMemberId,
  );

  return (
    <div className="rounded-3xl bg-white shadow-sm border border-gray-100 p-4 mb-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
          챌린저
        </span>
        <span
          className="text-xs font-medium px-2 py-0.5 rounded-full"
          style={{ backgroundColor: "#fef3c7", color: "#92400e" }}
        >
          {members.length}명
        </span>
      </div>

      {/* 멤버 리스트 (가로 스크롤) */}
      <div className="overflow-x-auto scrollbar-hide -mx-1">
        <div className="flex gap-2 px-1 py-1">
          {members.map((member) => {
            const isSelected = member.id === selectedMemberId;
            return (
              <div
                key={member.id}
                className="flex flex-col items-center gap-1.5 flex-shrink-0 transition-all duration-200"
              >
                {/* 아바타 + 뱃지 */}
                <button
                  type="button"
                  onClick={() =>
                    router.push(`/ritual?challenger=${member.publicSlug}`)
                  }
                  className="relative rounded-full"
                  aria-label={`${member.name}님의 리추얼 기록 보기`}
                >
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center transition-all"
                    style={{
                      backgroundColor: isSelected ? "#fef3c7" : "#f3f4f6",
                      boxShadow: isSelected
                        ? "0 0 0 2.5px #eab32e, 0 0 0 4px #fff"
                        : "none",
                    }}
                  >
                    <UserAvatar
                      avatarUrl={member.avatarUrl ?? undefined}
                      emoji={member.emoji ?? undefined}
                      size={48}
                    />
                  </div>
                </button>
                {/* 이름 */}
                <button
                  type="button"
                  onClick={() => onSelectMember?.(member.id)}
                  className="text-[10px] font-semibold mt-1"
                  style={{ color: isSelected ? "#eab32e" : "#6b7280" }}
                >
                  {member.name}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {selectedMember && (
        <div className="mt-4 rounded-2xl bg-amber-50/70 p-3">
          <p className="mb-2 text-xs font-semibold text-amber-700">
            {selectedMember.name}님이 신청한 리추얼
          </p>
          {selectedMember.registeredRituals?.length ? (
            <div className="flex flex-wrap gap-1.5">
              {selectedMember.registeredRituals.map((ritual) => (
                <span
                  key={ritual}
                  className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-gray-700 shadow-sm"
                >
                  {ritual}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-amber-600">신청한 리추얼이 없습니다.</p>
          )}
        </div>
      )}
    </div>
  );
}
