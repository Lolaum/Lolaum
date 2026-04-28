import React from "react";
import HomeContainer from "@/components/Home/HomeContainer";
import Layout from "@/components/Layout/Layout";
import { getHomeStats } from "@/api/ritual-stats";
import { getActivePeriod } from "@/lib/current-challenge";

export default async function page() {
  const [homeData, { period }] = await Promise.all([
    getHomeStats(),
    getActivePeriod(),
  ]);

  return (
    <Layout>
      <HomeContainer
        initialData={homeData}
        period={
          period
            ? {
                start_date: period.start_date,
                end_date: period.end_date,
                label: period.label,
              }
            : null
        }
      />
    </Layout>
  );
}
