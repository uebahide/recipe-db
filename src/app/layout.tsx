import type { Metadata, Viewport } from "next";
import { JetBrains_Mono, Kiwi_Maru, Zen_Kaku_Gothic_New } from "next/font/google";
import "./globals.css";

const display = Kiwi_Maru({ weight: ["400", "500"], subsets: ["latin"], variable: "--font-display", display: "swap" });
const body = Zen_Kaku_Gothic_New({ weight: ["400", "500", "700"], subsets: ["latin"], variable: "--font-body", display: "swap" });
const mono = JetBrains_Mono({ weight: ["500"], subsets: ["latin"], variable: "--font-mono", display: "swap" });

export const metadata: Metadata = {
  title: "レシピDB",
  description: "作った料理を二度と忘れない、自分だけのレシピノート",
  appleWebApp: { capable: true, title: "レシピDB", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f6f2" },
    { media: "(prefers-color-scheme: dark)", color: "#141a17" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
