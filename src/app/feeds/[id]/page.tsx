import React from "react";
import { notFound } from "next/navigation";
import feed_mock from "@/mock/feedmock";
import FeedDetail from "@/components/Feed/FeedDetail";
import Layout from "@/components/Layout/Layout";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function FeedDetailPage({ params }: Props) {
  const { id } = await params;
  const feed = feed_mock.find((f) => f.id === Number(id));

  if (!feed) {
    notFound();
  }

  return (
    <Layout>
      <FeedDetail item={feed} />
    </Layout>
  );
}
