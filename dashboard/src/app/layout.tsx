import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
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
  title: "SEO Agent",
  description: "SEO & GEO audit, internal linking, research, and content briefs",
};

const navItems = [
  { href: "/", label: "Overview" },
  { href: "/audit", label: "Audit" },
  { href: "/links", label: "Links" },
  { href: "/research", label: "Research" },
  { href: "/briefs", label: "Briefs" },
];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {/* Top nav */}
        <header className="border-b sticky top-0 bg-white z-50">
          <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-14">
            <div className="flex items-center gap-8">
              <Link href="/" className="font-semibold text-base tracking-tight">
                SEO Agent
              </Link>
              <nav className="flex items-center gap-1">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="px-3 py-1.5 rounded-md text-sm text-[#888] hover:text-[#111] hover:bg-[#f5f5f5] transition-colors"
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>
            <Link
              href="/new"
              className="px-3 py-1.5 rounded-md text-sm bg-[#111] text-white hover:bg-[#333] transition-colors"
            >
              + Add Site
            </Link>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8">
          {children}
        </main>

        {/* Footer */}
        <footer className="border-t py-4">
          <div className="max-w-7xl mx-auto px-6 flex items-center justify-between text-xs text-[#aaa]">
            <span>SEO/GEO Agent v0.1</span>
            <span>travel2egypt.org</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
