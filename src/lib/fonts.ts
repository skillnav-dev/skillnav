import {
  Inter,
  Noto_Serif_SC,
  JetBrains_Mono,
  Fraunces,
} from "next/font/google";

export const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const jetBrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const notoSerifSC = Noto_Serif_SC({
  weight: ["400", "500", "600", "700", "900"],
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
});

export const fraunces = Fraunces({
  weight: ["500", "700"],
  style: ["italic", "normal"],
  subsets: ["latin"],
  variable: "--font-latin-serif",
  display: "swap",
});

export const chineseFontStack =
  '"Noto Sans SC", "PingFang SC", "Microsoft YaHei", "Hiragino Sans GB", sans-serif';
