import Layout from "@/components/Layout/Layout";
import ProgressContainer from "@/components/Progress/ProgressContainer";
import { getProgressPageData } from "@/api/progress";

export default async function ProgressPage() {
  const result = await getProgressPageData();

  return (
    <Layout>
      <ProgressContainer initialData={result.data ?? null} />
    </Layout>
  );
}
