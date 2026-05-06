import React, { Suspense } from "react";
import FeedContainer, { FEEDS_PER_PAGE } from "@/components/Feed/FeedContainer";
import Layout from "@/components/Layout/Layout";
import { getAllRecordsForDisplay } from "@/api/ritual-records-display";
import type { RoutineTypeDB } from "@/types/supabase";

const ROUTINE_KEYS: RoutineTypeDB[] = [
  "morning",
  "exercise",
  "reading",
  "english",
  "second_language",
  "recording",
  "finance",
  "english_book",
];

export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<{
    filter?: string;
    page?: string;
    search?: string;
  }>;
}) {
  const params = await searchParams;
  const filter = params.filter ?? "all";
  const page = Math.max(1, Number(params.page ?? "1") || 1);
  const search = params.search ?? "";

  const routineType = ROUTINE_KEYS.includes(filter as RoutineTypeDB)
    ? (filter as RoutineTypeDB)
    : undefined;

  const initial = await getAllRecordsForDisplay({
    routineType,
    limit: FEEDS_PER_PAGE,
    offset: (page - 1) * FEEDS_PER_PAGE,
    searchName: search || undefined,
  });

  return (
    <Layout>
      <Suspense>
        <FeedContainer
          initialData={initial.data}
          initialTotal={initial.total}
          initialKey={`${filter}|${page}|${search}`}
        />
      </Suspense>
    </Layout>
  );
}
