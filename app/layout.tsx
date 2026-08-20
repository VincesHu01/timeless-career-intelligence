import type { Metadata } from "next";
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

export const metadata: Metadata = {
  title: "Cortex｜大厂产品与运营岗位能力雷达",
  description: "用真实招聘证据看懂大厂产品与运营岗位，并把 AI 能力转化为可执行的学习路径。",
  openGraph: {
    title: "Cortex｜招聘证据 · 能力透视 · AI 学习",
    description: "追踪 13 家中国互联网公司，用可回溯证据看懂产品与目标运营岗位。",
    type: "website",
    locale: "zh_CN",
    images: [{ url:"/cortex-social.png", width:1731, height:909, alt:"Cortex 招聘证据与能力透视" }],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/cortex-social.png"],
  },
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export const viewport = {
  themeColor: "#c8ff2e",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
