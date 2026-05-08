import Layout from "@/components/Layout/Layout";

export default function RitualLoading() {
  return (
    <Layout>
      <div className="max-w-2xl mx-auto px-4 py-6 pb-8 animate-pulse space-y-4">
        <div className="h-24 rounded-2xl bg-gray-100" />
        <div className="grid grid-cols-2 gap-3">
          <div className="h-32 rounded-2xl bg-gray-100" />
          <div className="h-32 rounded-2xl bg-gray-100" />
          <div className="h-32 rounded-2xl bg-gray-100" />
          <div className="h-32 rounded-2xl bg-gray-100" />
        </div>
        <div className="h-48 rounded-2xl bg-gray-100" />
      </div>
    </Layout>
  );
}
