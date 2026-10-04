"use client";

import { useEffect, useState } from "react";
import ModeTabs from "@/components/ModeTabs";
import TimerDisplay from "@/components/TimerDisplay";
import TimerControls from "@/components/TimerControls";
import StatsPanel from "@/components/StatsPanel";
import NotificationControl from "@/components/NotificationControl";
import AutoStartToggle from "@/components/AutoStartToggle";
import { THEMES } from "@/components/theme";
import { usePomodoroTimer } from "@/lib/usePomodoroTimer";
import { MODES, formatTime } from "@/lib/timer";
import { addCompletedSession, getTodayCount, loadStats, saveStats } from "@/lib/stats";
import { loadSettings, saveSettings } from "@/lib/settings";
import {
  getNotificationPermission,
  requestNotificationPermission,
  showNotification,
} from "@/lib/notification";

export default function PomodoroApp() {
  // localStorage から読み込む state は、関数を渡す「遅延初期化」にする。
  // useState(loadStats()) と書くと再描画のたびに読み込みが走るが、
  // useState(loadStats) なら最初の1回だけ呼ばれる。
  // このコンポーネントは app/page.js から ssr: false で読み込まれるので、
  // 初回からブラウザ上で実行され、hydration の食い違いも起きない（7月以降と同じ方針）。
  const [stats, setStats] = useState(loadStats);
  const [settings, setSettings] = useState(loadSettings);

  // 通知の許可状態も、ブラウザにしかない情報なので同じく遅延初期化で読む
  const [permission, setPermission] = useState(getNotificationPermission);

  // タイマー終了時に画面内に出すメッセージ（通知が使えない環境でも終了が分かるように）
  const [finishMessage, setFinishMessage] = useState(null);

  // 統計・設定が変わるたびに localStorage へ保存する
  useEffect(() => {
    saveStats(stats);
  }, [stats]);

  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  // タイマーが0になったときに usePomodoroTimer から呼ばれる
  const handleFinish = (finishedMode) => {
    // 完了数として数えるのは「作業」だけ
    if (finishedMode === "work") {
      // 「直前の値をもとに新しい値を作る」ときは、関数を渡す形の setState を使う。
      // prev には React が持っている確実に最新の stats が入る。
      setStats((prev) => addCompletedSession(prev));
    }
    const { finishTitle, finishBody } = MODES[finishedMode];
    // 通知は出せなくても（false が返っても）気にせず進む。画面内メッセージは必ず出す。
    showNotification(finishTitle, finishBody);
    setFinishMessage(`${finishTitle} ${finishBody}`);
  };

  const timer = usePomodoroTimer({ autoStart: settings.autoStart, onFinish: handleFinish });
  const theme = THEMES[timer.mode];
  const modeLabel = MODES[timer.mode].label;

  // ブラウザのタブのタイトルに残り時間を出す。
  // 別のタブを見ていても、タブ名で残り時間を確認できる。
  // document.title は React の外にあるものなので、useEffect で「同期」させる。
  const timeText = formatTime(timer.remainingSeconds);
  useEffect(() => {
    document.title = `${timeText} ${modeLabel} | ポモドーロタイマー`;
  }, [timeText, modeLabel]);

  const handleStart = () => {
    setFinishMessage(null);
    timer.start();
  };

  // モードの手動切替。途中まで進んでいるときは、うっかり押しで進捗が消えないよう確認する。
  const handleModeChange = (nextMode) => {
    if ((timer.isRunning || timer.isPaused) && !window.confirm("タイマーをリセットして切り替えますか？")) {
      return;
    }
    setFinishMessage(null);
    timer.changeMode(nextMode);
  };

  const handleRequestPermission = async () => {
    const result = await requestNotificationPermission();
    setPermission(result);
  };

  const statusText = timer.isRunning ? "集中しています…" : timer.isPaused ? "一時停止中" : "";

  return (
    <div className="relative flex w-full flex-1 flex-col items-center overflow-hidden px-4 py-8 sm:py-12">
      {/* 背景のぼんやりした光。モードに合わせて色が変わる */}
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute left-1/2 top-24 h-96 w-96 -translate-x-1/2 rounded-full blur-3xl transition-colors duration-700 ${theme.glow}`}
      />

      <main className="relative flex w-full max-w-md flex-col items-center gap-7">
        <h1 className="text-lg font-semibold tracking-wide text-neutral-300">ポモドーロタイマー</h1>

        <ModeTabs mode={timer.mode} theme={theme} onChange={handleModeChange} />

        <TimerDisplay
          remainingSeconds={timer.remainingSeconds}
          totalSeconds={timer.totalSeconds}
          label={modeLabel}
          statusText={statusText}
          theme={theme}
        />

        {/* aria-live="polite"：中身が変わったらスクリーンリーダーが読み上げる */}
        <div aria-live="polite" className="w-full">
          {finishMessage && (
            <p className={`flex items-center justify-between gap-3 rounded-xl bg-white/5 px-4 py-3 text-sm ${theme.text}`}>
              <span>{finishMessage}</span>
              <button
                type="button"
                onClick={() => setFinishMessage(null)}
                aria-label="メッセージを閉じる"
                className="text-neutral-500 hover:text-neutral-200"
              >
                ✕
              </button>
            </p>
          )}
        </div>

        <TimerControls
          isRunning={timer.isRunning}
          isPaused={timer.isPaused}
          theme={theme}
          onStart={handleStart}
          onPause={timer.pause}
          onReset={timer.reset}
        />

        <StatsPanel todayCount={getTodayCount(stats)} totalCount={stats.total} theme={theme} />

        <div className="flex w-full flex-col gap-4">
          <AutoStartToggle
            checked={settings.autoStart}
            onChange={(autoStart) => setSettings((prev) => ({ ...prev, autoStart }))}
          />
          <NotificationControl permission={permission} onRequest={handleRequestPermission} />
        </div>
      </main>
    </div>
  );
}
