"use server";

import { createAdminClient } from "@/lib/supabase/admin";

export type ReviewType = "mid" | "final";

export interface PublicReviewQuestion {
  reviewType: ReviewType;
  questionKey: string;
  label: string;
  helperText: string;
}

const FALLBACK_QUESTIONS: PublicReviewQuestion[] = [
  { reviewType: "mid", questionKey: "good_pattern_title", label: "리추얼이 가장 잘 작동했던 날,\n어떤 조건이 갖춰져 있었나요?", helperText: "2~3가지를 선택해주세요" },
  { reviewType: "mid", questionKey: "hard_pattern_title", label: "리추얼이 가장 힘들었던 날,\n무엇이 걸림돌이 됐나요?", helperText: "1~2가지를 선택해주세요" },
  { reviewType: "mid", questionKey: "condition_time", label: "어떤 시간대였나요?", helperText: "구체적으로 적어주세요" },
  { reviewType: "mid", questionKey: "condition_place", label: "어떤 장소였나요?", helperText: "구체적으로 적어주세요" },
  { reviewType: "mid", questionKey: "condition_habit", label: "어떤 습관이 도움이 됐나요?", helperText: "구체적으로 적어주세요" },
  { reviewType: "mid", questionKey: "condition_body", label: "컨디션이 어땠나요?", helperText: "구체적으로 적어주세요" },
  { reviewType: "mid", questionKey: "condition_emotion", label: "어떤 감정 상태였나요?", helperText: "구체적으로 적어주세요" },
  { reviewType: "mid", questionKey: "condition_previous_action", label: "전날 어떤 행동이 영향을 줬나요?", helperText: "구체적으로 적어주세요" },
  { reviewType: "mid", questionKey: "why_started", label: "나는 왜 이 리추얼을 시작했나요?", helperText: "처음 다짐했던 이유를 떠올려보세요" },
  { reviewType: "mid", questionKey: "keep_doing", label: "남은 기간 동안 유지할 것 1가지", helperText: "예: 기상 직후 물 한 잔" },
  { reviewType: "mid", questionKey: "will_change", label: "남은 기간 동안 바꿀 것 1가지", helperText: "예: 스트레칭 5분 → 10분으로 늘리기" },
  { reviewType: "final", questionKey: "results", label: "이번 달 하루 10분-30분 리추얼을 통해 만들어낸\n눈에 보이는 결과물/행동 수치를 적어주세요.", helperText: "- 이번 달 내가 남긴 것\nex) 책 ___권 / 기록 ___개 / 운동 ___회 / 공부 ___회 등" },
  { reviewType: "final", questionKey: "life_changes", label: "리추얼을 통해 실제 삶에서\n바뀐 점이 있다면?", helperText: "ex) 실제 성과, 생산성, 감정, 에너지, 집중력 등\n\n챌린지 첫 날 적었던 리추얼 선언을 읽어보고,\n기대하는 변화에 가까워지기 위해 노력한 스스로를 칭찬해주세요!" },
  { reviewType: "final", questionKey: "continuation_choice", label: "이 리추얼을 지금 방식 그대로\n1달 더 한다면?", helperText: "" },
  { reviewType: "final", questionKey: "adjustment_note", label: "무엇을 바꾸면 나아질까요?", helperText: "조정하고 싶은 점을 적어주세요" },
  { reviewType: "final", questionKey: "feedback", label: "리추얼챌린지는 여러분의 의견을 받으며\n쑥쑥 자랍니다 💛", helperText: "자유롭게 의견을 남겨주세요 (선택사항)" },
];

function fallbackMap(reviewType: ReviewType) {
  return Object.fromEntries(
    FALLBACK_QUESTIONS.filter((q) => q.reviewType === reviewType).map((q) => [q.questionKey, q]),
  ) as Record<string, PublicReviewQuestion>;
}

export async function getPublicReviewQuestions(reviewType: ReviewType): Promise<Record<string, PublicReviewQuestion>> {
  const fallback = fallbackMap(reviewType);
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("admin_review_questions")
      .select("review_type, question_key, label, helper_text")
      .eq("review_type", reviewType)
      .eq("is_active", true);

    if (error || !data?.length) return fallback;

    return (data as { review_type: ReviewType; question_key: string; label: string; helper_text: string | null }[]).reduce(
      (acc, row) => {
        acc[row.question_key] = {
          reviewType: row.review_type,
          questionKey: row.question_key,
          label: row.label,
          helperText: row.helper_text ?? fallback[row.question_key]?.helperText ?? "",
        };
        return acc;
      },
      { ...fallback },
    );
  } catch {
    return fallback;
  }
}
