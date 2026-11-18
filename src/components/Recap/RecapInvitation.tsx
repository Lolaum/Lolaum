import Link from "next/link";
import { ArrowUpRight, Sparkles } from "lucide-react";

export default function RecapInvitation() {
  return (
    <Link
      href="/recap/2026"
      className="group mb-5 flex items-center gap-4 rounded-2xl border border-[var(--gold-100)] bg-[var(--gold-50)] p-5 transition-colors hover:bg-[var(--gold-100)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--gold-600)]"
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--gold-100)] text-[var(--gold-600)]">
        <Sparkles size={22} aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[10px] font-bold tracking-[0.18em] text-[var(--gold-600)]">
          2026 YEAR IN RITUAL
        </span>
        <span className="mt-1 block text-base font-bold text-gray-900">
          나를 위해 쌓아온 한 해
        </span>
        <span className="mt-1 block text-xs text-gray-500">
          나의 리추얼 회고 펼쳐보기
        </span>
      </span>
      <ArrowUpRight
        size={21}
        className="shrink-0 text-[var(--gold-600)] transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
        aria-hidden="true"
      />
    </Link>
  );
}
