import Layout from "@/components/Layout/Layout";
import LanguageContainer from "@/components/Routines/Language/LanguageContainer";

export default function Page() {
  return (
    <Layout>
      <LanguageContainer mode="new" languageType="제2외국어" />
    </Layout>
  );
}
