"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  deleteAllNotifications,
  getAdminNotificationSetting,
  getNotifications,
  getUnreadNotificationCount,
  markNotificationRead,
  setAdminNotificationSetting,
} from "@/api/notification";
import type { NotificationView } from "@/lib/notifications/constants";
import BellIcon from "../icons/BellIcon";

const POLL_INTERVAL_MS = 60_000;

function formatRelative(iso: string): string {
  const now = Date.now();
  const t = new Date(iso).getTime();
  const diff = Math.max(0, now - t);
  const min = Math.floor(diff / 60_000);
  if (min < 1) return "방금 전";
  if (min < 60) return `${min}분 전`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}시간 전`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}일 전`;
  return new Date(iso).toLocaleDateString("ko-KR");
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [items, setItems] = useState<NotificationView[]>([]);
  const [loading, setLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminEnabled, setAdminEnabled] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  const refreshUnread = useCallback(async () => {
    const { count } = await getUnreadNotificationCount();
    setUnread(count);
  }, []);

  const loadList = useCallback(async () => {
    setLoading(true);
    const [{ data }, setting] = await Promise.all([
      getNotifications(),
      getAdminNotificationSetting(),
    ]);
    setItems(data);
    setIsAdmin(setting.isAdmin);
    setAdminEnabled(setting.enabled);
    setLoading(false);
  }, []);

  const handleToggleAdminSetting = async () => {
    const next = !adminEnabled;
    setAdminEnabled(next);
    const { error } = await setAdminNotificationSetting(next);
    if (error) {
      // 실패 시 롤백
      setAdminEnabled(!next);
    }
  };

  // 마운트 시 & 주기적으로 미읽음 개수 갱신 (외부 시스템 폴링)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refreshUnread();
    const id = setInterval(() => {
      void refreshUnread();
    }, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [refreshUnread]);

  // 드롭다운 열릴 때 목록 로드 (외부 데이터 동기화)
  useEffect(() => {
    if (!open) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadList();
  }, [open, loadList]);

  // 바깥 클릭 시 닫기
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const linkFor = (n: NotificationView): string | null => {
    if (n.ritualRecordId) return `/feeds/${n.ritualRecordId}`;
    return null;
  };

  const handleItemClick = async (n: NotificationView) => {
    setOpen(false);
    if (!n.isRead) {
      setItems((prev) =>
        prev.map((it) => (it.id === n.id ? { ...it, isRead: true } : it)),
      );
      setUnread((c) => Math.max(0, c - 1));
      await markNotificationRead(n.id);
    }
  };

  const handleClearAll = async () => {
    if (items.length === 0) return;
    setItems([]);
    setUnread(0);
    await deleteAllNotifications();
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-700"
        aria-label="알림 열기"
      >
        <BellIcon size={22} />
        {unread > 0 && (
          <span className="absolute top-0.5 right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed top-14 right-2 md:top-[72px] md:right-4 w-[calc(100vw-1rem)] max-w-[320px] bg-white border border-gray-100 rounded-xl shadow-xl z-[80] overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <span className="font-semibold text-gray-900">알림</span>
            <button
              onClick={handleClearAll}
              disabled={items.length === 0}
              className="text-xs text-gray-500 hover:text-gray-800 disabled:opacity-40"
            >
              모두 읽음
            </button>
          </div>

          {isAdmin && (
            <div className="flex items-center justify-between gap-3 px-4 py-2.5 bg-gray-50 border-b border-gray-100">
              <span className="text-xs text-gray-600">
                게시글 추가 알림 받기
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={adminEnabled}
                onClick={handleToggleAdminSetting}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                  adminEnabled ? "bg-[var(--gold-400)]" : "bg-gray-300"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                    adminEnabled ? "translate-x-[18px]" : "translate-x-0.5"
                  }`}
                />
              </button>
            </div>
          )}

          <div className="max-h-[280px] overflow-y-auto">
            {loading ? (
              <div className="px-4 py-8 text-center text-sm text-gray-400">
                불러오는 중...
              </div>
            ) : items.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-gray-400">
                알림이 없습니다.
              </div>
            ) : (
              <ul>
                {items.map((n) => {
                  const href = linkFor(n);
                  const content = (
                    <div
                      className={`flex items-start gap-3 px-4 py-3 transition-colors ${
                        n.isRead
                          ? "bg-white hover:bg-gray-50"
                          : "bg-amber-50/60 hover:bg-amber-50"
                      }`}
                    >
                      {!n.isRead && (
                        <span className="mt-1.5 w-2 h-2 rounded-full bg-[var(--gold-400)] flex-shrink-0" />
                      )}
                      <div
                        className={`flex-1 ${n.isRead ? "pl-5" : ""}`}
                        style={n.isRead ? { paddingLeft: "20px" } : undefined}
                      >
                        <p className="text-sm text-gray-800 leading-snug">
                          {n.message}
                        </p>
                        <p className="mt-1 text-[11px] text-gray-400">
                          {formatRelative(n.createdAt)}
                        </p>
                      </div>
                    </div>
                  );

                  return (
                    <li
                      key={n.id}
                      className="border-b border-gray-50 last:border-b-0"
                    >
                      {href ? (
                        <Link
                          href={href}
                          onClick={() => handleItemClick(n)}
                          className="block"
                        >
                          {content}
                        </Link>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleItemClick(n)}
                          className="block w-full text-left"
                        >
                          {content}
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
