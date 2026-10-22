// 「進行中のタイマー」を localStorage に保存・復元する関数群。
// 再読み込みやタブを閉じたあとでも、続きから再開できるようにするためのもの。
//
// 保存する形:
// {
//   mode: "work",           // 現在のモード
//   endTime: 1760000000000, // 動いている間の終了予定時刻（止まっている間は null）
//   pausedSeconds: null     // 止まっている間の残り秒数（動いている間は null）
// }
//
// 動いている間は「残り秒数」を保存しない。終了予定時刻さえあれば
// 開き直した時点の残りを計算できるので、1秒ごとに書き込む必要がない。

import { MODES } from "@/lib/timer";

export const TIMER_STORAGE_KEY = "pomodoro-timer:timer";

const DEFAULT_TIMER_STATE = { mode: "work", endTime: null, pausedSeconds: null };

export function loadTimerState() {
  if (typeof window === "undefined") return DEFAULT_TIMER_STATE;
  try {
    const saved = JSON.parse(localStorage.getItem(TIMER_STORAGE_KEY));
    // 保存データがない・形が崩れている場合は最初の状態から始める。
    // MODES[saved.mode] が存在するかで、"work" / "break" 以外の値を弾いている。
    if (!saved || !MODES[saved.mode]) return DEFAULT_TIMER_STATE;

    const max = MODES[saved.mode].seconds;
    return {
      mode: saved.mode,
      endTime: Number.isFinite(saved.endTime) ? saved.endTime : null,
      pausedSeconds:
        Number.isInteger(saved.pausedSeconds) && saved.pausedSeconds > 0 && saved.pausedSeconds <= max
          ? saved.pausedSeconds
          : null,
    };
  } catch {
    return DEFAULT_TIMER_STATE;
  }
}

// 終了予定時刻が endTime のタイマーについて、別のタブがすでに終了処理を済ませたか。
// 終了処理をしたタブは次のモードの状態を保存し直すので、保存されている
// endTime が自分のものと違っていれば「処理済み」と判断できる。
// 保存データが読めない環境では、二重カウントより「数え漏れ」の方が困るので false を返す。
export function wasHandledByAnotherTab(endTime) {
  try {
    const raw = localStorage.getItem(TIMER_STORAGE_KEY);
    if (raw === null) return false;
    return JSON.parse(raw).endTime !== endTime;
  } catch {
    return false;
  }
}

export function saveTimerState(state) {
  try {
    localStorage.setItem(TIMER_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // 保存できなくても、タイマー自体は動かし続ける
  }
}
