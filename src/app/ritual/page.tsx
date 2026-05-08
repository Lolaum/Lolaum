import React from "react";
import Layout from "@/components/Layout/Layout";
import RitualContainer from "@/components/Ritual/RitualContainer";
import { getRitualPageData } from "@/api/ritual-stats";

export default async function RitualPage() {
  const initialData = await getRitualPageData();

  return (
    <Layout>
      <RitualContainer initialData={initialData} />
    </Layout>
  );
}
