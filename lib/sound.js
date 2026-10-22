// タイマー終了時のチャイムを Web Audio API で鳴らす関数群。
//
// 【Web Audio API とは】
// ブラウザ上で音を「組み立てて」鳴らす仕組み。音声ファイルを用意しなくても、
//   オシレーター（決まった高さの音を出し続ける発振器）
//   → ゲイン（音量のつまみ）
//   → スピーカー（destination）
// という部品を線でつなぐイメージで音を作れる。
//
// 【自動再生ポリシーに注意】
// ブラウザは、ユーザーが一度もクリックやキー操作をしていないページから
// 音を出すことを禁止している（勝手に音が鳴る広告などを防ぐため）。
// そこで、ユーザーの操作のたびに unlockAudio() を呼んで「鳴らせる状態」にしておき、
// タイマー終了時（＝ユーザー操作ではないタイミング）でも鳴るようにする。

// AudioContext（音を扱うための土台）は1つだけ作って使い回す
let audioContext = null;

function getAudioContext() {
  if (typeof window === "undefined") return null;
  // 古い Safari は webkit という接頭辞つきの名前でしか提供していない
  const AudioContextClass = window.AudioContext ?? window.webkitAudioContext;
  if (!AudioContextClass) return null;
  audioContext ??= new AudioContextClass();
  return audioContext;
}

// ユーザー操作の中で呼び、停止状態（suspended）の AudioContext を再開しておく
export function unlockAudio() {
  const ctx = getAudioContext();
  if (ctx?.state === "suspended") {
    // resume() は Promise を返す。失敗しても通知と同じく補助機能なので無視する
    ctx.resume().catch(() => {});
  }
}

// モードごとの音階（周波数, Hz）。
// 作業終了は「下がる」音でひと息つく感じに、休憩終了は「上がる」音で切り替えを促す。
const CHIMES = {
  work: [1046.5, 880, 698.5], // ド → ラ → ファ
  break: [698.5, 880, 1046.5], // ファ → ラ → ド
};

// チャイムを鳴らす。鳴らせたら true、鳴らせなければ false を返す。
export function playChime(finishedMode) {
  const ctx = getAudioContext();
  if (!ctx || ctx.state !== "running") return false;

  try {
    // ctx.currentTime は「この AudioContext の時計」での現在時刻（秒）。
    // Web Audio では「何秒後に鳴らす」を予約できるので、3音を一度にスケジュールする。
    const now = ctx.currentTime;
    CHIMES[finishedMode].forEach((frequency, i) => {
      const start = now + i * 0.22;
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();

      oscillator.type = "sine"; // 柔らかい「ポーン」という音色
      oscillator.frequency.value = frequency;

      // 音量の変化（エンベロープ）：一瞬で大きくして、ゆっくり消す。
      // いきなり音を出し入れすると「プツッ」というノイズが出るため、必ずなめらかに変化させる。
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.25, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.6);

      oscillator.connect(gain).connect(ctx.destination);
      oscillator.start(start);
      oscillator.stop(start + 0.65);
    });
    return true;
  } catch {
    return false;
  }
}
