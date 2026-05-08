import Layout from "@/components/Layout/Layout";

export default function HomeLoading() {
  return (
    <Layout>
      <div className="w-full px-4 py-4 sm:px-6 md:px-8 lg:px-12">
        <div className="mx-auto max-w-5xl animate-pulse space-y-4">
          <div className="h-20 rounded-2xl bg-gray-100" />
          <div className="h-80 rounded-2xl bg-gray-100" />
          <div className="h-40 rounded-2xl bg-gray-100" />
        </div>
      </div>
    </Layout>
  );
}
