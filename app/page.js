// next/dynamic の ssr: false はクライアントコンポーネントの中でしか使えないため、
// このファイルの先頭に "use client" を書いておく（サーバーコンポーネントで使うとエラーになる）。
"use client";

import dynamic from "next/dynamic";

// PomodoroApp を ssr: false で読み込む＝サーバー側では一切レンダリングせず、
// ブラウザ上でのみ動かす。PomodoroApp は localStorage（統計・設定）と
// Notification.permission（通知の許可状態）を初期表示に使うが、どちらも
// サーバーには存在しない。サーバー側の描画自体をやめることで、
// hydration（サーバーとブラウザの描画結果の照合）のエラーを根本から避ける。
const PomodoroApp = dynamic(() => import("@/components/PomodoroApp"), {
  ssr: false,
  loading: () => (
    <div className="flex flex-1 items-center justify-center text-sm text-neutral-600">読み込み中...</div>
  ),
});

export default function Home() {
  return <PomodoroApp />;
}
