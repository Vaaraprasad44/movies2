import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import ReduxProvider from "@/store/redux-provider";
import { Navigation } from "@/components/layout/Navigation";
import { ThemeProvider } from "@/contexts/theme-context";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Movie Collection - Organize Your Favorite Films",
  description: "A powerful movie collection app to search, organize, and rate your favorite films.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased transition-colors duration-300`}
      >
        <ThemeProvider>
          <ReduxProvider>
            <Navigation />
            <div className="transition-colors duration-300">
              {children}
            </div>
          </ReduxProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
