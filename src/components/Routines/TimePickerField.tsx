"use client";

import { Clock3 } from "lucide-react";

type TimePeriod = "AM" | "PM" | "";

export interface TimeParts {
  period: TimePeriod;
  hour: string;
  minute: string;
}

export function fromTimeValue(value: string): TimeParts {
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) return { period: "", hour: "", minute: "" };
  const [hour, minute] = value.split(":");
  const hourNumber = Number(hour);
  return { period: hourNumber < 12 ? "AM" : "PM", hour: String(hourNumber % 12 || 12).padStart(2, "0"), minute };
}

const HOUR_OPTIONS = Array.from({ length: 12 }, (_, index) =>
  String(index + 1).padStart(2, "0"),
);
const MINUTE_OPTIONS = Array.from({ length: 12 }, (_, index) =>
  String(index * 5).padStart(2, "0"),
);

export function toTimeValue(parts: TimeParts) {
  if (!parts.period || !parts.hour || !parts.minute) return "";
  let hour = Number(parts.hour);
  if (parts.period === "AM" && hour === 12) hour = 0;
  if (parts.period === "PM" && hour !== 12) hour += 12;
  return `${String(hour).padStart(2, "0")}:${parts.minute}`;
}

function formatTimeLabel(parts: TimeParts) {
  if (!parts.period || !parts.hour || !parts.minute) return "--:--";
  return `${parts.period === "AM" ? "오전" : "오후"} ${parts.hour}:${parts.minute}`;
}

export default function TimePickerField({
  label,
  parts,
  isOpen,
  align = "left",
  onToggle,
  onChange,
  onConfirm,
}: {
  label: string;
  parts: TimeParts;
  isOpen: boolean;
  align?: "left" | "right";
  onToggle: () => void;
  onChange: (patch: Partial<TimeParts>) => void;
  onConfirm: () => void;
}) {
  const isComplete = Boolean(parts.period && parts.hour && parts.minute);

  return (
    <div className="relative min-w-0">
      <span className="mb-1 block text-xs font-medium text-gray-400">
        {label}
      </span>
      <button
        type="button"
        onClick={onToggle}
        aria-label={`${label} 시간 ${formatTimeLabel(parts)}`}
        aria-expanded={isOpen}
        className="flex w-full min-w-0 items-center justify-between gap-1 rounded-2xl border border-gray-200 bg-gray-50 px-2 py-3 sm:px-4 text-left text-sm font-semibold text-gray-800 transition-all focus:border-[var(--gold-400)] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[var(--gold-400)]/30"
      >
        <span className="truncate">{formatTimeLabel(parts)}</span>
        <Clock3 size={18} className="shrink-0 text-gray-500" />
      </button>

      {isOpen && (
        <div
          className={`absolute top-full z-[80] mt-2 grid w-[calc(200%+0.5rem)] max-w-72 grid-cols-3 gap-2 rounded-2xl border border-gray-200 bg-white p-2 shadow-xl ${
            align === "right" ? "right-0" : "left-0"
          }`}
        >
          <div className="max-h-56 overflow-y-auto">
            {[
              { value: "AM", label: "오전" },
              { value: "PM", label: "오후" },
            ].map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() =>
                  onChange({ period: option.value as TimePeriod })
                }
                className={`mb-1 w-full rounded-xl px-3 py-2 text-sm font-bold transition-colors ${
                  parts.period === option.value
                    ? "bg-blue-500 text-white"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
          <div className="max-h-56 overflow-y-auto">
            {HOUR_OPTIONS.map((hour) => (
              <button
                key={hour}
                type="button"
                onClick={() => onChange({ hour })}
                className={`mb-1 w-full rounded-xl px-3 py-2 text-sm font-bold transition-colors ${
                  parts.hour === hour
                    ? "bg-blue-500 text-white"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                {hour}
              </button>
            ))}
          </div>
          <div className="max-h-56 overflow-y-auto">
            {[...new Set([...MINUTE_OPTIONS, ...(parts.minute ? [parts.minute] : [])])].sort().map((minute) => (
              <button
                key={minute}
                type="button"
                onClick={() => onChange({ minute })}
                className={`mb-1 w-full rounded-xl px-3 py-2 text-sm font-bold transition-colors ${
                  parts.minute === minute
                    ? "bg-blue-500 text-white"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                {minute}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={onConfirm}
            disabled={!isComplete}
            className="col-span-3 rounded-xl bg-[#eab32e] px-3 py-2.5 text-sm font-bold text-white transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
          >
            확인
          </button>
        </div>
      )}
    </div>
  );
}

