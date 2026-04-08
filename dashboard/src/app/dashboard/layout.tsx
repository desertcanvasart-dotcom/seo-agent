import Link from "next/link";
import { createSupabaseServer } from "@/lib/supabase-server";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="flex min-h-screen bg-[#fafaf8]">
      {/* Sidebar */}
      <aside className="w-[240px] bg-white border-r border-[#e8e5e0] flex flex-col fixed h-full z-50">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-[#e8e5e0]">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-[#2d5a3d] rounded-lg flex items-center justify-center text-white font-bold text-sm">S</div>
            <div>
              <div className="font-semibold text-sm text-[#1a1a1a] leading-none">SEO Agent</div>
              <div className="text-[10px] text-[#8c8c8c] mt-0.5">Dashboard</div>
            </div>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          <p className="px-3 text-[10px] font-medium text-[#8c8c8c] uppercase tracking-wider mb-2">General</p>
          <NavLink href="/dashboard" icon="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1" label="Projects" />
          <NavLink href="/docs" icon="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" label="API Docs" />
        </nav>

        {/* Bottom */}
        <div className="px-3 pb-4 space-y-2">
          <Link href="/dashboard/new" className="flex items-center justify-center gap-2 w-full py-2.5 bg-[#2d5a3d] text-white text-xs font-medium rounded-lg hover:bg-[#234a31] transition-colors">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            New Project
          </Link>

          {/* User */}
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-[#fafaf8]">
            <div className="w-8 h-8 bg-[#e8e5e0] rounded-full flex items-center justify-center text-[#5c5c5c] text-xs font-medium">
              {user?.email?.charAt(0).toUpperCase() || "?"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-[#1a1a1a] truncate">{user?.user_metadata?.full_name || "User"}</p>
              <p className="text-[10px] text-[#8c8c8c] truncate">{user?.email}</p>
            </div>
          </div>

          <form action="/api/auth/signout" method="POST">
            <button className="flex items-center justify-center gap-2 w-full py-2 text-[#8c8c8c] text-xs hover:text-[#5c5c5c] transition-colors">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
              </svg>
              Sign Out
            </button>
          </form>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 ml-[240px] min-h-screen">
        <div className="max-w-[1100px] mx-auto px-8 py-8">
          {children}
        </div>
      </main>
    </div>
  );
}

function NavLink({ href, icon, label }: { href: string; icon: string; label: string }) {
  return (
    <Link href={href} className="flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] text-[#5c5c5c] hover:bg-[#f5f3f0] hover:text-[#1a1a1a] transition-colors">
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
      </svg>
      {label}
    </Link>
  );
}
