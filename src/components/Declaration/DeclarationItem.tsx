import Link from "next/link";
import { Declaration } from "@/types/routines/declaration";
import { declarationQuestions } from "@/lib/declarationQuestions";
import { ROUTINE_CONFIG } from "@/lib/routineConfig";
import UserAvatar from "@/components/common/UserAvatar";

interface DeclarationItemProps {
  decl: Declaration;
  isMine?: boolean;
}

export default function DeclarationItem({ decl, isMine }: DeclarationItemProps) {
  const config = ROUTINE_CONFIG[decl.routineType];
  const questions = declarationQuestions[decl.routineType];

  // 첫 번째 답변을 미리보기 텍스트로 사용
  const firstAnswer = questions
    .map((q) => decl.answers.find((a) => a.questionId === q.id))
    .find((a) => a?.answer);

  return (
    <Link
      href={`/declaration/${decl.id}`}
      className="block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
      style={{ borderTop: `3px solid ${config.color}` }}
    >
      {/* 컬러 배경 헤더 */}
      <div
        className="px-4 py-3 flex items-center gap-2"
        style={{ backgroundColor: config.bgColor }}
      >
        <span style={{ color: config.color }}>{config.icon(16)}</span>
        <span
          className="text-xs font-semibold px-2 py-0.5 rounded-full text-white"
          style={{ backgroundColor: config.color }}
        >
          {config.label}
        </span>
      </div>

      <div className="p-4">
        {/* 유저 정보 */}
        <div className="flex items-center gap-2.5 mb-2.5">
          <UserAvatar avatarUrl={decl.avatarUrl} emoji={decl.userEmoji} size={32} />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-semibold text-gray-900 leading-tight">
                {decl.userName}
              </p>
              {isMine && (
                <span
                  className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md text-white"
                  style={{ backgroundColor: "#eab32e" }}
                >
                  나
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 미리보기 텍스트 */}
        {firstAnswer && (
          <p className="text-xs text-gray-500 leading-relaxed line-clamp-2 pl-0.5">
            {firstAnswer.answer}
          </p>
        )}
      </div>
    </Link>
  );
}
