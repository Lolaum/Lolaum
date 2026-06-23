"use client";

import { useState } from "react";

interface RitualDraftButtonsProps {
  hasDraft: boolean;
  loading?: boolean;
  saving?: boolean;
  onSave: () => void | Promise<{ error?: string } | void>;
  onLoad: () => void;
  imageNotice?: string;
}

export default function RitualDraftButtons({
  hasDraft,
  loading = false,
  saving = false,
  onSave,
  onLoad,
  imageNotice = "인증 이미지는 저장되지 않습니다.",
}: RitualDraftButtonsProps) {
  const [modal, setModal] = useState<{
    type: "success" | "error";
    title: string;
    message: string;
  } | null>(null);

  const handleSave = async () => {
    const result = await onSave();
    if (result?.error) {
      setModal({
        type: "error",
        title: "임시저장에 실패했어요",
        message: result.error,
      });
      return;
    }

    setModal({
      type: "success",
      title: "임시저장 완료",
      message:
        "작성 중인 내용은 계정에 임시 저장됩니다.\n 다른 기기에서도 이어서 작성할 수 있으며,\n 다시 임시 저장하면 최신 내용으로 업데이트됩니다.",
    });
  };

  return (
    <>
      <div className="mb-3 rounded-xl border border-gray-100 bg-gray-50 px-3 py-2">
        <div className="mb-1.5 flex items-center justify-between gap-2">
          <p className="text-xs font-semibold text-gray-500">작성 중인 내용</p>
          {hasDraft && (
            <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-bold text-orange-600">
              저장본 있음
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-gray-500 transition-colors hover:border-orange-200 hover:text-orange-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "임시저장 중..." : "임시저장"}
          </button>
          <button
            type="button"
            onClick={onLoad}
            disabled={loading || saving || !hasDraft}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-gray-500 transition-colors hover:border-orange-200 hover:text-orange-500 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-300"
          >
            {loading ? "확인 중..." : "불러오기"}
          </button>
        </div>

        <p className="mt-1.5 text-[12px] leading-relaxed text-gray-400">
          다른 기기에서도 이어서 작성할 수 있으며{" "}
          <span className="font-bold text-red-500">{imageNotice}</span>
        </p>
      </div>

      {modal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="ritual-draft-modal-title"
          onClick={() => setModal(null)}
        >
          <div
            className="w-full max-w-xs rounded-2xl bg-white p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3
              id="ritual-draft-modal-title"
              className="text-base font-semibold text-gray-900"
            >
              {modal.title}
            </h3>
            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-gray-500">
              {modal.type === "success" && imageNotice ? (
                <>
                  {modal.message.replace(imageNotice, "").trim()}
                  {"\n"}
                  <span className="font-bold text-red-500">{imageNotice}</span>
                </>
              ) : (
                modal.message
              )}
            </p>
            <div className="mt-5">
              <button
                type="button"
                onClick={() => setModal(null)}
                className="w-full rounded-xl py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
                style={{
                  backgroundColor:
                    modal.type === "success" ? "#eab32e" : "#ef4444",
                }}
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
