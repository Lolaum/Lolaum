import React from "react";
import HomeContainer from "@/components/Home/HomeContainer";
import Layout from "@/components/Layout/Layout";
import { getHomeStats } from "@/api/ritual-stats";
import { getActivePeriod } from "@/lib/current-challenge";
import { formatKoreaDateKey } from "@/lib/korea-date";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function page() {
  const [homeData, { period }] = await Promise.all([
    getHomeStats(),
    getActivePeriod(),
  ]);

  return (
    <Layout>
      <HomeContainer
        initialData={homeData}
        todayKey={formatKoreaDateKey()}
        period={
          period
            ? {
                start_date: period.start_date,
                end_date: period.end_date,
                mid_review_start_date: period.mid_review_start_date,
                mid_review_end_date: period.mid_review_end_date,
                final_review_start_date: period.final_review_start_date,
                final_review_end_date: period.final_review_end_date,
                label: period.label,
              }
            : null
        }
      />
    </Layout>
  );
}
