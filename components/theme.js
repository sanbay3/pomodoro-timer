// モードごとの配色（Tailwindのクラス名）をまとめたファイル。
//
// 【注意】Tailwind はソースコードの中に「完全な形で書かれたクラス名」だけを
// CSSとして生成する。`bg-${color}-500` のように文字列を組み立てると
// Tailwind がクラス名を見つけられずスタイルが当たらない。
// そのため、使うクラス名はすべてこのように省略せず書いておく。
export const THEMES = {
  work: {
    glow: "bg-rose-600/25",
    ring: "stroke-rose-500",
    text: "text-rose-400",
    button: "bg-rose-500 hover:bg-rose-400 shadow-rose-500/40",
    tabActive: "bg-rose-500 text-white",
    dot: "bg-rose-500",
  },
  break: {
    glow: "bg-teal-500/20",
    ring: "stroke-teal-400",
    text: "text-teal-300",
    button: "bg-teal-500 hover:bg-teal-400 shadow-teal-500/40",
    tabActive: "bg-teal-500 text-white",
    dot: "bg-teal-400",
  },
};
