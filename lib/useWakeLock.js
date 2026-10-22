// active が true の間、画面が自動で消えない（スリープしない）ようにするカスタムフック。
//
// 【Screen Wake Lock API とは】
// navigator.wakeLock.request("screen") を呼ぶと、ブラウザが画面の自動消灯を止めてくれる。
// スマホは画面が消えると JavaScript の実行もほぼ止まるため、タイマー中に画面を
// 点けっぱなしにできれば、終了の音や表示を確実に届けられる。
//
// 注意点：
// - https のページでしか使えない（localhost は例外的に使える）
// - タブを切り替えたり画面を消したりすると、ブラウザが自動で解除する。
//   そのため、画面に戻ってきたとき（visibilitychange）に取り直す必要がある
// - 省電力モードなどで拒否されることもある。その場合は諦める（補助機能なので）

import { useEffect } from "react";

export function isWakeLockSupported() {
  return typeof navigator !== "undefined" && "wakeLock" in navigator;
}

export function useWakeLock(active) {
  useEffect(() => {
    if (!active || !isWakeLockSupported()) return;

    // 取得した Wake Lock（「センチネル」＝見張り番と呼ばれるオブジェクト）
    let sentinel = null;
    // クリーンアップ済みかどうか。下の acquire は非同期なので、
    // 取得が終わる前にタイマーが止められた（＝クリーンアップされた）場合に備える。
    let cancelled = false;

    const acquire = async () => {
      if (document.visibilityState !== "visible") return;
      try {
        const lock = await navigator.wakeLock.request("screen");
        // await で待っている間にクリーンアップされていたら、すぐ手放す。
        // これをしないと、タイマーを止めたのに画面が消えないままになる。
        if (cancelled) {
          lock.release().catch(() => {});
          return;
        }
        sentinel = lock;
      } catch {
        // 拒否された場合は何もしない
      }
    };

    // タブに戻ってきたら取り直す
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") acquire();
    };

    acquire();
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      sentinel?.release().catch(() => {});
    };
  }, [active]);
}
