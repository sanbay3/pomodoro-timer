// タイマーに関する定数と、React に依存しない純粋な計算関数をまとめたファイル。
// 「純粋な関数」＝同じ引数を渡せば必ず同じ結果を返し、画面や外部の状態を
// 書き換えない関数のこと。React から切り離しておくと、単体で読みやすく、
// 将来テストを書くときにも扱いやすい。

// モードごとの設定を1箇所にまとめる。
// 秒数・表示名・通知文をセットで持たせることで、
// 「休憩を10分に変えたい」ときもここを1行直すだけで済む。
export const MODES = {
  work: {
    key: "work",
    label: "作業",
    seconds: 25 * 60,
    finishTitle: "作業おつかれさまでした！",
    finishBody: "5分休憩しましょう。",
  },
  break: {
    key: "break",
    label: "休憩",
    seconds: 5 * 60,
    finishTitle: "休憩終了です",
    finishBody: "次の作業を始めましょう。",
  },
};

// 現在のモードが終わったら、次はどのモードか
export function getNextMode(mode) {
  return mode === "work" ? "break" : "work";
}

// 秒数を "MM:SS" 形式の文字列にする（例: 1500 → "25:00", 65 → "01:05"）
// padStart(2, "0") は「2文字に満たなければ先頭を "0" で埋める」メソッド。
export function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

// 終了予定時刻（ミリ秒）から、残り秒数を計算する。
//
// 【なぜ「1秒ごとに1減らす」方式ではないのか】
// setInterval(fn, 1000) は「きっかり1秒ごと」に動く保証がない。
// 特にブラウザはバックグラウンドのタブのタイマーを間引く（最大1分に1回など）ため、
// 「1回呼ばれたら1秒減らす」方式だと、別タブを見ている間にタイマーが大きく遅れる。
// そこで「いつ終わるか」を記録しておき、毎回「終了時刻 − 現在時刻」で
// 残りを計算し直す。こうすれば呼び出しが遅れても、表示が正しい値に追いつく。
//
// Math.ceil（切り上げ）にしているのは、残り 0.3 秒のときに "00:00" ではなく
// "00:01" と表示し、ちょうど 0 になった瞬間に "00:00" にするため。
export function getRemainingSeconds(endTime, now = Date.now()) {
  return Math.max(0, Math.ceil((endTime - now) / 1000));
}

// 進捗率（0〜1）。円形プログレスバーの描画に使う。
export function getProgress(remainingSeconds, totalSeconds) {
  return 1 - remainingSeconds / totalSeconds;
}
