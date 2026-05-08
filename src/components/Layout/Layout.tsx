import React from "react";
import LayoutShell from "./LayoutShell";

interface LayoutProps {
  children: React.ReactNode;
}

// Server Component wrapper.
// children은 RSC로 유지되고, 인터랙티브한 헤더/드로어/네비만 LayoutShell(client)에서 렌더된다.
export default function Layout({ children }: LayoutProps) {
  return <LayoutShell>{children}</LayoutShell>;
}
