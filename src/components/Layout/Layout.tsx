"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import MenuIcon from "../icons/MenuIcon";
import HomeIcon from "../icons/HomeIcon";
import RitualIcon from "../icons/RitualIcon";
import VerifyIcon from "../icons/VerifyIcon";
import TeamIcon from "../icons/TeamIcon";
import ReportIcon from "../icons/ReportIcon";
import ProfileIcon from "../icons/ProfileIcon";

interface LayoutProps {
  children: React.ReactNode;
}

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{
    size?: number;
    active?: boolean;
    className?: string;
  }>;
}

const navItems: NavItem[] = [
  { href: "/home", label: "홈", icon: HomeIcon },
  { href: "/ritual", label: "리추얼", icon: RitualIcon },
  { href: "/verify", label: "인증", icon: VerifyIcon },
  { href: "/team", label: "팀원", icon: TeamIcon },
  { href: "/report", label: "리포트", icon: ReportIcon },
  { href: "/mypage", label: "마이페이지", icon: ProfileIcon },
];

export default function Layout({ children }: LayoutProps) {
  const pathname = usePathname();
  const isDesktopQuery = useMediaQuery("(min-width: 768px)");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // 마운트 전에는 기본 모바일 레이아웃을 보여줌 (hydration 일치)
  const isDesktop = mounted ? isDesktopQuery : false;

  // 마운트 전 로딩 상태 - 서버와 클라이언트 동일한 HTML
  if (!mounted) {
    return (
      <div className="min-h-screen bg-background">
        <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3 bg-white">
          <div className="flex items-center gap-3">
            <img
              src="/images/common/LolaumLogo.png"
              alt="Lolaum Logo"
              className="mx-auto h-6 w-25"
            />
          </div>
        </header>
        <main className="pt-16 pb-20 min-h-screen">{children}</main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* 데스크톱/아이패드 헤더 */}
      {isDesktop && (
        <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-100">
          <div className="max-w-7xl mx-auto flex items-center justify-between px-2 lg:px-1 py-4">
            <div className="flex items-center gap-4">
              {/* 햄버거 메뉴 */}
              <button
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                aria-label="메뉴 열기"
              >
                <MenuIcon size={24} className="text-gray-700" />
              </button>

              {/* 로고 */}
              <Link href="/home" className="flex items-center gap-3">
                <img
                  src="/images/common/LolaumLogo.png"
                  alt="Lolaum Logo"
                  className="mx-auto h-8 w-30"
                />
              </Link>
            </div>
          </div>
        </header>
      )}

      {/* 모바일 헤더 */}
      {!isDesktop && (
        <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3 bg-white">
          {/* 로고 */}
          <Link href="/home" className="flex items-center gap-3">
            <img
              src="/images/common/LolaumLogo.png"
              alt="Lolaum Logo"
              className="mx-auto h-8 w-30"
            />
          </Link>
        </header>
      )}

      {/* 메인 컨텐츠 */}
      <main className={`${isDesktop ? "pt-20" : "pt-16 pb-20"} min-h-screen`}>
        {children}
      </main>

      {/* 모바일 하단 네비게이션 */}
      {!isDesktop && (
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 safe-area-bottom">
          <div className="flex items-center justify-around px-2 py-2">
            {navItems.map((item) => {
              const isActive =
                pathname === item.href || pathname?.startsWith(`${item.href}/`);
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors ${
                    isActive
                      ? "text-[var(--gold-400)]"
                      : "text-gray-400 hover:text-gray-600"
                  }`}
                >
                  <Icon size={22} active={isActive} />
                  <span className="text-[10px] font-medium">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
}
