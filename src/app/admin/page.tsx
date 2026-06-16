import AdminPageClient from "@/components/Admin/AdminPageClient";
import Layout from "@/components/Layout/Layout";
import { getAdminDashboardData } from "@/api/admin";

export default async function AdminPage() {
  const initial = await getAdminDashboardData();
  return (
    <Layout>
      <AdminPageClient initial={initial} />
    </Layout>
  );
}
