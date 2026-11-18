import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase/server";
import { getAnnualRecap } from "@/api/annual-recap";
import AnnualRecapStory from "@/components/Recap/AnnualRecapStory";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "2026, 나의 리추얼 이야기 | Lolaum",
  description: "나를 위해 쌓아온 시간, 2026년의 리추얼을 돌아봐요.",
  robots: { index: false, follow: false },
};

export default async function AnnualRecapPage() {
  if (!(await getCurrentUser())) redirect("/login");
  const result = await getAnnualRecap();
  if (!result.data)
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center gap-5 bg-white px-6 text-center">
        <p className="text-xs tracking-[0.2em] text-[var(--gold-600)]">
          LOLAUM · 2026
        </p>
        <h1 className="text-2xl font-bold text-gray-900">
          잠시 쉬어가는 중이에요
        </h1>
        <p className="text-sm text-gray-600" role="alert">
          {result.error}
        </p>
        <a
          href="/recap/2026"
          className="rounded-full bg-[var(--gold-400)] px-6 py-3 font-semibold text-gray-900 hover:bg-[var(--gold-300)]"
        >
          다시 불러오기
        </a>
        <Link
          href="/ritual"
          className="py-3 text-sm text-gray-600 underline underline-offset-4"
        >
          나의 리추얼 기록으로
        </Link>
      </main>
    );
  return <AnnualRecapStory data={result.data} />;
}
