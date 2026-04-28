import { notFound } from "next/navigation";
import { getBook } from "@/api/book";
import BookRecords from "@/components/BookRecords/BookRecords";
import Layout from "@/components/Layout/Layout";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function BookRecordsPage({ params }: Props) {
  const { id } = await params;
  const { data: book, error } = await getBook(id);

  if (!book || error) {
    notFound();
  }

  return (
    <Layout>
      <BookRecords book={book} />
    </Layout>
  );
}
