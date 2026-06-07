import Layout from "@/components/Layout/Layout";
import MidReviewWriteContainer from "@/components/MidReview/MidReviewWriteContainer";
import { getPublicReviewQuestions } from "@/api/review-questions";

export default async function MidReviewWritePage() {
  const questions = await getPublicReviewQuestions("mid");
  return (
    <Layout>
      <MidReviewWriteContainer questions={questions} />
    </Layout>
  );
}
