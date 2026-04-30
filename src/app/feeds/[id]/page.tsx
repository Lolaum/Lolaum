import React from "react";
import { notFound } from "next/navigation";
import { getRecordById } from "@/api/ritual-records-display";
import { getCurrentUser } from "@/lib/supabase/server";
import FeedDetail from "@/components/Feed/FeedDetail";
import Layout from "@/components/Layout/Layout";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function FeedDetailPage({ params }: Props) {
  const { id } = await params;
  const [{ data: feed }, user] = await Promise.all([
    getRecordById(id),
    getCurrentUser(),
  ]);

  if (!feed) {
    notFound();
  }

  const isMine =
    user != null && String(user.id) === String(feed.userId);

  return (
    <Layout>
      <FeedDetail item={feed} isMine={isMine} />
    </Layout>
  );
}
