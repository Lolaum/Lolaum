"use client";

interface Member {
  id: string;
  name: string;
  avatar?: string;
  emoji?: string;
}

interface MemberProfileProps {
  members?: Member[];
  selectedMemberId?: string;
  onSelectMember?: (memberId: string) => void;
}

const defaultMembers: Member[] = [
  { id: "1", name: "민수", emoji: "🧑" },
  { id: "2", name: "지은", emoji: "🧑" },
  { id: "3", name: "현우" },
  { id: "4", name: "서연", emoji: "🧑" },
  { id: "5", name: "태희", emoji: "🧑" },
  { id: "6", name: "준호" },
  { id: "7", name: "수빈", emoji: "🧑" },
  { id: "8", name: "동현", emoji: "🧑" },
];

export default function MemberProfile({
  members = defaultMembers,
  selectedMemberId,
  onSelectMember,
}: MemberProfileProps) {
  return (
    <div className="rounded-2xl bg-white shadow-md p-5 mb-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium text-gray-500">팀원</span>
        <span className="text-sm text-gray-500">{members.length}명</span>
      </div>

      {/* 멤버 리스트 (가로 스크롤) */}
      <div className="overflow-x-auto scrollbar-hide -mx-2">
        <div className="flex gap-3 px-2 py-2">
          {members.map((member) => {
            const isSelected = member.id === selectedMemberId;
            return (
              <button
                key={member.id}
                type="button"
                onClick={() => onSelectMember?.(member.id)}
                className="flex flex-col items-center gap-2 flex-shrink-0"
              >
                {/* 아바타 */}
                <div
                  className={`w-14 h-14 rounded-full flex items-center justify-center transition-all bg-gray-100 ${
                    isSelected
                      ? "ring-2 ring-[var(--gold-300)] ring-offset-2"
                      : ""
                  }`}
                >
                  {member.avatar ? (
                    <img
                      src={member.avatar}
                      alt={member.name}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : member.emoji ? (
                    <span className="text-2xl">{member.emoji}</span>
                  ) : (
                    <svg
                      className="w-7 h-7 text-gray-400"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                    </svg>
                  )}
                </div>
                {/* 이름 */}
                <span
                  className={`text-xs font-medium ${
                    isSelected ? "text-[var(--gold-400)]" : "text-gray-600"
                  }`}
                >
                  {member.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
