"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import {
  FeedItem,
  ExerciseFeedData,
  MorningFeedData,
  FinanceFeedData,
  LanguageFeedData,
  ReadingFeedData,
  RecordingFeedData,
  RoutineCategory,
} from "@/types/feed";
import { ExpenseItem, ExpenseType } from "@/types/routines/finance";
import { updateRitualRecord } from "@/api/ritual-record";
import type { Json } from "@/types/supabase";

interface Props {
  item: FeedItem;
  onCancel: () => void;
}

const fieldLabel = "block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5";
const textareaCls =
  "w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-gray-300 resize-none";
const inputCls =
  "w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-gray-300";

export default function EditFeedRecord({ item, onCancel }: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const recordId = item.odOriginalId ?? null;
  const data = item.routineData;

  // 카테고리별 상태
  const [exerciseDraft, setExerciseDraft] = useState<ExerciseFeedData | null>(
    item.routineCategory === "운동" && data ? { ...(data as ExerciseFeedData) } : null,
  );
  const [morningDraft, setMorningDraft] = useState<MorningFeedData | null>(
    item.routineCategory === "모닝" && data ? { ...(data as MorningFeedData) } : null,
  );
  const [financeDraft, setFinanceDraft] = useState<FinanceFeedData | null>(
    item.routineCategory === "자산관리" && data
      ? {
          ...(data as FinanceFeedData),
          dailyExpenses: (data as FinanceFeedData).dailyExpenses.map((d) => ({
            ...d,
            expenses: d.expenses.map((e) => ({ ...e })),
          })),
        }
      : null,
  );
  const [languageDraft, setLanguageDraft] = useState<LanguageFeedData | null>(
    (item.routineCategory === "영어" || item.routineCategory === "제2외국어") && data
      ? {
          ...(data as LanguageFeedData),
          expressions: (data as LanguageFeedData).expressions.map((e) => ({ ...e })),
        }
      : null,
  );
  const [readingDraft, setReadingDraft] = useState<ReadingFeedData | null>(
    (item.routineCategory === "독서" || item.routineCategory === "원서읽기") && data
      ? { ...(data as ReadingFeedData) }
      : null,
  );
  const [recordingDraft, setRecordingDraft] = useState<RecordingFeedData | null>(
    item.routineCategory === "기록" && data ? { ...(data as RecordingFeedData) } : null,
  );

  if (!data || !recordId) {
    return (
      <div className="text-center text-sm text-gray-400 py-8">
        수정할 데이터가 없습니다.
      </div>
    );
  }

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);

    let next: Record<string, unknown> | null = null;

    switch (item.routineCategory) {
      case "운동":
        next = exerciseDraft as unknown as Record<string, unknown>;
        break;
      case "모닝":
        next = morningDraft as unknown as Record<string, unknown>;
        break;
      case "자산관리":
        next = financeDraft as unknown as Record<string, unknown>;
        break;
      case "영어":
      case "제2외국어":
        next = languageDraft as unknown as Record<string, unknown>;
        break;
      case "독서":
      case "원서읽기":
        next = readingDraft as unknown as Record<string, unknown>;
        break;
      case "기록":
        next = recordingDraft as unknown as Record<string, unknown>;
        break;
    }

    if (!next) {
      setSaving(false);
      return;
    }

    // 사진 필드는 기존 값 유지 (이미 draft에 복사돼 있지만 명시적으로)
    const orig = data as unknown as Record<string, unknown>;
    if (orig.certPhotos !== undefined) next.certPhotos = orig.certPhotos;
    if (orig.images !== undefined && next.images === undefined) next.images = orig.images;
    if (orig.image !== undefined && next.image === undefined) next.image = orig.image;
    if (orig.bookCover !== undefined && next.bookCover === undefined)
      next.bookCover = orig.bookCover;

    const { error } = await updateRitualRecord(recordId, next as unknown as Json);
    setSaving(false);

    if (error) {
      alert(`수정 실패: ${error}`);
      return;
    }
    router.refresh();
    onCancel();
  };

  return (
    <div className="space-y-4">
      {item.routineCategory === "운동" && exerciseDraft && (
        <ExerciseEditor draft={exerciseDraft} onChange={setExerciseDraft} />
      )}
      {item.routineCategory === "모닝" && morningDraft && (
        <MorningEditor draft={morningDraft} onChange={setMorningDraft} />
      )}
      {item.routineCategory === "자산관리" && financeDraft && (
        <FinanceEditor draft={financeDraft} onChange={setFinanceDraft} />
      )}
      {(item.routineCategory === "영어" || item.routineCategory === "제2외국어") &&
        languageDraft && (
          <LanguageEditor draft={languageDraft} onChange={setLanguageDraft} />
        )}
      {item.routineCategory === "독서" && readingDraft && (
        <ReadingEditor draft={readingDraft} onChange={setReadingDraft} isEnglishBook={false} />
      )}
      {item.routineCategory === "원서읽기" && readingDraft && (
        <ReadingEditor draft={readingDraft} onChange={setReadingDraft} isEnglishBook={true} />
      )}
      {item.routineCategory === "기록" && recordingDraft && (
        <RecordingEditor draft={recordingDraft} onChange={setRecordingDraft} />
      )}

      <div className="flex gap-2 pt-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50"
        >
          취소
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="flex-1 py-3 rounded-xl text-sm font-bold text-white shadow-sm disabled:opacity-50"
          style={{ backgroundColor: getCategoryColor(item.routineCategory) }}
        >
          {saving ? "저장 중..." : "저장"}
        </button>
      </div>
    </div>
  );
}

function getCategoryColor(category: RoutineCategory): string {
  switch (category) {
    case "운동":
      return "#ff8900";
    case "모닝":
      return "#eab32e";
    case "자산관리":
      return "#10b981";
    case "영어":
      return "#0ea5e9";
    case "제2외국어":
      return "#10b981";
    case "독서":
      return "#6366f1";
    case "원서읽기":
      return "#ec4899";
    case "기록":
      return "#8b5cf6";
  }
}

function ExerciseEditor({
  draft,
  onChange,
}: {
  draft: ExerciseFeedData;
  onChange: (d: ExerciseFeedData) => void;
}) {
  return (
    <div className="space-y-3">
      <div>
        <label className={fieldLabel}>운동/식단명</label>
        <input
          type="text"
          value={draft.exerciseName}
          onChange={(e) => onChange({ ...draft, exerciseName: e.target.value })}
          className={inputCls}
        />
      </div>
      <div>
        <label className={fieldLabel}>운동 시간 (분)</label>
        <input
          type="number"
          value={draft.duration}
          onChange={(e) =>
            onChange({ ...draft, duration: parseInt(e.target.value) || 0 })
          }
          className={inputCls}
        />
      </div>
      <div>
        <label className={fieldLabel}>오늘의 작은 성공</label>
        <textarea
          value={draft.achievement}
          onChange={(e) => onChange({ ...draft, achievement: e.target.value })}
          rows={4}
          className={textareaCls}
        />
      </div>
    </div>
  );
}

function MorningEditor({
  draft,
  onChange,
}: {
  draft: MorningFeedData;
  onChange: (d: MorningFeedData) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={fieldLabel}>수면 시간</label>
          <input
            type="number"
            step="0.5"
            value={draft.sleepHours}
            onChange={(e) =>
              onChange({ ...draft, sleepHours: parseFloat(e.target.value) || 0 })
            }
            className={inputCls}
          />
        </div>
        <div>
          <label className={fieldLabel}>컨디션</label>
          <select
            value={draft.condition}
            onChange={(e) =>
              onChange({
                ...draft,
                condition: e.target.value as "상" | "중" | "하",
              })
            }
            className={inputCls}
          >
            <option value="상">상</option>
            <option value="중">중</option>
            <option value="하">하</option>
          </select>
        </div>
      </div>
      {draft.sleepHours < 7 && (
        <div>
          <label className={fieldLabel}>수면 부족 원인 & 개선 방법</label>
          <textarea
            value={draft.sleepImprovement ?? ""}
            onChange={(e) =>
              onChange({ ...draft, sleepImprovement: e.target.value })
            }
            rows={3}
            className={textareaCls}
          />
        </div>
      )}
      <div>
        <label className={fieldLabel}>오늘의 작은 성공</label>
        <textarea
          value={draft.success}
          onChange={(e) => onChange({ ...draft, success: e.target.value })}
          rows={3}
          className={textareaCls}
        />
      </div>
      <div>
        <label className={fieldLabel}>한 줄 회고</label>
        <textarea
          value={draft.reflection}
          onChange={(e) => onChange({ ...draft, reflection: e.target.value })}
          rows={2}
          className={textareaCls}
        />
      </div>
    </div>
  );
}

function FinanceEditor({
  draft,
  onChange,
}: {
  draft: FinanceFeedData;
  onChange: (d: FinanceFeedData) => void;
}) {
  const updateExpense = (
    dayIdx: number,
    expIdx: number,
    patch: Partial<ExpenseItem>,
  ) => {
    const next = { ...draft };
    next.dailyExpenses = next.dailyExpenses.map((d, i) =>
      i !== dayIdx
        ? d
        : {
            ...d,
            expenses: d.expenses.map((e, j) =>
              j !== expIdx ? e : { ...e, ...patch },
            ),
          },
    );
    onChange(next);
  };

  const removeExpense = (dayIdx: number, expIdx: number) => {
    const next = { ...draft };
    next.dailyExpenses = next.dailyExpenses.map((d, i) =>
      i !== dayIdx
        ? d
        : { ...d, expenses: d.expenses.filter((_, j) => j !== expIdx) },
    );
    onChange(next);
  };

  const addExpense = (dayIdx: number) => {
    const next = { ...draft };
    next.dailyExpenses = next.dailyExpenses.map((d, i) =>
      i !== dayIdx
        ? d
        : {
            ...d,
            expenses: [
              ...d.expenses,
              {
                id: `${Date.now()}`,
                name: "",
                amount: 0,
                type: "necessary" as ExpenseType,
              },
            ],
          },
    );
    onChange(next);
  };

  return (
    <div className="space-y-3">
      {draft.dailyExpenses.map((day, dIdx) => (
        <div key={dIdx} className="bg-gray-50 rounded-xl p-3">
          <p className="text-xs font-semibold text-gray-600 mb-2">{day.date}</p>
          <div className="space-y-2">
            {day.expenses.map((exp, eIdx) => (
              <div key={exp.id} className="bg-white rounded-lg p-2 flex items-center gap-2">
                <select
                  value={exp.type}
                  onChange={(e) =>
                    updateExpense(dIdx, eIdx, {
                      type: e.target.value as ExpenseType,
                    })
                  }
                  className="px-2 py-1 text-xs border border-gray-200 rounded"
                >
                  <option value="necessary">필요</option>
                  <option value="emotional">감정</option>
                  <option value="value">가치</option>
                </select>
                <input
                  type="text"
                  value={exp.name}
                  onChange={(e) =>
                    updateExpense(dIdx, eIdx, { name: e.target.value })
                  }
                  placeholder="품목"
                  className="flex-1 px-2 py-1 text-sm border border-gray-200 rounded"
                />
                <input
                  type="number"
                  value={exp.amount}
                  onChange={(e) =>
                    updateExpense(dIdx, eIdx, {
                      amount: parseInt(e.target.value) || 0,
                    })
                  }
                  className="w-24 px-2 py-1 text-sm border border-gray-200 rounded"
                />
                <button
                  type="button"
                  onClick={() => removeExpense(dIdx, eIdx)}
                  className="p-1 text-gray-400 hover:text-red-500"
                  aria-label="삭제"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => addExpense(dIdx)}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
            >
              <Plus className="w-3 h-3" />
              항목 추가
            </button>
          </div>
        </div>
      ))}
      <div>
        <label className={fieldLabel}>오늘의 자산관리 공부</label>
        <textarea
          value={draft.studyContent}
          onChange={(e) => onChange({ ...draft, studyContent: e.target.value })}
          rows={3}
          className={textareaCls}
        />
      </div>
      <div>
        <label className={fieldLabel}>오늘의 실천 (or 다짐)</label>
        <textarea
          value={draft.practice}
          onChange={(e) => onChange({ ...draft, practice: e.target.value })}
          rows={3}
          className={textareaCls}
        />
      </div>
    </div>
  );
}

function LanguageEditor({
  draft,
  onChange,
}: {
  draft: LanguageFeedData;
  onChange: (d: LanguageFeedData) => void;
}) {
  const updateExpr = (
    idx: number,
    patch: Partial<{ word: string; meaning: string; example: string }>,
  ) => {
    const next = { ...draft };
    next.expressions = next.expressions.map((e, i) =>
      i !== idx ? e : { ...e, ...patch },
    );
    onChange(next);
  };

  const removeExpr = (idx: number) => {
    onChange({
      ...draft,
      expressions: draft.expressions.filter((_, i) => i !== idx),
    });
  };

  const addExpr = () => {
    onChange({
      ...draft,
      expressions: [...draft.expressions, { word: "", meaning: "", example: "" }],
    });
  };

  return (
    <div className="space-y-3">
      {draft.expressions.map((expr, idx) => (
        <div key={idx} className="bg-gray-50 rounded-xl p-3 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-gray-500">표현 {idx + 1}</p>
            {draft.expressions.length > 1 && (
              <button
                type="button"
                onClick={() => removeExpr(idx)}
                className="p-1 text-gray-400 hover:text-red-500"
                aria-label="삭제"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <input
            type="text"
            value={expr.word}
            onChange={(e) => updateExpr(idx, { word: e.target.value })}
            placeholder="단어/표현"
            className={inputCls}
          />
          <input
            type="text"
            value={expr.meaning}
            onChange={(e) => updateExpr(idx, { meaning: e.target.value })}
            placeholder="뜻"
            className={inputCls}
          />
          <textarea
            value={expr.example}
            onChange={(e) => updateExpr(idx, { example: e.target.value })}
            placeholder="예문"
            rows={2}
            className={textareaCls}
          />
        </div>
      ))}
      <button
        type="button"
        onClick={addExpr}
        className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
      >
        <Plus className="w-3 h-3" />
        표현 추가
      </button>
    </div>
  );
}

function ReadingEditor({
  draft,
  onChange,
  isEnglishBook,
}: {
  draft: ReadingFeedData;
  onChange: (d: ReadingFeedData) => void;
  isEnglishBook: boolean;
}) {
  const isPercent = draft.trackingType === "percent";
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={fieldLabel}>{isPercent ? "현재 %" : "현재 페이지"}</label>
          <input
            type="number"
            value={draft.pagesRead ?? 0}
            onChange={(e) =>
              onChange({ ...draft, pagesRead: parseInt(e.target.value) || 0 })
            }
            className={inputCls}
          />
        </div>
        <div>
          <label className={fieldLabel}>오늘 진도</label>
          <input
            type="number"
            value={draft.progressAmount ?? 0}
            onChange={(e) =>
              onChange({
                ...draft,
                progressAmount: parseInt(e.target.value) || 0,
              })
            }
            className={inputCls}
          />
        </div>
      </div>
      {!isEnglishBook && (
        <>
          <div>
            <label className={fieldLabel}>유형</label>
            <select
              value={draft.noteType ?? "sentence"}
              onChange={(e) =>
                onChange({
                  ...draft,
                  noteType: e.target.value as "sentence" | "summary",
                })
              }
              className={inputCls}
            >
              <option value="sentence">오늘의 문장</option>
              <option value="summary">내용 요약</option>
            </select>
          </div>
          <div>
            <label className={fieldLabel}>
              {draft.noteType === "summary" ? "내용 요약" : "오늘의 문장"}
            </label>
            <textarea
              value={draft.note ?? ""}
              onChange={(e) => onChange({ ...draft, note: e.target.value })}
              rows={4}
              className={textareaCls}
            />
          </div>
          <div>
            <label className={fieldLabel}>나만의 생각</label>
            <textarea
              value={draft.thoughts ?? ""}
              onChange={(e) => onChange({ ...draft, thoughts: e.target.value })}
              rows={3}
              className={textareaCls}
            />
          </div>
        </>
      )}
    </div>
  );
}

function RecordingEditor({
  draft,
  onChange,
}: {
  draft: RecordingFeedData;
  onChange: (d: RecordingFeedData) => void;
}) {
  return (
    <div className="space-y-3">
      <div>
        <label className={fieldLabel}>내용</label>
        <textarea
          value={draft.content}
          onChange={(e) => onChange({ ...draft, content: e.target.value })}
          rows={6}
          className={textareaCls}
        />
      </div>
      <div>
        <label className={fieldLabel}>인증 링크</label>
        <input
          type="url"
          value={draft.link ?? ""}
          onChange={(e) => onChange({ ...draft, link: e.target.value })}
          className={inputCls}
        />
      </div>
    </div>
  );
}
