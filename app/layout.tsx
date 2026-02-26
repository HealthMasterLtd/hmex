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
  title: "HMEX — Know Your Risk Before It Knows You",
  description:
    "HMEX uses AI-powered screening to detect your risk for diabetes and hypertension in under 5 minutes. Free, private, and built for you.",
  keywords: [
    "NCD risk assessment",
    "diabetes risk screening",
    "hypertension detection",
    "AI health screening",
    "chronic disease prevention",
  ],
  openGraph: {
    title: "HMEX — Know Your Risk Before It Knows You",
    description:
      "Get your personalized diabetes and hypertension risk score in under 5 minutes. Free, private, and powered by AI.",
    url: "https://hmex.health",
    siteName: "HMEX",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "HMEX Health Risk Screening" }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "HMEX — Know Your Risk Before It Knows You",
    description:
      "AI-powered NCD screening for diabetes and hypertension. Free, private, results in minutes.",
    images: ["/og-image.png"],
  },
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