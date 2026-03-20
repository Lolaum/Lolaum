"use client";

interface Member {
  id: string;
  name: string;
  avatar?: string;
  emoji?: string;
  monthsJoined: number;
}

interface MemberProfileProps {
  members?: Member[];
  selectedMemberId?: string;
  onSelectMember?: (memberId: string) => void;
}

const defaultMembers: Member[] = [
  { id: "1", name: "민수", emoji: "🧑", monthsJoined: 6 },
  { id: "2", name: "지은", emoji: "🧑", monthsJoined: 4 },
  { id: "3", name: "현우", monthsJoined: 2 },
  { id: "4", name: "서연", emoji: "🧑", monthsJoined: 8 },
  { id: "5", name: "태희", emoji: "🧑", monthsJoined: 1 },
  { id: "6", name: "준호", monthsJoined: 3 },
  { id: "7", name: "수빈", emoji: "🧑", monthsJoined: 5 },
  { id: "8", name: "동현", emoji: "🧑", monthsJoined: 7 },
];

export default function MemberProfile({
  members = defaultMembers,
  selectedMemberId,
  onSelectMember,
}: MemberProfileProps) {
  return (
    <div className="rounded-3xl bg-white shadow-sm border border-gray-100 p-4 mb-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">챌린저</span>
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
              <button
                key={member.id}
                type="button"
                onClick={() => onSelectMember?.(member.id)}
                className="flex flex-col items-center gap-1.5 flex-shrink-0 transition-all duration-200"
              >
                {/* 아바타 + 뱃지 */}
                <div className="relative">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center transition-all"
                    style={{
                      backgroundColor: isSelected ? "#fef3c7" : "#f3f4f6",
                      boxShadow: isSelected ? "0 0 0 2.5px #eab32e, 0 0 0 4px #fff" : "none",
                    }}
                  >
                    {member.avatar ? (
                      <img src={member.avatar} alt={member.name} className="w-full h-full rounded-full object-cover" />
                    ) : member.emoji ? (
                      <span className="text-xl">{member.emoji}</span>
                    ) : (
                      <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                      </svg>
                    )}
                  </div>
                  <span
                    className="absolute -bottom-1 -right-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap border-2 border-white"
                    style={{
                      backgroundColor: "#fef3c7",
                      color: "#92400e",
                    }}
                  >
                    {member.monthsJoined}🔥
                  </span>
                </div>
                {/* 이름 */}
                <span
                  className="text-[10px] font-semibold mt-1"
                  style={{ color: isSelected ? "#eab32e" : "#6b7280" }}
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
