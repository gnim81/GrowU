import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "成长优册 GrowU",
  description: "家庭积分管理工具"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
