import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "个人财务管理应用",
  description: "一个简单实用的个人财务管理应用",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
