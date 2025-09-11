import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import Image from "next/image";
import "./globals.css";
import MobileNav from "@/components/MobileNav";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Vega Chess Results",
  description: "View tournaments in chronological order.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const buildTimeIso = process.env.NEXT_PUBLIC_BUILD_TIME;
  const buildTimeMelbourne = buildTimeIso
    ? new Date(buildTimeIso).toLocaleString('en-AU', {
      timeZone: 'Australia/Melbourne',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
    : undefined;
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <div className="bg-gradient-to-br from-blue-50 to-blue-200 min-h-screen font-sans">
          <header className="relative bg-white shadow flex items-center justify-between px-2 md:px-6 py-4">
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center gap-4">
                <Image src="/logo.svg" alt="Vega Chess Results Logo" width={40} height={40} className="rounded-full border border-blue-300" />
                <span className="text-xl md:text-2xl font-bold text-blue-700 tracking-wide">Vega Chess Results</span>
              </Link>
            </div>
            <nav className="hidden md:flex items-center gap-6">
              
            </nav>
            <MobileNav />
          </header>
          <main className="px0 md:px-4 pb-8">{children}</main>
          <footer className="bg-white border-t mt-12 py-6 text-gray-500 text-sm">
            <div className="max-w-6xl mx-auto px-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-center sm:text-left">
                  &copy; {new Date().getFullYear()} Vega Chess Results. All rights reserved.
                </div>
                <div className="flex items-center gap-4 text-center sm:text-right"></div>
              </div>
              <div className="text-center text-gray-400 text-xs pt-3">
                Generated at : {buildTimeMelbourne}
              </div>
            </div>

          </footer>
        </div>
      </body>
    </html>
  )
};
