import type { AnnualRecap } from "@/types/annual-recap";
import { ChevronDown } from "lucide-react";
import { routineLabel } from "@/lib/annual-recap-insights";
import styles from "./RecapSummary.module.css";

const number = (value: number) => value.toLocaleString("ko-KR");
const dateLabel = (date: string) =>
  `${Number(date.slice(5, 7))}월 ${Number(date.slice(8, 10))}일`;

export default function RecapSummary({ data }: { data: AnnualRecap }) {
  const { participation, activity, achievement } = data;
  const highestRate = Math.max(
    0,
    ...achievement.periods.map((period) => period.rate),
  );
  const maximum = Math.max(
    0,
    ...activity.weekdays.map((day) => day.certifications),
  );
  const busiest = activity.weekdays.filter(
    (day) => maximum > 0 && day.certifications === maximum,
  );
  const monthlyMaximum = Math.max(
    0,
    ...activity.monthly.map((month) => month.records),
  );
  const favoriteNames = participation.favorites.map(routineLabel);
  const favoriteMonths = participation.routines[0]?.months ?? 0;
  const selected = participation.routines;
  const firstMonth = participation.months[0];

  return (
    <div className={styles.grid} aria-label="2026 리추얼 핵심 요약">
      <section className={`${styles.card} ${styles.participation}`}>
        <h2 className={styles.label}>리추얼과 함께한 시간</h2>
        <p className={`${styles.value} ${styles.heroValue}`}>
          {participation.months.length}
          <span>개월</span>
        </p>
        <div
          className={styles.calendar}
          role="img"
          aria-label={`참여한 달: ${participation.months.map((month) => `${month}월`).join(", ") || "없음"}`}
        >
          {activity.monthly.map(({ month }) => (
            <span
              key={month}
              className={
                participation.months.includes(month)
                  ? styles.activeMonth
                  : undefined
              }
              aria-hidden="true"
            >
              {month}
            </span>
          ))}
        </div>
        <p className={styles.description}>
          {firstMonth
            ? `${firstMonth}월에 시작해, 최장 ${participation.longestMonths}개월 연속 참여했어요.`
            : "나만의 리추얼을 시작해 보세요."}
        </p>
      </section>

      <section
        className={`${styles.card} ${styles.streak} ${styles.smallCard}`}
      >
        <h2 className={styles.label}>최장 연속 기록</h2>
        <p className={styles.value}>
          {number(activity.longestStreak)}
          <span>일</span>
        </p>
      </section>

      <section className={`${styles.card} ${styles.days} ${styles.smallCard}`}>
        <h2 className={styles.label}>기록을 남긴 날</h2>
        <p className={styles.value}>
          {number(activity.days)}
          <span>일</span>
        </p>
      </section>

      <section
        className={`${styles.card} ${styles.records}`}
        aria-label="올해 쌓은 기록과 인증"
      >
        <div>
          <h2 className={styles.label}>작성한 기록</h2>
          <p className={styles.value}>
            {number(activity.recordCount)}
            <span>건</span>
          </p>
        </div>
        <div>
          <h2 className={styles.label}>리추얼 인증</h2>
          <p className={styles.value}>
            {number(activity.certificationCount)}
            <span>회</span>
          </p>
        </div>
      </section>

      <section className={`${styles.card} ${styles.favoriteCard}`}>
        <h2 className={styles.label}>가장 많이 선택했어요</h2>
        <div className={styles.body}>
          <p
            className={`${styles.favorite} ${favoriteNames.length > 1 ? styles.multiple : ""}`}
          >
            {favoriteNames.length
              ? favoriteNames.slice(0, 2).join(" · ")
              : "아직 없어요"}
          </p>
          {favoriteNames.length > 2 && (
            <details className={styles.more}>
              <summary>공동 1위 {favoriteNames.length - 2}가지 더 보기</summary>
              <p>{favoriteNames.slice(2).join(" · ")}</p>
            </details>
          )}
          <p className={styles.description}>
            {favoriteNames.length
              ? `${favoriteMonths}개월 동안${favoriteNames.length > 1 ? " 나란히" : ""} 가장 많이 선택한 리추얼이에요.`
              : "신청한 리추얼이 생기면 보여드릴게요."}
          </p>
        </div>
      </section>

      <section className={`${styles.card} ${styles.weekdays}`}>
        <h2 className={styles.label}>나의 리추얼 데이</h2>
        <p className={styles.weekdayValue}>
          {busiest.length === 0
            ? "아직 없어요"
            : busiest.length === 7
              ? "모든 요일"
              : `${busiest.map((day) => day.label).join("·")}요일`}
        </p>
        <div
          className={styles.chart}
          role="img"
          aria-label={`요일별 인증: ${activity.weekdays.map((day) => `${day.label}요일 ${day.certifications}회`).join(", ")}`}
        >
          {activity.weekdays.map((day) => (
            <div
              className={styles.day}
              key={day.day}
              title={`${day.label}요일 ${number(day.certifications)}회`}
            >
              <div className={styles.track}>
                <span
                  className={
                    day.certifications === maximum && maximum > 0
                      ? styles.highlight
                      : undefined
                  }
                  style={{
                    height: `${maximum > 0 ? (day.certifications / maximum) * 100 : 0}%`,
                  }}
                />
              </div>
              <span>{day.label}</span>
            </div>
          ))}
        </div>
        <p className={styles.description}>
          {busiest.length === 0
            ? "인증을 남기면 나만의 패턴을 볼 수 있어요."
            : busiest.length === 7
              ? "매 요일 같은 횟수로 인증했어요."
              : "가장 자주 인증을 남긴 요일이에요."}
        </p>
      </section>

      <section
        className={`${styles.card} ${styles.achievement} ${styles.smallCard}`}
      >
        <h2 className={styles.label}>
          {highestRate >= 90 ? "최고 달성률" : "한 달 최다 리추얼"}
        </h2>
        <p className={styles.value}>
          {number(
            highestRate >= 90 ? highestRate : participation.maxRoutineCount,
          )}
          <span>{highestRate >= 90 ? "%" : "가지"}</span>
        </p>
        {highestRate >= 90 && achievement.perfectCount > 0 && (
          <p className={styles.description}>
            100% 달성 {achievement.perfectCount}기수
          </p>
        )}
      </section>

      <section className={`${styles.card} ${styles.goals} ${styles.smallCard}`}>
        <h2 className={styles.label}>주간 목표 달성</h2>
        <p className={styles.value}>
          {number(achievement.completeWeeks)}
          <span>주</span>
        </p>
        <p
          className={styles.description}
          title="신청한 리추얼을 모두 기록한 날"
        >
          모든 리추얼을 기록한 날{" "}
          <strong>{number(achievement.allRoutineDays)}일</strong>
        </p>
      </section>

      <section className={`${styles.card} ${styles.months}`}>
        <div className={styles.chartHeading}>
          <h2 className={styles.label}>월별 기록</h2>
          <p className={styles.description}>
            {monthlyMaximum === 0
              ? "첫 기록을 기다리고 있어요"
              : activity.busiestMonths.length === activity.monthly.length
                ? "매달 같은 수의 기록"
                : `${activity.busiestMonths.join("·")}월에 가장 많이 기록했어요`}
          </p>
        </div>
        <div
          className={`${styles.chart} ${styles.monthChart}`}
          role="img"
          aria-label={`월별 작성 기록: ${activity.monthly.map((month) => `${month.month}월 ${number(month.records)}건`).join(", ")}`}
        >
          {activity.monthly.map((month) => (
            <div
              className={styles.day}
              key={month.month}
              title={`${month.month}월 ${number(month.records)}건`}
            >
              <div className={styles.track}>
                <span
                  className={
                    month.records === monthlyMaximum && monthlyMaximum > 0
                      ? styles.highlight
                      : undefined
                  }
                  style={{
                    height: `${monthlyMaximum > 0 ? (month.records / monthlyMaximum) * 100 : 0}%`,
                  }}
                />
              </div>
              <span>{month.month}</span>
            </div>
          ))}
        </div>
      </section>

      <section className={`${styles.card} ${styles.variety}`}>
        <h2 className={styles.label}>올해 선택한 리추얼</h2>
        <p className={styles.value}>
          {selected.length}
          <span>가지</span>
        </p>
        <div className={styles.tags}>
          {selected.map((routine) => (
            <span key={routine.type} className={styles.tag}>
              {routine.label}
            </span>
          ))}
        </div>
        <p className={styles.description}>
          {selected.length > 0
            ? "서로 다른 실천으로 일상을 채웠어요."
            : "나에게 맞는 리추얼을 하나씩 만나보세요."}
        </p>
      </section>

      <section
        className={`${styles.card} ${styles.moments}`}
        aria-label="기억할 순간"
      >
        <div>
          <h2 className={styles.label}>올해 첫 기록</h2>
          {activity.firstRecord ? (
            <p className={styles.date}>
              <time dateTime={activity.firstRecord.date}>
                {dateLabel(activity.firstRecord.date)}
              </time>
            </p>
          ) : (
            <p className={styles.description}>첫 기록을 기다려요</p>
          )}
        </div>
        <div>
          <h2 className={styles.label}>올해 마지막 기록</h2>
          {activity.lastRecord ? (
            <details className={styles.lastRecordToggle}>
              <summary
                aria-label={`올해 마지막 기록, ${dateLabel(activity.lastRecord.date)}`}
              >
                <time dateTime={activity.lastRecord.date}>
                  {dateLabel(activity.lastRecord.date)}
                </time>
                <ChevronDown size={18} aria-hidden="true" />
              </summary>
              <p>{activity.lastRecord.text}</p>
            </details>
          ) : (
            <p className={styles.description}>아직 기록이 없어요</p>
          )}
        </div>
      </section>
    </div>
  );
}
