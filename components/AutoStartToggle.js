// 「次のタイマーを自動で開始する」のオン/オフを切り替えるスイッチ。
// 見た目はスイッチだが中身は <button>。role="switch" と aria-checked を付けることで、
// スクリーンリーダーにも「オン/オフのスイッチ」として正しく伝わる。
export default function AutoStartToggle({ checked, onChange }) {
  return (
    <div className="flex items-center justify-between gap-4 px-1">
      <div>
        <p className="text-sm text-neutral-200">次のタイマーを自動で開始</p>
        <p className="text-xs text-neutral-500">オフの場合は、切り替え後にスタートを押して開始します</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label="次のタイマーを自動で開始"
        onClick={() => onChange(!checked)}
        className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
          checked ? "bg-neutral-100" : "bg-white/15"
        }`}
      >
        <span
          className={`absolute left-1 top-1 h-5 w-5 rounded-full transition-transform ${
            checked ? "translate-x-5 bg-neutral-900" : "bg-neutral-300"
          }`}
        />
      </button>
    </div>
  );
}
