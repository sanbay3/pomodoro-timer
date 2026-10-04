import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "ポモドーロタイマー",
  description: "25分作業と5分休憩をくり返して集中力を保つ、ポモドーロ・テクニック用タイマー",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="ja"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-neutral-950 font-sans text-neutral-100">
        {children}
        <footer className="py-4 text-center text-xs text-neutral-600">
          <p>
            by <span className="brand">さんべい</span>
          </p>
        </footer>
      </body>
    </html>
  );
}
