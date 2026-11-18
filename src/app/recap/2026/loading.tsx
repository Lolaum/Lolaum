export default function Loading() {
  return (
    <main
      className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-white px-6 text-center"
      aria-busy="true"
    >
      <p className="text-xs tracking-[0.2em] text-[var(--gold-600)]">
        LOLAUM · YEAR IN RITUAL
      </p>
      <div
        className="text-8xl font-light text-[var(--gold-600)] motion-safe:animate-pulse"
        aria-hidden="true"
      >
        2026
      </div>
      <h1 className="text-xl font-semibold text-gray-900" role="status">
        나의 한 해를 모으고 있어요
      </h1>
      <p className="text-sm text-gray-500">차곡차곡 쌓아온 기록을 곧 만나요.</p>
    </main>
  );
}
