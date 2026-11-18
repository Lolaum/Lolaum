import { ChevronDown } from "lucide-react";
import type { RecapMilestone } from "@/types/annual-recap";
import { routineLabel } from "@/lib/annual-recap-insights";
import styles from "./MilestoneToggle.module.css";

export default function MilestoneToggle({
  milestone,
  compact = false,
}: {
  milestone: RecapMilestone;
  compact?: boolean;
}) {
  const date = `${Number(milestone.date.slice(5, 7))}월 ${Number(milestone.date.slice(8, 10))}일`;
  return (
    <details className={`${styles.toggle} ${compact ? styles.compact : ""}`}>
      <summary aria-label={`${milestone.count}번째 인증 글, ${date}`}>
        <span>
          {!compact && (
            <span className={styles.count}>
              {milestone.count}
              <small>번째 인증</small>
            </span>
          )}
          <span className={styles.meta}>
            <time dateTime={milestone.date}>{date}</time>
            {!compact && ` · ${routineLabel(milestone.routineType)}`}
          </span>
        </span>
        <ChevronDown className={styles.chevron} size={18} aria-hidden="true" />
      </summary>
      <div className={styles.content}>
        <p>{milestone.text || "이 인증에는 작성한 글이 없어요."}</p>
      </div>
    </details>
  );
}
