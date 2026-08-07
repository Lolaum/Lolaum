import React from "react";
import Layout from "@/components/Layout/Layout";
import RitualContainer from "@/components/Ritual/RitualContainer";
import { getRitualPageData } from "@/api/ritual-stats";

export default async function RitualPage({
  searchParams,
}: {
  searchParams: Promise<{ challenger?: string }>;
}) {
  const { challenger } = await searchParams;
  const initialData = await getRitualPageData(challenger);

  return (
    <Layout>
      <RitualContainer
        initialData={initialData}
        targetChallengerSlug={challenger}
      />
    </Layout>
  );
}
