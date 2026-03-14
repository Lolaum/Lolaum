"use client";

import { useState, useMemo } from "react";
import { ChevronDown } from "lucide-react";
import { MorningRecord, ConditionLevel } from "@/types/routines/morning";

interface GroupedRecord {
  date: string;
  image?: string;
  sleepHours: number;
  condition: ConditionLevel;
  successAndReflection: string;
  gift: string;
}

interface RecordMorningProps {
  morningRecords: MorningRecord[];
}

export default function RecordMorning({
  morningRecords,
}: RecordMorningProps) {
  const [expandedDates, setExpandedDates] = useState<string[]>([]);

  // 날짜별로 그룹화
  const groupedRecords = useMemo(() => {
    const grouped = morningRecords.reduce(
      (acc, record) => {
        if (!acc[record.date]) {
          acc[record.date] = {
            date: record.date,
            image: record.image,
            sleepHours: record.sleepHours,
            condition: record.condition,
            successAndReflection: record.successAndReflection,
            gift: record.gift,
          };
        }

        return acc;
      },
      {} as Record<string, GroupedRecord>,
    );

    return Object.values(grouped);
  }, [morningRecords]);

  const toggleExpand = (date: string) => {
    setExpandedDates((prev) =>
      prev.includes(date) ? prev.filter((d) => d !== date) : [...prev, date],
    );
  };

  return (
    <>
      {/* 모닝 기록 섹션 */}
      <div className="mb-4">
        <h2 className="text-base font-semibold text-gray-900">모닝 기록</h2>
      </div>

      {/* Collapsible 리스트 */}
      <div className="space-y-2">
        {groupedRecords.map((group) => {
          const isExpanded = expandedDates.includes(group.date);

          return (
            <div
              key={group.date}
              className="bg-white rounded-2xl border border-gray-200 overflow-hidden transition-all"
            >
              {/* 헤더 (클릭 가능) */}
              <button
                type="button"
                onClick={() => toggleExpand(group.date)}
                className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors text-left"
              >
                <div className="flex-1">
                  <h3 className="text-base font-bold text-gray-900 mb-1">
                    {group.date}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {group.successAndReflection}
                  </p>
                </div>
                <div className="flex items-center gap-3 ml-4">
                  <span className="text-xs text-yellow-500 font-medium">{group.sleepHours}h</span>
                  <span className="text-sm text-yellow-500 font-medium">
                    {group.condition}
                  </span>
                  <ChevronDown
                    className={`w-5 h-5 text-gray-400 transition-transform ${
                      isExpanded ? "rotate-180" : ""
                    }`}
                  />
                </div>
              </button>

              {/* 확장된 내용 */}
              {isExpanded && (
                <div className="px-4 pb-4 pt-2 border-t border-gray-100">
                  {/* 모닝 상세 정보 */}
                  <div className="space-y-3">
                    {/* 인증 사진 */}
                    {group.image && (
                      <div className="mb-3">
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">
                          인증 사진
                        </h4>
                        <img
                          src={group.image}
                          alt="모닝 인증"
                          className="w-full h-48 object-cover rounded-xl"
                        />
                      </div>
                    )}

                    {/* 수면 시간 & 컨디션 */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-yellow-50 rounded-xl p-3">
                        <p className="text-xs text-yellow-500 font-medium mb-1">수면 시간</p>
                        <p className="text-2xl font-bold text-gray-800">{group.sleepHours}<span className="text-sm font-medium text-gray-500">h</span></p>
                      </div>
                      <div className="bg-yellow-50 rounded-xl p-3">
                        <p className="text-xs text-yellow-500 font-medium mb-1">컨디션</p>
                        <p className="text-2xl font-bold text-gray-800">{group.condition}</p>
                      </div>
                    </div>

                    {/* 오늘의 작은 성공 & 한 줄 회고 */}
                    <div className="bg-gray-50 rounded-xl p-4">
                      <p className="text-xs text-gray-400 font-medium mb-1">오늘의 성공 & 한 줄 회고</p>
                      <p className="text-sm text-gray-700 leading-relaxed">
                        {group.successAndReflection}
                      </p>
                    </div>

                    {/* 오늘 나에게 주는 선물 */}
                    <div className="bg-gray-50 rounded-xl p-4">
                      <p className="text-xs text-gray-400 font-medium mb-1">오늘 나에게 주는 선물</p>
                      <p className="text-sm text-gray-700 leading-relaxed">
                        {group.gift}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
