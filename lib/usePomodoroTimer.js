// ポモドーロタイマーの「動き」だけを担当するカスタムフック。
//
// 【カスタムフックとは】
// useState や useEffect などのフックを組み合わせた処理を、
// 「use」で始まる名前の関数に切り出したもの。コンポーネントから
// 「状態＋その操作方法」をまとめて受け取れるので、画面の見た目（JSX）と
// タイマーの仕組みを分けて書ける。
//
// このフックは「何秒残っているか・動いているか」を管理するだけで、
// 統計の保存や通知の表示は知らない。終了時には onFinish を呼んで
// 呼び出し元（PomodoroApp）に任せる。役割を分けておくと、それぞれが読みやすくなる。

import { useEffect, useEffectEvent, useState } from "react";
import { MODES, getNextMode, getRemainingSeconds } from "@/lib/timer";

export function usePomodoroTimer({ autoStart, onFinish }) {
  // 現在のモード（"work" または "break"）
  const [mode, setMode] = useState("work");

  // 画面に表示する残り秒数
  const [remainingSeconds, setRemainingSeconds] = useState(MODES.work.seconds);

  // 終了予定時刻（Date.now() と同じ「ミリ秒」の数値）。止まっている間は null。
  // 「動いているかどうか」を別の state（isRunning など）で持つと、
  // endTime と食い違う可能性が出てくる。endTime が null かどうかで判断できるので、
  // 計算で求める（＝state を増やさない）方が安全。
  const [endTime, setEndTime] = useState(null);
  const isRunning = endTime !== null;

  // スタート（再開も同じ）：今から「残り秒数」後を終了予定時刻にする
  const start = () => {
    if (isRunning) return;
    setEndTime(Date.now() + remainingSeconds * 1000);
  };

  // 一時停止：その時点の残り秒数を確定させてから、終了予定時刻を消す
  const pause = () => {
    if (!isRunning) return;
    setRemainingSeconds(getRemainingSeconds(endTime));
    setEndTime(null);
  };

  // リセット：止めて、現在のモードの最初の秒数に戻す
  const reset = () => {
    setEndTime(null);
    setRemainingSeconds(MODES[mode].seconds);
  };

  // モードを手動で切り替える（切り替えたら止まった状態から始める）
  const changeMode = (nextMode) => {
    setEndTime(null);
    setMode(nextMode);
    setRemainingSeconds(MODES[nextMode].seconds);
  };

  // タイマーが0になったときの処理。
  //
  // 【useEffectEvent とは（React 19.2 で追加）】
  // 下の useEffect の中から「最新の mode・autoStart・onFinish」を使いたいが、
  // それらを useEffect の依存配列に入れると、値が変わるたびにタイマーが
  // 作り直されてしまう（例：設定の自動スタートを切り替えただけでタイマーが再セットされる）。
  // useEffectEvent で包んだ関数は「呼ばれた瞬間の最新の値」を読めるうえ、
  // 依存配列に入れなくてよい。「エフェクトから呼ばれるイベント処理」を書くための仕組み。
  const handleFinish = useEffectEvent(() => {
    const finishedMode = mode;
    const nextMode = getNextMode(mode);
    const nextSeconds = MODES[nextMode].seconds;

    // 作業 → 休憩（休憩 → 作業）へ自動で切り替える
    setMode(nextMode);
    setRemainingSeconds(nextSeconds);
    // 自動スタートがONなら、次のタイマーをそのまま開始する。OFFなら止めて待つ。
    setEndTime(autoStart ? Date.now() + nextSeconds * 1000 : null);

    onFinish(finishedMode);
  });

  // ★ タイマー本体 ★
  // endTime が変わるたび（スタート・一時停止・リセット・モード切替）に実行される。
  useEffect(() => {
    // 止まっている間は何もしない（タイマーを作らない）
    if (endTime === null) return;

    // (1) 表示更新用：250ミリ秒ごとに残り秒数を計算し直す。
    //     1000ミリ秒ごとにすると、呼ばれるタイミングのズレで表示が
    //     「2秒飛ぶ」ことがあるため、少し細かめに確認している。
    const intervalId = setInterval(() => {
      setRemainingSeconds(getRemainingSeconds(endTime));
    }, 250);

    // (2) 終了判定用：終了予定時刻ちょうどに1回だけ動くタイマー。
    //     ブラウザは裏に回ったタブの「繰り返しタイマー（setInterval）」を
    //     強く間引くことがあり、(1)だけに頼ると通知が最大1分ほど遅れうる。
    //     1回きりの setTimeout はその影響を受けにくいので、終了判定はこちらで行う。
    const timeoutId = setTimeout(() => {
      handleFinish();
    }, endTime - Date.now());

    // (3) クリーンアップ関数：次にこのエフェクトが実行される直前と、
    //     コンポーネントが画面から消えるときに React が呼び出す。
    //     ここで止めないと、古い endTime を見ているタイマーが動き続け、
    //     スタートを押すたびにタイマーが増えていく（多重起動バグ）。
    return () => {
      clearInterval(intervalId);
      clearTimeout(timeoutId);
    };
  }, [endTime]);

  return {
    mode,
    remainingSeconds,
    totalSeconds: MODES[mode].seconds,
    isRunning,
    // 止まっていて、かつ途中まで進んでいる＝一時停止中
    isPaused: !isRunning && remainingSeconds < MODES[mode].seconds,
    start,
    pause,
    reset,
    changeMode,
  };
}
