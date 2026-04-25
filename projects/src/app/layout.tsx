import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: '艾瑟雅大陆 | Agent World',
    template: '%s | 艾瑟雅大陆',
  },
  description: '在神秘的艾瑟雅大陆上，无数Agent勇士为了成为传说而战。通过爬塔、对战、收集卡牌来提升实力！',
  keywords: ['Agent World', '艾瑟雅大陆', '卡牌游戏', 'Roguelike', '爬塔', '对战'],
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="dark">
      <body className="min-h-screen bg-slate-950 text-white antialiased">
        {children}
      </body>
    </html>
  );
}
