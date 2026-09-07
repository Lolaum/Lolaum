"use client";

import { useState } from "react";
import TimePickerField, { fromTimeValue, toTimeValue, type TimeParts } from "./TimePickerField";

export default function RoutineTimeFields({
  startTime,
  endTime,
  onStartChange,
  onEndChange,
}: {
  startTime: string;
  endTime: string;
  onStartChange: (value: string) => void;
  onEndChange: (value: string) => void;
}) {
  const [openPicker, setOpenPicker] = useState<"start" | "end" | null>(null);
  const [startParts, setStartParts] = useState(() => fromTimeValue(startTime));
  const [endParts, setEndParts] = useState(() => fromTimeValue(endTime));

  function updateParts(target: "start" | "end", patch: Partial<TimeParts>) {
    const next = { ...(target === "start" ? startParts : endParts), ...patch };
    if (target === "start") {
      setStartParts(next);
      onStartChange(toTimeValue(next));
    } else {
      setEndParts(next);
      onEndChange(toTimeValue(next));
    }
  }

  return (
    <>
      <div className="grid min-w-0 grid-cols-2 gap-2">
        <TimePickerField
          label="시작"
          parts={startParts}
          isOpen={openPicker === "start"}
          onToggle={() => setOpenPicker((current) => current === "start" ? null : "start")}
          onChange={(patch) => updateParts("start", patch)}
          onConfirm={() => setOpenPicker(null)}
        />
        <TimePickerField
          label="종료"
          parts={endParts}
          isOpen={openPicker === "end"}
          align="right"
          onToggle={() => setOpenPicker((current) => current === "end" ? null : "end")}
          onChange={(patch) => updateParts("end", patch)}
          onConfirm={() => setOpenPicker(null)}
        />
      </div>
      <p className="mt-2 text-xs text-gray-500">
        {startTime && endTime && endTime < startTime && "종료 시간은 다음 날 기준이에요. "}
        휴대폰 알람도 변경한 시간에 맞춰주세요.
      </p>
    </>
  );
}
