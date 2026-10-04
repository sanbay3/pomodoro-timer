// 日付は "YYYY-MM-DD" 文字列で統一して扱う（6月の習慣トラッカーのノウハウ）。
// toISOString() はUTC基準になり、日本時間の0時〜9時に「前日」になってしまうため、
// ローカルタイム基準の getFullYear / getMonth / getDate から組み立てる。
export function toDateStr(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function getToday() {
  return toDateStr(new Date());
}
