import Layout from "@/components/Layout/Layout";
import FinalReviewWriteContainer from "@/components/FinalReview/FinalReviewWriteContainer";
import { getPublicReviewQuestions } from "@/api/review-questions";

export default async function FinalReviewWritePage() {
  const questions = await getPublicReviewQuestions("final");
  return (
    <Layout>
      <FinalReviewWriteContainer questions={questions} />
    </Layout>
  );
}
