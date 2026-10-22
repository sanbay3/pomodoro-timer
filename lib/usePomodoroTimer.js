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
import {
  TIMER_STORAGE_KEY,
  loadTimerState,
  saveTimerState,
  wasHandledByAnotherTab,
} from "@/lib/timerStorage";
import { useStorageListener } from "@/lib/useStorageListener";

// 終了予定時刻からこれ以上遅れて終了に気づいた場合は「画面の前にいなかった」とみなし、
// 自動スタートの設定がオンでも次のタイマーを始めない（3時間後に開いたら勝手に休憩が
// 始まっていた、とならないように）
const LATE_FINISH_MS = 60 * 1000;

// 保存データ（loadTimerState の戻り値）から、表示する残り秒数を求める
function toRemainingSeconds(saved) {
  if (saved.endTime !== null) return getRemainingSeconds(saved.endTime);
  return saved.pausedSeconds ?? MODES[saved.mode].seconds;
}

export function usePomodoroTimer({ autoStart, onFinish }) {
  // 保存されている「進行中のタイマー」を、最初の描画で1回だけ読み込む（遅延初期化）。
  // 下の3つの useState の初期値は、すべてこの saved から作る。
  // useState の初期値は最初の描画でしか使われないので、2回目以降の描画で
  // saved が使われることはない（だから setSaved は不要で、受け取っていない）。
  const [saved] = useState(loadTimerState);

  // 現在のモード（"work" または "break"）
  const [mode, setMode] = useState(saved.mode);

  // 画面に表示する残り秒数
  const [remainingSeconds, setRemainingSeconds] = useState(() => toRemainingSeconds(saved));

  // 終了予定時刻（Date.now() と同じ「ミリ秒」の数値）。止まっている間は null。
  // 「動いているかどうか」を別の state（isRunning など）で持つと、
  // endTime と食い違う可能性が出てくる。endTime が null かどうかで判断できるので、
  // 計算で求める（＝state を増やさない）方が安全。
  //
  // 再読み込みする前に動いていた場合は、保存された終了予定時刻をそのまま使う。
  // 「終了予定時刻 − 現在時刻」で残りを計算する方式なので、閉じていた間の時間も
  // 自動的に差し引かれ、正しい残り時間から再開できる。
  const [endTime, setEndTime] = useState(saved.endTime);
  const isRunning = endTime !== null;

  // 保存データの内容を、そのまま画面の状態に反映する
  const applySavedState = (state) => {
    setMode(state.mode);
    setEndTime(state.endTime);
    setRemainingSeconds(toRemainingSeconds(state));
  };

  // ── 保存 ──
  // 止まっている間だけ残り秒数を保存する（動いている間は endTime があれば十分）。
  // pausedSeconds は動いている間ずっと null のままなので、依存配列に入れても
  // 1秒ごとに保存が走ることはない。
  const pausedSeconds = isRunning ? null : remainingSeconds;
  useEffect(() => {
    saveTimerState({ mode, endTime, pausedSeconds });
  }, [mode, endTime, pausedSeconds]);

  // ── タブ間の同期 ──
  // 別のタブでスタート・一時停止などが行われたら、このタブにも反映する。
  // これがないと、2つのタブがそれぞれ別のタイマーを動かしてしまう。
  useStorageListener(TIMER_STORAGE_KEY, () => applySavedState(loadTimerState()));

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
    // 複数のタブで開いていると、同じタイマーの終了を各タブが検知する。
    // 先に終了処理をしたタブは、次のモードの状態を保存し直している。
    // 別のタブが処理済みなら、完了数を二重に数えないよう、保存された状態に合わせるだけにする。
    if (wasHandledByAnotherTab(endTime)) {
      applySavedState(loadTimerState());
      return;
    }

    const finishedMode = mode;
    const nextMode = getNextMode(mode);
    const nextSeconds = MODES[nextMode].seconds;
    const isLate = Date.now() - endTime > LATE_FINISH_MS;

    // 作業 → 休憩（休憩 → 作業）へ自動で切り替える
    setMode(nextMode);
    setRemainingSeconds(nextSeconds);
    // 自動スタートがONなら、次のタイマーをそのまま開始する。OFFなら止めて待つ。
    // ただし大きく遅れて終了に気づいた場合は、ユーザーが不在だったとみなして止めて待つ。
    setEndTime(autoStart && !isLate ? Date.now() + nextSeconds * 1000 : null);

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
    //     閉じている間に終了予定時刻を過ぎていた場合は待ち時間がマイナスになるが、
    //     setTimeout はマイナスを 0 として扱うので、開いた直後に終了処理が動く。
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
