// スタート / 一時停止 / リセット のボタン群
export default function TimerControls({ isRunning, isPaused, theme, onStart, onPause, onReset }) {
  // 1つのボタンを「スタート」「一時停止」「再開」で使い回す。
  // ボタンが入れ替わらないので、押す位置が変わらず操作しやすい。
  const mainLabel = isRunning ? "一時停止" : isPaused ? "再開" : "スタート";

  return (
    <div className="flex items-center gap-4">
      <button
        type="button"
        onClick={isRunning ? onPause : onStart}
        className={`w-40 rounded-full py-4 text-lg font-semibold text-white shadow-lg transition active:scale-95 ${theme.button}`}
      >
        {mainLabel}
      </button>
      <button
        type="button"
        onClick={onReset}
        // 動いてもいないし途中でもない（＝最初の状態）ならリセットする意味がないので無効化
        disabled={!isRunning && !isPaused}
        className="rounded-full px-5 py-4 text-sm font-medium text-neutral-300 ring-1 ring-white/15 transition hover:bg-white/5 active:scale-95 disabled:cursor-not-allowed disabled:opacity-30 disabled:active:scale-100"
      >
        リセット
      </button>
    </div>
  );
}
