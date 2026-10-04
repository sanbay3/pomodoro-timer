import { formatTime, getProgress } from "@/lib/timer";

// SVGの円の半径と円周。viewBox を 0〜100 の座標系にしているので、
// 実際の表示サイズ（w-72 など）に関係なく同じ計算で描ける。
const RADIUS = 45;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

// 残り時間を円形のプログレスリングと大きな数字で表示する
export default function TimerDisplay({ remainingSeconds, totalSeconds, label, statusText, theme }) {
  const progress = getProgress(remainingSeconds, totalSeconds);

  return (
    <div className="relative aspect-square w-72 sm:w-80">
      {/*
        円形プログレスの仕組み：
        stroke-dasharray に円周の長さを指定すると「円周ぶんの線＋円周ぶんの隙間」の
        破線になる。stroke-dashoffset でその破線をずらすと、ずらした分だけ線が消える。
        経過した割合（progress）だけずらすことで、残り時間に応じて線が減っていく。
        -rotate-90 は、線の始点を「3時の位置」から「12時の位置」に回すため。
      */}
      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90" aria-hidden="true">
        <circle cx="50" cy="50" r={RADIUS} fill="none" strokeWidth="3" className="stroke-white/10" />
        <circle
          cx="50"
          cy="50"
          r={RADIUS}
          fill="none"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={CIRCUMFERENCE * progress}
          className={`${theme.ring} transition-[stroke-dashoffset,stroke] duration-1000 ease-linear`}
        />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <p className={`text-sm font-semibold tracking-[0.3em] ${theme.text}`}>{label}</p>
        {/*
          tabular-nums：数字の幅をすべて同じにする指定。
          これがないと "1" と "0" で幅が違い、1秒ごとに文字がガタガタ動いて見える。
          role="timer" は、スクリーンリーダーに「これはタイマーです」と伝える属性。
        */}
        <p role="timer" className="my-1 font-mono text-7xl font-light tabular-nums tracking-tight sm:text-8xl">
          {formatTime(remainingSeconds)}
        </p>
        <p className="h-5 text-xs text-neutral-500">{statusText}</p>
      </div>
    </div>
  );
}
