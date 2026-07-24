import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import RevenueCatInitializer from "./components/RevenueCatInitializer";
import "./globals.css";
import AuthDeepLinkHandler from "./components/AuthDeepLinkHandler";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PractCoach",
  description: "AI conversation training",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body>
        <AuthDeepLinkHandler />
        <RevenueCatInitializer />
        {children}
      </body>
    </html>
  );
}