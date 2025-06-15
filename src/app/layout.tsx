import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { WalletContextProvider } from '@/components/WalletContextProvider';
import { WalletDebug } from '@/components/WalletDebug';

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Moonrush - Solana Token Creator",
  description: "Create and launch SPL tokens on Solana blockchain with Moonrush. Take your token to the moon with our powerful, secure token creation platform.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geist.variable} ${geistMono.variable} antialiased`}
      >
        <WalletContextProvider>
          {children}
          <WalletDebug />
        </WalletContextProvider>
      </body>
    </html>
  );
}
