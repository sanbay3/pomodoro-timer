// ユーザー設定（現在は「次のタイマーを自動で開始するか」のみ）の読み書き。
// 統計とは性質が違うデータなので、キーを分けて保存する。

export const SETTINGS_STORAGE_KEY = "pomodoro-timer:settings";

const DEFAULT_SETTINGS = { autoStart: false };

export function loadSettings() {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const saved = localStorage.getItem(SETTINGS_STORAGE_KEY);
    // スプレッド構文で「デフォルト値の上に保存値を上書き」する。
    // 将来設定項目が増えても、古い保存データに無い項目はデフォルト値で補われる。
    return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings) {
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // 保存できなくてもアプリは動かし続ける
  }
}
