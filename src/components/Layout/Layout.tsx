"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMediaQuery } from "@/lib/hooks/useMediaQuery";
import { logout } from "@/api/auth";
import MenuIcon from "../icons/MenuIcon";
import HomeIcon from "../icons/HomeIcon";
import RitualIcon from "../icons/RitualIcon";
import VerifyIcon from "../icons/VerifyIcon";
import ReportIcon from "../icons/ReportIcon";

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
  { href: "/ritual", label: "나의 리추얼 기록", icon: RitualIcon },
  { href: "/feeds", label: "인증 게시글", icon: VerifyIcon },
  { href: "/progress", label: "진행도", icon: ReportIcon },
];

export default function Layout({ children }: LayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const isDesktopQuery = useMediaQuery("(min-width: 768px)");
  const [mounted, setMounted] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  // 드로어 열릴 때 body 스크롤 방지
  useEffect(() => {
    if (isDrawerOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isDrawerOpen]);

  // 마운트 전에는 모바일 레이아웃으로 고정 (hydration 불일치 방지)
  const isDesktop = mounted ? isDesktopQuery : false;

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
                onClick={() => setIsDrawerOpen(true)}
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
        <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3 bg-white border-b border-gray-100">
          {/* 로고 */}
          <Link href="/home" className="flex items-center gap-3">
            <img
              src="/images/common/LolaumLogo.png"
              alt="Lolaum Logo"
              className="mx-auto h-8 w-30"
            />
          </Link>
          {/* 로그아웃 */}
          <button
            onClick={handleLogout}
            className="p-2 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
            aria-label="로그아웃"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </header>
      )}

      {/* 메인 컨텐츠 */}
      <main className={`${isDesktop ? "pt-24" : "pt-16 pb-16"} min-h-screen`}>
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

      {/* 데스크톱/태블릿 드로어 메뉴 */}
      {isDesktop && (
        <>
          {/* 오버레이 */}
          <div
            className={`fixed inset-0 bg-black/50 z-[60] transition-opacity duration-300 ${
              isDrawerOpen ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
            onClick={() => setIsDrawerOpen(false)}
          />

          {/* 드로어 */}
          <div
            className={`fixed top-0 left-0 h-full w-64 bg-white z-[70] shadow-xl transform transition-transform duration-300 ease-in-out ${
              isDrawerOpen ? "translate-x-0" : "-translate-x-full"
            }`}
          >
            {/* 드로어 헤더 */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <Link
                href="/home"
                className="flex items-center gap-3"
                onClick={() => setIsDrawerOpen(false)}
              >
                <img
                  src="/images/common/LolaumLogo.png"
                  alt="Lolaum Logo"
                  className="h-8 w-30"
                />
              </Link>
              <button
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                aria-label="메뉴 닫기"
                onClick={() => setIsDrawerOpen(false)}
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-gray-700"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* 드로어 메뉴 아이템 */}
            <nav className="p-4 flex flex-col h-[calc(100%-65px)]">
              <ul className="space-y-2 flex-1">
                {navItems.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    pathname?.startsWith(`${item.href}/`);
                  const Icon = item.icon;

                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={() => setIsDrawerOpen(false)}
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                          isActive
                            ? "bg-[var(--gold-400)]/10 text-[var(--gold-400)]"
                            : "text-gray-600 hover:bg-gray-100"
                        }`}
                      >
                        <Icon size={24} active={isActive} />
                        <span className="font-medium">{item.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors w-full"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                <span className="font-medium">로그아웃</span>
              </button>
            </nav>
          </div>
        </>
      )}
    </div>
  );
}
