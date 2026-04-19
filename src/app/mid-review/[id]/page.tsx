import { notFound } from "next/navigation";
import { getMidReviewById } from "@/api/mid-review";
import MidReviewDetail from "@/components/MidReview/MidReviewDetail";
import Layout from "@/components/Layout/Layout";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function MidReviewDetailPage({ params }: Props) {
  const { id } = await params;
  const { data: review, currentUserId, error } = await getMidReviewById(id);

  if (!review || error) {
    notFound();
  }

  return (
    <Layout>
      <MidReviewDetail review={review} isMine={review.userId === currentUserId} />
    </Layout>
  );
}
