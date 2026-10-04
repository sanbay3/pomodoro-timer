// 完了した作業セッションの記録（統計）を扱う関数群。
//
// 保存する形:
// {
//   total: 42,                       // 累計の完了数
//   daily: { "2026-10-04": 3, ... }  // 日付ごとの完了数
// }
// 「今日の完了数」は daily[今日の日付] を見るだけで求まる。
// 日付が変わると自然に別のキーになるので、「日付が変わったらリセット」する処理が要らない。

import { getToday } from "@/lib/date";

export const STATS_STORAGE_KEY = "pomodoro-timer:stats";

const EMPTY_STATS = { total: 0, daily: {} };

// localStorage から統計を読み込む。
// このファイルの関数は ssr: false のコンポーネントからしか呼ばれないが、
// 念のため window の存在も確認しておく（サーバー上には localStorage がない）。
export function loadStats() {
  if (typeof window === "undefined") return EMPTY_STATS;
  try {
    const saved = localStorage.getItem(STATS_STORAGE_KEY);
    if (!saved) return EMPTY_STATS;
    const parsed = JSON.parse(saved);
    // 手で書き換えられたなどで形が崩れていても動くよう、型を確認して補う
    return {
      total: Number.isFinite(parsed.total) ? parsed.total : 0,
      daily: parsed.daily && typeof parsed.daily === "object" ? parsed.daily : {},
    };
  } catch {
    // JSONとして壊れていた場合は空の統計から始める
    return EMPTY_STATS;
  }
}

export function saveStats(stats) {
  try {
    localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(stats));
  } catch {
    // 容量オーバーやプライベートモードなどで保存できなくても、アプリ自体は止めない
  }
}

// 作業セッションを1回分追加した「新しい」統計オブジェクトを返す。
// 元の stats を直接書き換えず（stats.total++ などをせず）、新しいオブジェクトを作るのは、
// React が「オブジェクトが別物になった＝状態が変わった」と判断して再描画するため。
export function addCompletedSession(stats, date = getToday()) {
  return {
    total: stats.total + 1,
    daily: { ...stats.daily, [date]: (stats.daily[date] ?? 0) + 1 },
  };
}

export function getTodayCount(stats, date = getToday()) {
  return stats.daily[date] ?? 0;
}
