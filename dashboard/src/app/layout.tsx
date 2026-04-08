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
  { href: "/", label: "Projects", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1" },
  { href: "/audit", label: "Audit", icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" },
  { href: "/links", label: "Links", icon: "M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101" },
  { href: "/research", label: "Research", icon: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" },
  { href: "/briefs", label: "Briefs", icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" },
  { href: "/docs", label: "API Docs", icon: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" },
];

function NavIcon({ d }: { d: string }) {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d={d} />
    </svg>
  );
}

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
      <body className="min-h-full flex">
        {/* Sidebar */}
        <aside className="w-[220px] bg-[#1a1a2e] text-white flex flex-col fixed h-full z-50">
          <div className="p-5 pb-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[var(--accent)] rounded-lg flex items-center justify-center text-white font-bold text-sm">S</div>
              <div>
                <div className="font-semibold text-sm leading-none">SEO Agent</div>
                <div className="text-[10px] text-[#8b8fa3] mt-0.5">SEO & GEO Platform</div>
              </div>
            </Link>
          </div>

          <nav className="flex-1 px-3 space-y-0.5">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] text-[#8b8fa3] hover:bg-[#16213e] hover:text-white transition-colors"
              >
                <NavIcon d={item.icon} />
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="px-3 mb-3 space-y-2">
            <Link href="/new" className="flex items-center justify-center gap-2 w-full py-2 bg-[var(--accent)] text-white text-xs font-medium rounded-lg hover:bg-[#1557b0] transition-colors">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              New Project
            </Link>
            <form action="/api/logout" method="POST">
              <button className="flex items-center justify-center gap-2 w-full py-2 text-[#8b8fa3] text-xs hover:text-white transition-colors">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                </svg>
                Sign Out
              </button>
            </form>
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 ml-[220px] min-h-screen">
          <div className="max-w-[1200px] mx-auto px-8 py-6">
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}
