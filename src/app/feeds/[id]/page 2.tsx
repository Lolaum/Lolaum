import React from "react";
import { notFound } from "next/navigation";
import { getRecordById } from "@/api/ritual-records-display";
import FeedDetail from "@/components/Feed/FeedDetail";
import Layout from "@/components/Layout/Layout";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function FeedDetailPage({ params }: Props) {
  const { id } = await params;
  const { data: feed } = await getRecordById(id);

  if (!feed) {
    notFound();
  }

  return (
    <Layout>
      <FeedDetail item={feed} />
    </Layout>
  );
}
