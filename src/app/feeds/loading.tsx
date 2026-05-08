import Layout from "@/components/Layout/Layout";

export default function FeedsLoading() {
  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-4 py-6 pb-8 animate-pulse">
        <div className="h-20 rounded-2xl bg-gray-100 mb-6" />
        <div className="h-11 rounded-xl bg-gray-100 mb-4" />
        <div className="flex gap-2 mb-5">
          <div className="h-9 w-16 rounded-full bg-gray-100" />
          <div className="h-9 w-16 rounded-full bg-gray-100" />
          <div className="h-9 w-16 rounded-full bg-gray-100" />
          <div className="h-9 w-16 rounded-full bg-gray-100" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="h-72 rounded-2xl bg-gray-100" />
          <div className="h-72 rounded-2xl bg-gray-100" />
          <div className="h-72 rounded-2xl bg-gray-100" />
          <div className="h-72 rounded-2xl bg-gray-100" />
        </div>
      </div>
    </Layout>
  );
}
