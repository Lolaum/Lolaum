import { notFound } from "next/navigation";
import { getDeclarationById } from "@/api/declaration";
import DeclarationDetail from "@/components/Declaration/DeclarationDetail";
import Layout from "@/components/Layout/Layout";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function DeclarationDetailPage({ params }: Props) {
  const { id } = await params;
  const { data: decl, currentUserId, error } = await getDeclarationById(id);

  if (!decl || error) {
    notFound();
  }

  return (
    <Layout>
      <DeclarationDetail decl={decl} isMine={decl.userId === currentUserId} />
    </Layout>
  );
}
