// 別のタブが localStorage の指定キーを書き換えたときに onChange を呼ぶカスタムフック。
//
// 【storage イベントとは】
// 同じサイトを複数のタブで開いているとき、あるタブが localStorage を書き換えると、
// 「ほかのタブ」の window に storage イベントが届く（書き換えた本人のタブには届かない）。
// これを使うと、タブ間で記録やタイマーの状態をそろえられる。

import { useEffect, useEffectEvent } from "react";

export function useStorageListener(key, onChange) {
  // onChange はコンポーネントが再描画されるたびに新しい関数になるため、
  // useEffectEvent で包んで「依存配列に入れなくても最新版を呼べる」ようにする
  const handleChange = useEffectEvent(onChange);

  useEffect(() => {
    const listener = (event) => {
      // event.key が null になるのは、localStorage.clear() で全消去されたとき
      if (event.key === key || event.key === null) handleChange();
    };
    window.addEventListener("storage", listener);
    // タイマーと同じく、登録したイベントはクリーンアップで必ず解除する
    return () => window.removeEventListener("storage", listener);
  }, [key]);
}
