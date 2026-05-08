import Layout from "@/components/Layout/Layout";

export default function ProgressLoading() {
  return (
    <Layout>
      <div className="max-w-2xl mx-auto px-4 py-6 pb-8 animate-pulse space-y-4">
        <div className="h-24 rounded-2xl bg-gray-100" />
        <div className="space-y-2">
          <div className="h-16 rounded-2xl bg-gray-100" />
          <div className="h-16 rounded-2xl bg-gray-100" />
          <div className="h-16 rounded-2xl bg-gray-100" />
          <div className="h-16 rounded-2xl bg-gray-100" />
          <div className="h-16 rounded-2xl bg-gray-100" />
        </div>
      </div>
    </Layout>
  );
}
