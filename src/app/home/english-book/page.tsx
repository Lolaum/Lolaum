import Layout from "@/components/Layout/Layout";
import ReadingContainer from "@/components/Routines/Reading/ReadingContainer";

interface PageProps {
  searchParams: Promise<{ book?: string }>;
}

export default async function Page({ searchParams }: PageProps) {
  const params = await searchParams;

  return (
    <Layout>
      <ReadingContainer mode="main" isEnglishBook initialBookId={params.book} />
    </Layout>
  );
}
