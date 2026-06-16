import React from "react";
import LayoutShell from "./LayoutShell";
import { isAdminEmail } from "@/lib/admin-auth";
import { getCurrentUser } from "@/lib/supabase/server";

interface LayoutProps {
  children: React.ReactNode;
}

// Server Component wrapper.
// children은 RSC로 유지되고, 인터랙티브한 헤더/드로어/네비만 LayoutShell(client)에서 렌더된다.
export default async function Layout({ children }: LayoutProps) {
  const user = await getCurrentUser();
  return (
    <LayoutShell isAdmin={isAdminEmail(user?.email)}>{children}</LayoutShell>
  );
}
