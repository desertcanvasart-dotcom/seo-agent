import { getSites } from "@/lib/api";
import Link from "next/link";

export default async function HomePage() {
  const data = await getSites().catch(() => null);
  const sites = data?.sites || [];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-semibold">Projects</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            {sites.length} website{sites.length !== 1 ? "s" : ""} being monitored
          </p>
        </div>
        <Link href="/new" className="btn btn-primary">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          New Project
        </Link>
      </div>

      {sites.length === 0 ? (
        <div className="card">
          <div className="card-body text-center py-16">
            <div className="w-16 h-16 bg-[var(--accent-light)] rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-[var(--accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold mb-1">No projects yet</h2>
            <p className="text-sm text-[var(--text-secondary)] mb-6">Add your first website to start analyzing</p>
            <Link href="/new" className="btn btn-primary">Add Your First Website</Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sites.map((site: any) => (
            <Link key={site.id} href={`/sites/${site.id}`} className="card hover:shadow-md transition-shadow">
              <div className="card-body">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[var(--accent-light)] rounded-lg flex items-center justify-center">
                      <span className="text-[var(--accent)] font-bold text-sm">
                        {site.domain.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm">{site.domain}</h3>
                      <p className="text-xs text-[var(--text-muted)]">{site.name}</p>
                    </div>
                  </div>
                  <StatusBadge status={site.crawl_status} />
                </div>

                <div className="flex gap-4 text-xs text-[var(--text-secondary)]">
                  <span>{site.page_count} pages</span>
                  <span>Added {new Date(site.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === "completed") return <span className="badge badge-green">Crawled</span>;
  if (status === "crawling") return <span className="badge badge-yellow">Crawling...</span>;
  if (status === "failed") return <span className="badge badge-red">Failed</span>;
  return <span className="badge badge-gray">Pending</span>;
}
