// 表示するドットの上限。これを超えたら「+n」とまとめて表示する（はみ出し防止）。
const MAX_DOTS = 12;

// 今日の完了数・累計を表示するパネル
export default function StatsPanel({ todayCount, totalCount, theme }) {
  const dots = Math.min(todayCount, MAX_DOTS);

  return (
    <section className="w-full rounded-2xl bg-white/[0.04] p-5 ring-1 ring-white/10">
      <h2 className="mb-4 text-xs font-semibold tracking-widest text-neutral-500">記録</h2>
      <div className="grid grid-cols-2 divide-x divide-white/10 text-center">
        <div>
          <p className="text-3xl font-semibold tabular-nums">{todayCount}</p>
          <p className="mt-1 text-xs text-neutral-400">今日の完了</p>
        </div>
        <div>
          <p className="text-3xl font-semibold tabular-nums">{totalCount.toLocaleString("ja-JP")}</p>
          <p className="mt-1 text-xs text-neutral-400">累計</p>
        </div>
      </div>

      {/* 今日の完了数を「ドット」で並べて、積み上がっている感覚を見える化する */}
      <div className="mt-5 flex min-h-3 flex-wrap items-center justify-center gap-1.5" aria-hidden="true">
        {Array.from({ length: dots }, (_, i) => (
          <span key={i} className={`h-3 w-3 rounded-full ${theme.dot}`} />
        ))}
        {todayCount > MAX_DOTS && (
          <span className="ml-1 text-xs text-neutral-400">+{todayCount - MAX_DOTS}</span>
        )}
        {todayCount === 0 && (
          <span className="text-xs text-neutral-600">25分の作業を完了すると、ここに記録されます</span>
        )}
      </div>
    </section>
  );
}
