import React from "react";
import HomeContainer from "@/components/Home/HomeContainer";
import Layout from "@/components/Layout/Layout";
import { getHomeStats } from "@/api/ritual-stats";

export default async function page() {
  const homeData = await getHomeStats();

  return (
    <Layout>
      <HomeContainer initialData={homeData} />
    </Layout>
  );
}
