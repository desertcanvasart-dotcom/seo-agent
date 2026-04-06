import { getAudit, getSuggestions, getBriefs, getCrawlStatus } from "@/lib/api";
import Link from "next/link";

const SITE_ID = process.env.NEXT_PUBLIC_SITE_ID || "";

function Score({ value, label }: { value: number; label: string }) {
  const color = value >= 70 ? "text-[#22c55e]" : value >= 40 ? "text-[#eab308]" : "text-[#ef4444]";
  const bg = value >= 70 ? "bg-[#22c55e]" : value >= 40 ? "bg-[#eab308]" : "bg-[#ef4444]";
  return (
    <div className="border rounded-lg p-5">
      <p className="text-xs text-[#888] uppercase tracking-wider mb-2">{label}</p>
      <p className={`text-5xl font-light tabular-nums ${color}`}>{value}</p>
      <div className="mt-3 w-full bg-[#f5f5f5] rounded-full h-1">
        <div className={`h-1 rounded-full ${bg}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function Stat({ value, label, href }: { value: string | number; label: string; href?: string }) {
  const inner = (
    <div className={`border rounded-lg p-5 ${href ? "hover:border-[#22c55e] transition-colors cursor-pointer" : ""}`}>
      <p className="text-xs text-[#888] uppercase tracking-wider mb-1">{label}</p>
      <p className="text-3xl font-light tabular-nums">{value}</p>
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

export default async function OverviewPage() {
  let audit, suggestions, briefsData, crawl;

  try {
    [audit, suggestions, briefsData, crawl] = await Promise.all([
      getAudit(SITE_ID).catch(() => null),
      getSuggestions(SITE_ID).catch(() => null),
      getBriefs(SITE_ID).catch(() => null),
      getCrawlStatus(SITE_ID).catch(() => null),
    ]);
  } catch {
    return (
      <div className="border border-[#ef4444] rounded-lg p-6 text-sm">
        <p className="font-medium text-[#ef4444]">Cannot connect to API</p>
        <p className="text-[#888] mt-1">Make sure the server is running on port 8000.</p>
      </div>
    );
  }

  const s = audit?.summary || { pages_audited: 0, avg_seo_score: 0, avg_geo_score: 0, avg_total_score: 0, critical_issues: 0, high_issues: 0 };

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-[#888] mt-1">
          {crawl?.domain || "travel2egypt.org"} &middot; {crawl?.pages_crawled || 0} pages &middot; Last crawl {crawl?.crawl_completed_at ? new Date(crawl.crawl_completed_at).toLocaleDateString() : "never"}
        </p>
      </div>

      {/* Scores */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Score value={s.avg_seo_score} label="SEO Score" />
        <Score value={s.avg_geo_score} label="GEO Score" />
        <Score value={s.avg_total_score} label="Overall" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <Stat value={s.pages_audited} label="Pages Audited" href="/audit" />
        <Stat value={s.critical_issues} label="Critical Issues" href="/audit" />
        <Stat value={suggestions?.total || 0} label="Link Suggestions" href="/links" />
        <Stat value={briefsData?.briefs?.length || 0} label="Content Briefs" href="/briefs" />
      </div>

      {/* Pages table */}
      {audit?.audits && audit.audits.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium uppercase tracking-wider text-[#888]">Pages needing attention</h2>
            <Link href="/audit" className="text-xs text-[#22c55e] hover:underline">View all &rarr;</Link>
          </div>
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-[#fafafa]">
                  <th className="text-left p-3 font-medium text-[#888]">Page</th>
                  <th className="text-right p-3 font-medium text-[#888] w-16">SEO</th>
                  <th className="text-right p-3 font-medium text-[#888] w-16">GEO</th>
                  <th className="text-right p-3 font-medium text-[#888] w-20">Total</th>
                  <th className="text-left p-3 font-medium text-[#888]">Top Issue</th>
                </tr>
              </thead>
              <tbody>
                {audit.audits.slice(0, 10).map((a: any) => {
                  const topRec = (a.recommendations as any[])?.[0];
                  return (
                    <tr key={a.id} className="border-b last:border-0 hover:bg-[#fafafa]">
                      <td className="p-3">
                        <p className="font-medium truncate max-w-xs">{a.pages?.title || "Untitled"}</p>
                        <p className="text-xs text-[#aaa] font-mono">{a.pages?.path}</p>
                      </td>
                      <td className="p-3 text-right tabular-nums">
                        <span className={a.seo_score >= 70 ? "text-[#22c55e]" : a.seo_score >= 40 ? "text-[#eab308]" : "text-[#ef4444]"}>{a.seo_score}</span>
                      </td>
                      <td className="p-3 text-right tabular-nums">
                        <span className={a.geo_score >= 70 ? "text-[#22c55e]" : a.geo_score >= 40 ? "text-[#eab308]" : "text-[#ef4444]"}>{a.geo_score}</span>
                      </td>
                      <td className="p-3 text-right tabular-nums font-medium">{a.total_score}</td>
                      <td className="p-3">
                        {topRec && (
                          <span className="text-xs text-[#888]">{topRec.message}</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
