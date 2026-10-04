// ブラウザ通知（Notification API）を安全に扱うためのラッパー関数群。
//
// 通知は「補助機能」なので、どの関数も例外を外に投げず、
// 失敗しても戻り値で知らせるだけにしている。こうしておけば、
// 通知が使えない環境でもタイマー本体が止まることはない。
//
// 許可の状態（Notification.permission）は次の3種類:
//   "default" … まだユーザーに聞いていない（未設定）
//   "granted" … 許可された
//   "denied"  … 拒否された（ページからは二度と許可ダイアログを出せない）
// これに加えて、このアプリ独自に "unsupported"（そもそもAPIがない）を扱う。

// この環境で Notification API が使えるか。
// 古いブラウザ・iPhone の Safari（ホーム画面に追加していない場合）・
// http（https でない）のサイトなどでは window.Notification 自体が存在しない。
export function isNotificationSupported() {
  return typeof window !== "undefined" && "Notification" in window;
}

export function getNotificationPermission() {
  if (!isNotificationSupported()) return "unsupported";
  return Notification.permission;
}

// 許可ダイアログを表示する。結果の状態文字列を返す。
// ブラウザは「ユーザーのクリックなどの操作の中」でしかダイアログを出させてくれない
// （勝手に出すスパム的なサイトを防ぐため）。そのため必ずボタンのクリック処理から呼ぶ。
//
// async / await について:
// requestPermission() は、ユーザーがダイアログで選ぶまで結果が分からないため
// Promise（「あとで結果が届く約束」を表すオブジェクト）を返す。
// await を付けると、結果が届くまでこの関数の続きを待ってから進む。
export async function requestNotificationPermission() {
  if (!isNotificationSupported()) return "unsupported";
  try {
    return await Notification.requestPermission();
  } catch {
    return Notification.permission;
  }
}

// 通知を表示する。表示できたら true、できなければ false を返す。
export function showNotification(title, body) {
  if (getNotificationPermission() !== "granted") return false;
  try {
    // tag を付けると、同じ tag の通知は新しいもので置き換えられ、何個も溜まらない
    new Notification(title, { body, tag: "pomodoro-timer" });
    return true;
  } catch {
    // Android の Chrome などは new Notification() を禁止していて例外を投げる
    // （Service Worker 経由でしか通知を出せない）。その場合も静かに諦める。
    return false;
  }
}
