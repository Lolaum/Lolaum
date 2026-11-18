"use client";

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Check,
  Flower2,
  RotateCcw,
  Sparkles,
  X,
} from "lucide-react";
import type {
  AnnualRecap,
  RecapCount,
  RecapQuote,
  RecapRoutineInsight,
} from "@/types/annual-recap";
import { RECAP_START_DATE } from "@/types/annual-recap";
import type { RoutineTypeDB } from "@/types/supabase";
import { ROUTINE_TYPE_LABEL } from "@/types/supabase";
import type { RoutineType } from "@/types/routines/declaration";
import { ROUTINE_CONFIG } from "@/lib/routineConfig";
import { routineLabel } from "@/lib/annual-recap-insights";
import styles from "./AnnualRecapStory.module.css";
import RecapSummary from "./RecapSummary";
import MilestoneToggle from "./MilestoneToggle";

type Page = { id: string; label: string; routine?: RecapRoutineInsight };
const n = (value: number) => value.toLocaleString("ko-KR");
const monthsLabel = (months: number[]) =>
  months.map((month) => `${month}월`).join(" · ");
const dateLabel = (date: string) =>
  `${Number(date.slice(5, 7))}월 ${Number(date.slice(8, 10))}일`;
const labels = (types: RoutineTypeDB[]) => types.map(routineLabel).join(" · ");
const objectParticle = (text: string) => {
  const code = text.charCodeAt(text.length - 1) - 0xac00;
  return code >= 0 && code <= 11171 && code % 28 !== 0 ? "을" : "를";
};

function pagesFor(data: AnnualRecap): Page[] {
  if (!data.participation.months.length && !data.activity.recordCount)
    return [{ id: "empty", label: "나의 2026" }];
  return [
    { id: "cover", label: "나의 2026" },
    { id: "summary", label: "한눈에 보기" },
    { id: "participation", label: "함께한 달" },
    { id: "favorites", label: "나의 선택" },
    { id: "variety", label: "리추얼의 조합" },
    { id: "activity", label: "차곡차곡 쌓인 실천" },
    { id: "months", label: "월별 기록" },
    { id: "milestones", label: "기억할 순간" },
    { id: "achievement", label: "나의 달성" },
    { id: "rates", label: "기수별 발자취" },
    { id: "reflection", label: "그때의 나, 지금의 나" },
    { id: "conditions", label: "나를 알아가는 시간" },
    ...data.routines.map((routine) => ({
      id: `routine-${routine.type}`,
      label: `${routine.label} 이야기`,
      routine,
    })),
    { id: "closing", label: "올해의 나" },
  ];
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.card}>
      <p className={`${styles.muted} text-xs leading-relaxed`}>{label}</p>
      <p className={`${styles.statValue} mt-3`}>{value}</p>
    </div>
  );
}

function Note({ children }: { children: ReactNode }) {
  return (
    <p className={`${styles.muted} mt-5 text-xs leading-relaxed`}>{children}</p>
  );
}

function Quote({
  quote,
  empty,
  title,
}: {
  quote: RecapQuote | null;
  empty: string;
  title: string;
}) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className={styles.card}>
      <p className={`${styles.accent} mb-4 text-xs font-semibold`}>{title}</p>
      {quote ? (
        <>
          <blockquote className={styles.quote}>
            {expanded ? quote.text : quote.text.slice(0, 220)}
            {!expanded && quote.text.length > 220 ? "…" : ""}
          </blockquote>
          {quote.text.length > 220 && (
            <button
              className={`${styles.accent} mt-2 min-h-11 text-xs underline underline-offset-4`}
              onClick={() => setExpanded(!expanded)}
              aria-expanded={expanded}
            >
              {expanded ? "접기" : "더 읽기"}
            </button>
          )}
          <p className={`${styles.muted} mt-4 text-xs`}>
            {dateLabel(quote.date)} · {quote.label}
          </p>
        </>
      ) : (
        <p className={`${styles.muted} text-sm leading-relaxed`}>{empty}</p>
      )}
    </div>
  );
}

function Ranking({ items, empty }: { items: RecapCount[]; empty: string }) {
  if (!items.length)
    return <p className={`${styles.muted} py-3 text-sm`}>{empty}</p>;
  return (
    <ol className="space-y-4">
      {items.map((item, i) => (
        <li key={item.label} className="flex items-start gap-3">
          <span className={`${styles.accent} pt-0.5 text-xs tabular-nums`}>
            {String(i + 1).padStart(2, "0")}
          </span>
          <span className="min-w-0 flex-1 text-sm leading-relaxed">
            {item.label}
          </span>
          <span className={`${styles.muted} shrink-0 pt-0.5 text-xs`}>
            {n(item.count)}회
          </span>
        </li>
      ))}
    </ol>
  );
}

function Bloom() {
  return (
    <svg viewBox="0 0 240 240" className={styles.bloom} aria-hidden="true">
      {Array.from({ length: 10 }, (_, i) => (
        <ellipse
          key={i}
          cx="120"
          cy="73"
          rx="24"
          ry="57"
          fill="currentColor"
          opacity=".65"
          transform={`rotate(${i * 36} 120 120)`}
        />
      ))}
      <circle cx="120" cy="120" r="38" fill="var(--recap-bg)" />
      <circle cx="120" cy="120" r="22" fill="var(--gold-600)" />
    </svg>
  );
}

function RoutineContent({ routine }: { routine: RecapRoutineInsight }) {
  return (
    <>
      <div className="mb-7 mt-8 flex items-end gap-4">
        <p className={styles.heroNumber}>
          {n(routine.recordDays)}
          <small>일</small>
        </p>
        <p className={`${styles.muted} mb-2 text-sm`}>
          기록으로 남긴
          <br />
          나를 위한 시간
        </p>
      </div>
      {!!routine.metrics.length && (
        <div className="grid grid-cols-2 gap-3">
          {routine.metrics.map((metric, i) => (
            <Stat key={`${metric.label}-${i}`} {...metric} />
          ))}
        </div>
      )}
      {!!routine.highlights.length && (
        <div className={`${styles.softCard} mt-4`}>
          <p className={`${styles.accent} mb-3 text-xs font-semibold`}>
            {["reading", "english_book"].includes(routine.type)
              ? "올해 펼친 책들"
              : routine.type === "exercise"
                ? "자주 함께한 운동"
                : "기록 속 장면들"}
          </p>
          <ul className="space-y-3">
            {routine.highlights.map((text, i) => (
              <li key={i} className="flex gap-2 text-sm leading-relaxed">
                <span
                  className={`${styles.accent} mt-0.5 shrink-0`}
                  aria-hidden="true"
                >
                  ↗
                </span>
                <span>
                  {text.slice(0, 180)}
                  {text.length > 180 ? "…" : ""}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
      <Note>{routine.note}</Note>
    </>
  );
}

function pageTitle(page: Page, data: AnnualRecap): string {
  const { participation: p, activity: a } = data;
  if (page.routine)
    return page.routine.recordDays > 0
      ? `${page.routine.label}로 채운\n나만의 시간`
      : `${page.routine.label}\n올해의 기록`;
  switch (page.id) {
    case "cover":
      return "나를 위해\n쌓아온 한 해";
    case "summary":
      return "2026 리추얼";
    case "participation":
      return "올해 리추얼과\n함께한 시간";
    case "favorites": {
      const favorite = labels(p.favorites);
      return favorite
        ? `${favorite}${objectParticle(favorite)}\n가장 많이 선택했어요.`
        : "내가 선택한\n리추얼을 돌아봐요.";
    }
    case "variety":
      return "서로 다른 실천이\n나의 하루를 채웠어요.";
    case "activity":
      return "작은 실천이 모여\n이만큼의 기록이 됐어요.";
    case "months":
      return a.busiestMonths.length
        ? `${monthsLabel(a.busiestMonths)}에\n가장 많은 기록을 남겼어요.`
        : "기록으로 채워갈\n열두 달이 있어요.";
    case "milestones":
      return "처음의 한 걸음부터,\n기억하고 싶은 순간까지.";
    case "achievement":
      return "나와의 약속을\n지켜낸 순간들.";
    case "rates":
      return "나만의 속도로\n한 기수씩 쌓아왔어요.";
    case "reflection":
      return "시작할 때의 마음,\n지금의 나에게.";
    case "conditions":
      return "꾸준함의 모양은\n사람마다 다르니까.";
    case "closing":
      return `${data.name}님의 2026,\n이렇게 기억할게요.`;
    default:
      return "올해의 이야기를\n시작해 볼까요?";
  }
}

function PageContent({ page, data }: { page: Page; data: AnnualRecap }) {
  const { participation: p, activity: a, achievement: g, reflection: r } = data;
  if (page.routine) return <RoutineContent routine={page.routine} />;
  switch (page.id) {
    case "summary":
      return <RecapSummary data={data} />;
    case "cover":
      return (
        <div className={styles.cover}>
          <div className="my-7 flex items-center justify-between gap-2">
            <span className={styles.coverYear}>2026</span>
            <Bloom />
          </div>
          <p className={styles.description}>
            {data.name}님이 선택하고, 실천하고, 돌아본 시간.
            <br />그 안에 담긴 나의 이야기를 만나보세요.
          </p>
          <div className="mt-7 flex flex-wrap gap-2">
            <span className={styles.tag}>{p.months.length}개월 참여</span>
            <span className={styles.tag}>{n(a.days)}일의 기록</span>
            <span className={styles.tag}>{p.routines.length}가지 리추얼</span>
          </div>
          <Note>
            {dateLabel(RECAP_START_DATE)}부터 {dateLabel(data.asOf)}까지의
            기록을 담았어요. 한 장씩 넘겨보세요.
          </Note>
        </div>
      );
    case "participation":
      return (
        <>
          <div className="my-8">
            <p className={styles.heroNumber}>
              {p.months.length}
              <small>개월</small>
            </p>
            <p className={`${styles.muted} mt-3 text-sm`}>
              리추얼을 신청한 달을 기준으로 계산했어요.
            </p>
          </div>
          <div
            className="grid grid-cols-4 gap-2 sm:grid-cols-8"
            aria-label="2026년 참여한 달"
          >
            {a.monthly.map(({ month }) => (
              <div
                key={month}
                className="flex aspect-square flex-col items-center justify-center gap-1 rounded-2xl text-sm"
                style={{
                  background: p.months.includes(month)
                    ? "var(--recap-accent)"
                    : "var(--recap-soft)",
                  color: p.months.includes(month)
                    ? "var(--recap-ink)"
                    : "var(--recap-muted)",
                }}
              >
                <span>{month}월</span>
                {p.months.includes(month) && (
                  <Check size={13} aria-label="참여" />
                )}
              </div>
            ))}
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <Stat label="최장 연속 참여" value={`${p.longestMonths}개월`} />
            <Stat
              label="올해 첫 참여"
              value={p.months.length ? `${p.months[0]}월` : "아직 없어요"}
            />
          </div>
        </>
      );
    case "favorites":
      return (
        <>
          <p className={styles.description}>
            다시 선택했다는 건, 내 일상에 두고 싶었다는 뜻일 거예요.
          </p>
          <div className={`${styles.card} mt-7 space-y-5`}>
            {p.routines.length ? (
              p.routines.map((routine) => (
                <div key={routine.type}>
                  <div className="mb-2 flex items-center justify-between gap-4 text-sm">
                    <span className="font-medium">{routine.label}</span>
                    <span className={styles.muted}>
                      {routine.months}개월 선택
                    </span>
                  </div>
                  <div className={styles.bar}>
                    <span
                      style={{
                        width: `${(routine.months / (p.months.length || 1)) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <p className={`${styles.muted} text-sm`}>
                현재 남아 있는 올해 신청 내역이 없어요.
              </p>
            )}
          </div>
        </>
      );
    case "variety":
      return (
        <>
          <div className="my-8">
            <p className={styles.heroNumber}>
              {p.routines.length}
              <small>가지 리추얼</small>
            </p>
          </div>
          <div className="mb-6 flex flex-wrap gap-2">
            {p.routines.map((routine) => (
              <span key={routine.type} className={styles.tag}>
                {routine.label}
              </span>
            ))}
          </div>
          <div className={styles.softCard}>
            <p className={`${styles.accent} mb-3 text-xs font-semibold`}>
              가장 자주 함께 선택한 조합
            </p>
            {p.combinations.length ? (
              <>
                <p className="text-xl font-semibold leading-relaxed">
                  {p.combinations
                    .slice(0, 3)
                    .map((pair) => labels(pair.types))
                    .join(" / ")}
                </p>
                <p className={`${styles.muted} mt-2 text-sm`}>
                  {p.combinations[0].months}개월 함께 선택했어요
                  {p.combinations.length > 3
                    ? ` · 공동 최다 ${p.combinations.length}개 조합`
                    : ""}
                </p>
                {p.combinations.length > 3 && (
                  <details className="mt-3 text-sm">
                    <summary className="cursor-pointer py-2">
                      모든 공동 최다 조합 보기
                    </summary>
                    <p className="mt-2 leading-loose">
                      {p.combinations
                        .slice(3)
                        .map((pair) => labels(pair.types))
                        .join(" / ")}
                    </p>
                  </details>
                )}
              </>
            ) : (
              <p className="text-sm leading-relaxed">
                한 가지 리추얼에 집중한 달들이었어요.
              </p>
            )}
          </div>
          <div
            className={`${styles.card} mt-4 flex items-center justify-between gap-4`}
          >
            <div>
              <p className={`${styles.muted} text-xs`}>
                한 달에 가장 다양한 선택
              </p>
              <p className="mt-2 text-sm">
                {monthsLabel(p.maxRoutineMonths) || "아직 신청 내역이 없어요"}
              </p>
            </div>
            <p className={styles.statValue}>
              {p.maxRoutineCount}
              <span className="ml-1 text-sm font-normal">가지</span>
            </p>
          </div>
          <Note>조합은 같은 달에 선택한 두 리추얼을 기준으로 세었어요.</Note>
        </>
      );
    case "activity":
      return (
        <>
          <div className="my-8">
            <p className={styles.heroNumber}>
              {n(a.certificationCount)}
              <small>번의 인증</small>
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Stat label="총 기록 작성" value={`${n(a.recordCount)}건`} />
            <Stat label="기록을 남긴 날" value={`${n(a.days)}일`} />
          </div>
          <div className={`${styles.softCard} mt-4 flex items-center gap-4`}>
            <Flower2
              size={36}
              className={`${styles.accent} shrink-0`}
              aria-hidden="true"
            />
            <div>
              <p className="text-sm">가장 오래 이어 쓴 기록</p>
              <p className="mt-1 text-2xl font-semibold">
                {a.longestStreak}일 연속
              </p>
            </div>
          </div>
          <Note>
            인증은 같은 날·같은 리추얼당 1회예요. 작성 건수는 모든 기록을 세고,
            기록 일수와 연속 기록은 날짜 기준으로 세어요.
          </Note>
        </>
      );
    case "months": {
      const maximum = Math.max(1, ...a.monthly.map((month) => month.records));
      const currentMonth = Number(data.asOf.slice(5, 7));
      return (
        <>
          <p className={styles.description}>
            바쁜 달도, 잠시 쉬어간 달도.
            <br />
            모두 나의 한 해를 이루는 조각이에요.
          </p>
          <div className={`${styles.card} mt-7`}>
            <p className={`${styles.muted} mb-7 text-xs`}>
              월별 기록 작성 건수
            </p>
            <div
              className="grid grid-cols-8 items-end gap-1 sm:gap-3"
              role="img"
              aria-label={a.monthly
                .filter((month) => month.month <= currentMonth)
                .map((month) => `${month.month}월 ${month.records}건`)
                .join(", ")}
            >
              {a.monthly.map((month) => (
                <div
                  key={month.month}
                  className="flex min-w-0 flex-col items-center gap-2"
                >
                  <span className={`${styles.muted} text-[10px] tabular-nums`}>
                    {month.month > currentMonth ? "–" : month.records}
                  </span>
                  <div className="flex h-36 w-full max-w-9 items-end">
                    <div
                      className="w-full rounded-t-lg"
                      style={{
                        height: `${Math.max(2, (month.records / maximum) * 100)}%`,
                        background: a.busiestMonths.includes(month.month)
                          ? "var(--recap-accent)"
                          : "var(--recap-soft)",
                        opacity: month.month > currentMonth ? 0.35 : 1,
                      }}
                    />
                  </div>
                  <span className={`${styles.muted} text-[10px]`}>
                    {month.month}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <details className={`${styles.card} mt-4`}>
            <summary className="cursor-pointer text-sm">
              월별 인증 횟수와 기록 일수도 보기
            </summary>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className={styles.muted}>
                  <tr>
                    <th className="pb-3 font-normal">월</th>
                    <th className="pb-3 font-normal">기록</th>
                    <th className="pb-3 font-normal">인증</th>
                    <th className="pb-3 font-normal">기록한 날</th>
                  </tr>
                </thead>
                <tbody>
                  {a.monthly
                    .filter((month) => month.month <= currentMonth)
                    .map((month) => (
                      <tr key={month.month}>
                        <th className="py-2 font-medium">{month.month}월</th>
                        <td>{n(month.records)}건</td>
                        <td>{n(month.certifications)}회</td>
                        <td>{month.days}일</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </details>
        </>
      );
    }
    case "milestones":
      return (
        <>
          <div className="mt-7 grid gap-4 sm:grid-cols-2">
            <Quote
              quote={a.firstRecord}
              title="올해 첫 기록"
              empty="첫 기록이 쌓이면 이곳에서 만나요."
            />
            <Quote
              quote={a.lastRecord}
              title="올해 마지막 기록"
              empty="아직 기록이 없어요."
            />
          </div>
          {a.milestones.length > 0 && (
            <div className={`${styles.softCard} mt-4`}>
              <h2 className={`${styles.accent} text-sm font-semibold`}>
                나의 인증 이정표
              </h2>
              <p className={`${styles.muted} mt-2 text-xs leading-relaxed`}>
                이정표를 펼쳐 그때 남긴 글을 읽어보세요.
              </p>
              <ol className={styles.milestones}>
                {a.milestones.map((milestone) => (
                  <li key={milestone.count}>
                    <MilestoneToggle milestone={milestone} />
                  </li>
                ))}
              </ol>
            </div>
          )}
        </>
      );
    case "achievement": {
      const best = g.periods.filter((period) => g.bestIds.includes(period.id));
      return (
        <>
          <div className="my-8">
            <p className={`${styles.muted} mb-3 text-sm`}>
              가장 높은 기수 달성률
            </p>
            <p className={styles.heroNumber}>
              {best[0]?.rate ?? 0}
              <small>%</small>
            </p>
            <p className="mt-4 text-sm leading-relaxed">
              {best.map((period) => period.label).join(" · ") ||
                "신청 내역이 쌓이면 보여드릴게요."}
            </p>
          </div>
          {g.perfectCount > 0 && (
            <div className={`${styles.softCard} mb-4 flex items-center gap-3`}>
              <Sparkles
                className={`${styles.accent} shrink-0`}
                size={24}
                aria-hidden="true"
              />
              <p className="text-sm">
                <strong>{g.perfectCount}개 기수</strong>에서 100%를 달성했어요.
              </p>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <Stat
              label="신청한 리추얼을 모두 기록한 날"
              value={`${n(g.allRoutineDays)}일`}
            />
            <Stat label="주간 목표를 채운 주" value={`${g.completeWeeks}주`} />
          </div>
          <Note>
            달성률에는 선언·중간회고·최종회고와 주간 보충 인증이 반영돼요. 100%
            기수와 주간 목표는 기간이 끝난 경우만 세어요. 모두 기록한 날은 같은
            날 모든 신청 리추얼을 인증한 날이에요.
          </Note>
        </>
      );
    }
    case "rates":
      return (
        <>
          <p className={styles.description}>
            각 기수에서 나와의 약속을 얼마나 채웠는지 돌아봐요.
          </p>
          <div className={`${styles.card} mt-7 space-y-5`}>
            {g.periods.length ? (
              g.periods.map((period) => (
                <div key={period.id}>
                  <div className="mb-2 flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium">{period.label}</p>
                      <p className={`${styles.muted} mt-1 text-[11px]`}>
                        {dateLabel(period.start)} – {dateLabel(period.end)}
                        {!period.ended ? " · 진행 중" : ""}
                      </p>
                    </div>
                    <span className={`${styles.accent} text-lg font-semibold`}>
                      {period.rate}%
                    </span>
                  </div>
                  <div className={styles.bar}>
                    <span style={{ width: `${period.rate}%` }} />
                  </div>
                </div>
              ))
            ) : (
              <p className={`${styles.muted} text-sm`}>
                달성률을 계산할 신청 내역이 아직 없어요.
              </p>
            )}
          </div>
          <Note>
            진행 중인 기수도 전체 목표를 기준으로 표시해요. 기수마다 기간과 신청
            리추얼이 달라 달성률의 차이가 곧 성장이나 퇴보를 뜻하지는 않아요.
          </Note>
        </>
      );
    case "reflection":
      return (
        <>
          <p className={styles.description}>
            숫자에 담기지 않는 변화는,
            <br />
            내가 남긴 말 속에 있어요.
          </p>
          <div className="mt-7 space-y-4">
            <Quote
              quote={r.firstDeclaration}
              title="처음 품었던 마음"
              empty="올해 작성한 선언이 아직 없어요."
            />
            <Quote
              quote={r.latestReview}
              title="가장 최근에 돌아본 나"
              empty="올해 작성한 회고가 아직 없어요."
            />
          </div>
          <Note>
            올해 남긴 첫 선언과 가장 최근 중간·최종회고의 내용을 모았어요.
          </Note>
        </>
      );
    case "conditions":
      return (
        <>
          <p className={styles.description}>
            내가 잘할 수 있는 환경을 알아가는 것도
            <br />
            리추얼이 남긴 발견이에요.
          </p>
          <div className="mt-7 grid gap-4 sm:grid-cols-2">
            <div className={styles.card}>
              <p className={`${styles.accent} mb-5 text-xs font-semibold`}>
                리추얼이 잘됐던 조건 TOP 3
              </p>
              <Ranking
                items={r.goodConditions}
                empty="중간회고에 남긴 조건이 아직 없어요."
              />
            </div>
            <div className={styles.card}>
              <p className={`${styles.accent} mb-5 text-xs font-semibold`}>
                리추얼을 어렵게 했던 조건
              </p>
              <Ranking
                items={r.hardConditions}
                empty="중간회고에 남긴 조건이 아직 없어요."
              />
            </div>
          </div>
          <div className={`${styles.softCard} mt-4`}>
            <p className="text-sm leading-relaxed">
              {r.reviewCount ? (
                <>
                  “계속하고 싶어요”라고
                  <br />
                  <strong className="mt-2 inline-block text-3xl">
                    {r.keepCount}번
                  </strong>{" "}
                  답했어요.
                </>
              ) : (
                "앞으로도 이어가고 싶은 마음을 최종회고에 남겨보세요."
              )}
            </p>
            {r.reviewCount > 0 && (
              <p className={`${styles.muted} mt-3 text-xs`}>
                최종회고 {r.reviewCount}개 중 같은 리추얼 유지를 선택한 횟수
              </p>
            )}
          </div>
        </>
      );
    case "closing":
      return (
        <>
          <div className={`${styles.softCard} mt-7`}>
            <p className={`${styles.accent} mb-3 text-xs font-semibold`}>
              올해의 대표 리추얼
            </p>
            <p className="text-3xl font-semibold leading-relaxed">
              {labels(data.representatives) || "나를 위한 작은 실천"}
            </p>
            <p className={`${styles.muted} mt-3 text-xs leading-relaxed`}>
              {data.representativeBasis === "certifications"
                ? "올해 가장 많이 인증한 리추얼이에요."
                : "올해 가장 자주 선택한 리추얼이에요."}
            </p>
          </div>
          <div className="mt-7">
            <p className={`${styles.accent} mb-4 text-xs font-semibold`}>
              나의 기록에 자주 등장한, 올해의 키워드
            </p>
            {r.keywords.length ? (
              <div className="flex flex-wrap gap-2">
                {r.keywords.map((word) => (
                  <span key={word.label} className={styles.tag}>
                    #{word.label}
                    <span className={`${styles.muted} ml-2 text-[10px]`}>
                      {word.count}
                    </span>
                  </span>
                ))}
              </div>
            ) : (
              <p className={`${styles.muted} text-sm`}>
                여러 기록에 반복해서 등장한 단어가 아직 없어요.
              </p>
            )}
            <Note>
              직접 쓴 기록·선언·회고 중 두 개 이상의 글에 등장한 단어예요.
              숫자는 그 단어가 담긴 글 수예요.
            </Note>
          </div>
          <p className="my-8 text-lg font-medium leading-relaxed">
            완벽한 날만 남는 건 아니니까.
            <br />
            나를 위해 시간을 내어준 올해의 나에게,
            <br />
            수고했다는 인사를 건네요.
          </p>
          <details className={`${styles.card} text-xs leading-relaxed`}>
            <summary className="cursor-pointer py-1 font-medium">
              회고는 이렇게 모았어요
            </summary>
            <ul className={`${styles.muted} mt-4 list-disc space-y-2 pl-4`}>
              <li>
                2026년 {dateLabel(RECAP_START_DATE)}부터 {dateLabel(data.asOf)}
                까지, 테스트 기수를 제외한 나의 기록이에요.
              </li>
              <li>
                참여는 기수가 시작한 월을 기준으로 세어요. 삭제된 신청 내역은
                포함되지 않아요.
              </li>
              <li>
                같은 날 같은 리추얼 인증은 한 번만 세고, 인증 집계에서 제외된
                기록은 작성 건수에만 포함해요.
              </li>
              <li>
                다시 시작하기 전 기록도 한 해의 기록에는 남겨요. 달성률은 각
                기수의 다시 시작한 날짜를 반영해요.
              </li>
            </ul>
          </details>
        </>
      );
    default:
      return (
        <>
          <div className="my-7">
            <Bloom />
          </div>
          <p className={styles.description}>
            아직 2026년의 참여 내역과 기록이 없어요.
            <br />
            나를 위한 작은 실천이 쌓이면,
            <br />
            이곳에 나만의 이야기가 펼쳐질 거예요.
          </p>
          <Link href="/home" className={`${styles.button} mt-8`}>
            나의 리추얼 만나기
            <ArrowUpRight size={16} aria-hidden="true" />
          </Link>
        </>
      );
  }
}

export default function AnnualRecapStory({ data }: { data: AnnualRecap }) {
  const pages = pagesFor(data);
  const [index, setIndex] = useState(0);
  const heading = useRef<HTMLHeadingElement>(null);
  const touch = useRef<{ x: number; y: number } | null>(null);
  const mounted = useRef(false);
  const page = pages[index] ?? pages[0];
  const last = index === pages.length - 1;
  const move = (next: number) =>
    setIndex(Math.max(0, Math.min(pages.length - 1, next)));
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    heading.current?.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [index]);
  const colors = page.routine
    ? ROUTINE_CONFIG[ROUTINE_TYPE_LABEL[page.routine.type] as RoutineType]
    : undefined;
  const theme = colors
    ? ({
        "--recap-soft": colors.bgColor,
        "--recap-accent": colors.color,
        "--recap-accent-ink": `color-mix(in srgb, ${colors.color} 55%, var(--color-gray-900))`,
      } as CSSProperties)
    : undefined;

  return (
    <div
      className={styles.story}
      style={theme}
      onKeyDown={(event) => {
        if (
          event.altKey ||
          event.ctrlKey ||
          event.metaKey ||
          /INPUT|TEXTAREA|SELECT/.test((event.target as HTMLElement).tagName)
        )
          return;
        if (event.key === "ArrowRight") {
          event.preventDefault();
          move(index + 1);
        }
        if (event.key === "ArrowLeft") {
          event.preventDefault();
          move(index - 1);
        }
      }}
    >
      <header className={styles.header}>
        <div className="flex items-center justify-between gap-3">
          <Link
            href="/home"
            className="flex min-h-11 items-center gap-2 text-sm font-semibold tracking-tight"
          >
            <Flower2 size={20} className={styles.accent} aria-hidden="true" />
            lolaum
            <span
              className={`${styles.muted} ml-2 text-[10px] font-normal tracking-[.12em]`}
            >
              2026 RECAP
            </span>
          </Link>
          <Link
            href="/ritual"
            aria-label="회고 닫고 나의 리추얼 기록으로"
            className={`${styles.muted} flex h-11 w-11 items-center justify-center rounded-full`}
          >
            <X size={22} />
          </Link>
        </div>
        <div className={styles.progress} aria-hidden="true">
          {pages.map((item, i) => (
            <span
              key={item.id}
              className={i <= index ? styles.visited : undefined}
            />
          ))}
        </div>
      </header>
      <main
        className={`${styles.content} ${page.id === "summary" ? styles.summaryContent : ""}`}
        aria-roledescription="캐러셀"
        aria-label="2026 나의 리추얼 회고"
        onPointerDown={(event) => {
          if (
            event.pointerType !== "touch" ||
            (event.target as HTMLElement).closest("a,button,summary,select")
          )
            return;
          touch.current = { x: event.clientX, y: event.clientY };
        }}
        onPointerCancel={() => {
          touch.current = null;
        }}
        onPointerUp={(event) => {
          if (!touch.current) return;
          const dx = event.clientX - touch.current.x;
          const dy = event.clientY - touch.current.y;
          touch.current = null;
          if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5)
            move(index + (dx < 0 ? 1 : -1));
        }}
      >
        <section
          key={page.id}
          className={styles.page}
          aria-labelledby="recap-heading"
          aria-roledescription="슬라이드"
        >
          <p className={styles.eyebrow}>
            {String(index + 1).padStart(2, "0")} /{" "}
            {page.id === "summary" ? "숫자로 보는 한 해" : page.label}
          </p>
          <h1
            id="recap-heading"
            ref={heading}
            tabIndex={-1}
            className={styles.title}
          >
            {pageTitle(page, data)}
          </h1>
          <PageContent page={page} data={data} />
        </section>
      </main>
      {pages.length > 1 && (
        <footer className={styles.footer}>
          <div className={styles.footerInner}>
            <div className="flex min-w-0 flex-col gap-1">
              <label
                className={`${styles.muted} text-[10px] tracking-widest`}
                htmlFor="recap-chapter"
              >
                {String(index + 1).padStart(2, "0")} /{" "}
                {String(pages.length).padStart(2, "0")}
              </label>
              <select
                id="recap-chapter"
                aria-label="회고 페이지 선택"
                value={index}
                onChange={(event) => move(Number(event.target.value))}
                className="min-h-8 max-w-40 cursor-pointer bg-transparent text-xs sm:max-w-56"
              >
                {pages.map((item, i) => (
                  <option key={item.id} value={i}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                className={`${styles.button} ${styles.previous}`}
                disabled={index === 0}
                onClick={() => move(index - 1)}
                aria-label="이전 페이지"
              >
                <ArrowLeft size={18} />
              </button>
              <button
                type="button"
                className={styles.button}
                onClick={() => move(last ? 0 : index + 1)}
              >
                {last ? "다시 보기" : index === 0 ? "회고 시작" : "다음"}
                {last ? (
                  <RotateCcw size={16} aria-hidden="true" />
                ) : (
                  <ArrowRight size={16} aria-hidden="true" />
                )}
              </button>
            </div>
          </div>
        </footer>
      )}
      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {pages.length}페이지 중 {index + 1}페이지, {page.label}
      </p>
    </div>
  );
}
