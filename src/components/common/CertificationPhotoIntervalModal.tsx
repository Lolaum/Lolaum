"use client";

import { CERT_PHOTO_INTERVAL_MESSAGE } from "@/lib/utils";

interface CertificationPhotoIntervalModalProps {
  open: boolean;
  onClose: () => void;
}

export default function CertificationPhotoIntervalModal({
  open,
  onClose,
}: CertificationPhotoIntervalModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cert-photo-interval-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xs rounded-2xl bg-white p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3
          id="cert-photo-interval-title"
          className="text-base font-semibold text-gray-900"
        >
          인증 사진은 10분 이상 간격이 필요합니다
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-gray-500">
          {CERT_PHOTO_INTERVAL_MESSAGE}
        </p>
        <div className="mt-5">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: "#eab32e" }}
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
}
