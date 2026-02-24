// app/layout.tsx
import type React from "react";
import type { Metadata, Viewport } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
  variable: "--font-dm-sans",
});

export const metadata: Metadata = {
  title: "HMEX",
  description: "HMEX — AI-powered NCD health risk detection",
  icons: {
    icon: "/logoHmex.png",
    shortcut: "/logoHmex.png",
    apple: "/logoHmex.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={dmSans.variable}>
      <body
        style={{
          fontFamily: `'DM Sans', sans-serif`,
        }}
      >
        {/* This div ensures DM Sans cascades absolutely everywhere */}
        <div style={{ fontFamily: `'DM Sans', sans-serif` }}>
          <ThemeProvider>
            <AuthProvider>{children}</AuthProvider>
          </ThemeProvider>
        </div>
      </body>
    </html>
  );
}