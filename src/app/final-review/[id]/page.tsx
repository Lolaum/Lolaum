import { notFound } from "next/navigation";
import { getFinalReviewById } from "@/api/final-review";
import FinalReviewDetail from "@/components/FinalReview/FinalReviewDetail";
import Layout from "@/components/Layout/Layout";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function FinalReviewDetailPage({ params }: Props) {
  const { id } = await params;
  const { data: review, currentUserId, error } = await getFinalReviewById(id);

  if (!review || error) {
    notFound();
  }

  return (
    <Layout>
      <FinalReviewDetail review={review} isMine={review.userId === currentUserId} />
    </Layout>
  );
}
