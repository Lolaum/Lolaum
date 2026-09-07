import { notFound } from "next/navigation";
import { getDeclarationById } from "@/api/declaration";
import DeclarationDetail from "@/components/Declaration/DeclarationDetail";
import Layout from "@/components/Layout/Layout";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function DeclarationDetailPage({ params }: Props) {
  const { id } = await params;
  const { data: decl, currentUserId, routine, canEditRoutineTime, error } = await getDeclarationById(id);

  if (!decl || error) {
    notFound();
  }

  return (
    <Layout>
      <DeclarationDetail key={decl.id} decl={decl} isMine={decl.userId === currentUserId} initialRoutine={routine} canEditRoutineTime={canEditRoutineTime} />
    </Layout>
  );
}
