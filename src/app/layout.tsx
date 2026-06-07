import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "成她100",
  description: "100天，把她还给她",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
