import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
  variable: "--font-outfit",
});

export const metadata: Metadata = {
  title: "내성초 클릭온 AI 마스터 챌린지 갤러리 & 실시간 랭킹",
  description: "내성초등학교 학생들이 클릭온 AI 프로그램 참여 인증서를 올리고, 실시간으로 학급별/개인별 참여 순위를 확인하는 공간입니다.",
  applicationName: "내성초 클릭온 AI 챌린지",
  keywords: ["내성초등학교", "클릭온 AI", "AI 챌린지", "인증서", "랭킹"],
  authors: [{ name: "내성초 AI 교육팀" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={`${outfit.variable} h-full antialiased`}>
      <head>
        <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🚀</text></svg>" />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
