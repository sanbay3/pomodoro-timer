import { MODES } from "@/lib/timer";

// 「作業 / 休憩」を切り替えるセグメントコントロール（横並びの切替ボタン）
export default function ModeTabs({ mode, theme, onChange }) {
  return (
    <div
      role="tablist"
      aria-label="タイマーの種類"
      className="inline-flex rounded-full bg-white/5 p-1 ring-1 ring-white/10"
    >
      {Object.values(MODES).map((m) => {
        const isActive = m.key === mode;
        return (
          <button
            key={m.key}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => !isActive && onChange(m.key)}
            className={`rounded-full px-5 py-1.5 text-sm font-medium transition-colors ${
              isActive ? theme.tabActive : "text-neutral-400 hover:text-neutral-100"
            }`}
          >
            {m.label} {m.seconds / 60}分
          </button>
        );
      })}
    </div>
  );
}
