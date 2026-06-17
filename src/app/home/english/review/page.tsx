import Layout from "@/components/Layout/Layout";
import LanguageReviewContainer from "@/components/Routines/Language/LanguageReviewContainer";

export default function Page() {
  return (
    <Layout>
      <LanguageReviewContainer languageType="영어" />
    </Layout>
  );
}
