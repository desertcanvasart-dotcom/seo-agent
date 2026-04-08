import { getSites } from "@/lib/api";
import { createSupabaseServer } from "@/lib/supabase-server";
import Link from "next/link";

export default async function DashboardPage() {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  const data = await getSites().catch(() => null);
  const sites = data?.sites || [];

  return (
    <div>
      {/* Welcome */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-semibold text-[#1a1a1a]">
            Welcome{user?.user_metadata?.full_name ? `, ${user.user_metadata.full_name}` : ""}
          </h1>
          <p className="text-sm text-[#5c5c5c] mt-1">
            {sites.length} project{sites.length !== 1 ? "s" : ""} being monitored
          </p>
        </div>
        <Link href="/dashboard/new" className="bg-[#2d5a3d] text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-[#234a31] transition-colors flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          New Project
        </Link>
      </div>

      {sites.length === 0 ? (
        <div className="bg-white border border-[#e8e5e0] rounded-2xl p-12 text-center">
          <div className="w-16 h-16 bg-[#e8f0e8] rounded-2xl flex items-center justify-center mx-auto mb-5">
            <svg className="w-8 h-8 text-[#2d5a3d]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-[#1a1a1a] mb-2">Add your first website</h2>
          <p className="text-sm text-[#5c5c5c] max-w-md mx-auto mb-6">
            Paste any URL and we&apos;ll automatically crawl, audit, find linking opportunities, and generate content briefs.
          </p>
          <Link href="/dashboard/new" className="inline-flex bg-[#2d5a3d] text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-[#234a31] transition-colors">
            Add Website
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sites.map((site: any) => (
            <Link key={site.id} href={`/dashboard/sites/${site.id}`} className="group">
              <div className="bg-white border border-[#e8e5e0] rounded-2xl p-5 hover:border-[#2d5a3d]/40 hover:shadow-sm transition-all">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 bg-[#f5f3f0] rounded-xl flex items-center justify-center group-hover:bg-[#e8f0e8] transition-colors">
                      <span className="text-[#2d5a3d] font-bold text-sm">
                        {site.domain.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm text-[#1a1a1a]">{site.domain}</h3>
                      <p className="text-xs text-[#8c8c8c]">{site.page_count} pages</p>
                    </div>
                  </div>
                  <StatusPill status={site.crawl_status} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#8c8c8c]">Added {new Date(site.created_at).toLocaleDateString()}</span>
                  <span className="text-xs text-[#2d5a3d] font-medium opacity-0 group-hover:opacity-100 transition-opacity">Open &rarr;</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const styles: Record<string, string> = {
    completed: "bg-[#e8f0e8] text-[#2d5a3d]",
    crawling: "bg-[#fef7e0] text-[#b8860b]",
    failed: "bg-[#fce8e6] text-[#c5221f]",
    pending: "bg-[#f1f3f4] text-[#5c5c5c]",
  };
  return (
    <span className={`text-[11px] font-medium px-2.5 py-1 rounded-full ${styles[status] || styles.pending}`}>
      {status === "completed" ? "Ready" : status}
    </span>
  );
}
