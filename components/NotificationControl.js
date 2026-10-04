// 通知の許可状態に応じて、表示内容を切り替えるコンポーネント。
// permission は "default" | "granted" | "denied" | "unsupported" のいずれか。
export default function NotificationControl({ permission, onRequest }) {
  // 未設定：許可を求めるボタンを出す（ダイアログはこのクリックをきっかけに表示される）
  if (permission === "default") {
    return (
      <button
        type="button"
        onClick={onRequest}
        className="w-full rounded-xl bg-white/5 px-4 py-3 text-sm text-neutral-200 ring-1 ring-white/15 transition hover:bg-white/10"
      >
        🔔 タイマー終了時の通知を許可する
      </button>
    );
  }

  // 許可済み・拒否・非対応は、説明文を出すだけ
  const messages = {
    granted: { icon: "🔔", text: "通知はオンです。別のタブを見ていても終了をお知らせします。" },
    denied: {
      icon: "🔕",
      text: "通知がブロックされています。使う場合は、アドレスバー横のサイト設定から許可してください。",
    },
    unsupported: {
      icon: "🔕",
      text: "このブラウザでは通知を使えません。タイマーはそのまま使えます。",
    },
  };
  const { icon, text } = messages[permission];

  return (
    <p className="flex gap-2 rounded-xl px-4 py-3 text-xs leading-relaxed text-neutral-400 ring-1 ring-white/10">
      <span aria-hidden="true">{icon}</span>
      <span>{text}</span>
    </p>
  );
}
