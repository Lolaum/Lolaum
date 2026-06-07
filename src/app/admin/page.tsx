import AdminPageClient from "@/components/Admin/AdminPageClient";
import { getAdminDashboardData } from "@/api/admin";

export default async function AdminPage() {
  const initial = await getAdminDashboardData();
  return <AdminPageClient initial={initial} />;
}
