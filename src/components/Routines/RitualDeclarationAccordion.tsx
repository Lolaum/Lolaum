"use client";

import { useEffect, useState } from "react";
import { ChevronDown, Loader2 } from "lucide-react";
import { getMyDeclarations } from "@/api/declaration";
import { declarationQuestions } from "@/lib/declarationQuestions";
import { ROUTINE_TYPE_LABEL, type RoutineTypeDB } from "@/types/supabase";
import type {
  Declaration,
  RoutineType,
} from "@/types/routines/declaration";

interface RitualDeclarationAccordionProps {
  routineType: RoutineTypeDB;
}

export default function RitualDeclarationAccordion({
  routineType,
}: RitualDeclarationAccordionProps) {
  const [open, setOpen] = useState(false);
  const [declaration, setDeclaration] = useState<Declaration | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;

    async function fetchDeclaration() {
      setLoading(true);
      const result = await getMyDeclarations();
      if (ignore) return;

      const routineLabel = ROUTINE_TYPE_LABEL[routineType] as RoutineType;
      setDeclaration(
        (result.data ?? []).find((item) => item.routineType === routineLabel) ??
          null,
      );
      setLoading(false);
    }

    void fetchDeclaration();

    return () => {
      ignore = true;
    };
  }, [routineType]);

  if (loading) {
    return (
      <div className="mb-4 rounded-2xl bg-white shadow-sm border border-gray-100 p-4">
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          리추얼 선언을 불러오는 중...
        </div>
      </div>
    );
  }

  if (!declaration) return null;

  const questions = declarationQuestions[declaration.routineType] ?? [];
  const answersByQuestion = new Map(
    declaration.answers.map((answer) => [answer.questionId, answer.answer]),
  );
  const visibleAnswers = questions
    .map((question) => ({
      question,
      answer: answersByQuestion.get(question.id)?.trim() ?? "",
    }))
    .filter((item) => item.answer.length > 0);

  if (visibleAnswers.length === 0) return null;

  const label = ROUTINE_TYPE_LABEL[routineType].replace("리추얼", "");
  const panelId = `ritual-declaration-${routineType}`;

  return (
    <section className="mb-4 rounded-2xl bg-white shadow-sm border border-gray-100 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="w-full p-4 flex items-center justify-between gap-3 text-left hover:bg-gray-50 transition-colors"
        aria-expanded={open}
        aria-controls={panelId}
      >
        <div className="min-w-0">
          <p className="text-xs text-gray-400 font-medium mb-0.5">
            리추얼 선언
          </p>
          <h2 className="text-sm font-semibold text-gray-900 truncate">
            {label} 선언 때 작성한 글
          </h2>
        </div>
        <ChevronDown
          className={`h-5 w-5 shrink-0 text-gray-400 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div id={panelId} className="px-4 pb-4 pt-1 border-t border-gray-100">
          <div className="space-y-3">
            {visibleAnswers.map(({ question, answer }) => (
              <div key={question.id} className="rounded-xl bg-gray-50 p-3">
                <p className="mb-1.5 whitespace-pre-line text-xs font-semibold text-gray-500">
                  {question.label}
                </p>
                <p className="whitespace-pre-line text-sm leading-relaxed text-gray-700">
                  {answer}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
