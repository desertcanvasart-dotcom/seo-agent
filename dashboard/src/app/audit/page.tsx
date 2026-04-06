import { getAudit } from "@/lib/api";

const SITE_ID = process.env.NEXT_PUBLIC_SITE_ID || "";

function PriorityDot({ priority }: { priority: string }) {
  const color: Record<string, string> = {
    critical: "bg-[#ef4444]",
    high: "bg-[#f97316]",
    medium: "bg-[#eab308]",
    low: "bg-[#d4d4d4]",
  };
  return <span className={`inline-block w-2 h-2 rounded-full ${color[priority] || color.low}`} />;
}

export default async function AuditPage() {
  const data = await getAudit(SITE_ID).catch(() => null);

  if (!data) {
    return (
      <div>
        <h1 className="text-2xl font-semibold tracking-tight mb-2">Audit</h1>
        <p className="text-[#888]">No audit data yet. Run an audit from the API.</p>
      </div>
    );
  }

  const { summary, audits } = data;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Audit Results</h1>
        <p className="text-sm text-[#888] mt-1">{summary.pages_audited} pages &middot; {summary.critical_issues} critical &middot; {summary.high_issues} high priority</p>
      </div>

      {/* Summary strip */}
      <div className="flex gap-6 mb-6 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-[#888]">Avg SEO:</span>
          <span className={`font-medium tabular-nums ${summary.avg_seo_score >= 70 ? "text-[#22c55e]" : summary.avg_seo_score >= 40 ? "text-[#eab308]" : "text-[#ef4444]"}`}>{summary.avg_seo_score}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[#888]">Avg GEO:</span>
          <span className={`font-medium tabular-nums ${summary.avg_geo_score >= 70 ? "text-[#22c55e]" : summary.avg_geo_score >= 40 ? "text-[#eab308]" : "text-[#ef4444]"}`}>{summary.avg_geo_score}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[#888]">Avg Total:</span>
          <span className="font-medium tabular-nums">{summary.avg_total_score}</span>
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-[#fafafa]">
              <th className="text-left p-3 text-[#888]">Page</th>
              <th className="text-left p-3 text-[#888] w-20">Type</th>
              <th className="text-right p-3 text-[#888] w-14">SEO</th>
              <th className="text-right p-3 text-[#888] w-14">GEO</th>
              <th className="text-right p-3 text-[#888] w-16">Total</th>
              <th className="text-left p-3 text-[#888]">Issues</th>
            </tr>
          </thead>
          <tbody>
            {(audits || []).map((a: any) => {
              const recs = (a.recommendations || []) as any[];
              return (
                <tr key={a.id} className="border-b last:border-0 hover:bg-[#fafafa]">
                  <td className="p-3">
                    <p className="font-medium truncate max-w-sm">{a.pages?.title || "Untitled"}</p>
                    <p className="text-xs text-[#aaa] font-mono">{a.pages?.path}</p>
                  </td>
                  <td className="p-3">
                    <span className="text-xs text-[#888] bg-[#f5f5f5] px-1.5 py-0.5 rounded">{a.pages?.content_type || "-"}</span>
                  </td>
                  <td className="p-3 text-right tabular-nums">
                    <span className={a.seo_score >= 70 ? "text-[#22c55e]" : a.seo_score >= 40 ? "text-[#eab308]" : "text-[#ef4444]"}>{a.seo_score}</span>
                  </td>
                  <td className="p-3 text-right tabular-nums">
                    <span className={a.geo_score >= 70 ? "text-[#22c55e]" : a.geo_score >= 40 ? "text-[#eab308]" : "text-[#ef4444]"}>{a.geo_score}</span>
                  </td>
                  <td className="p-3 text-right tabular-nums font-medium">{a.total_score}</td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-1.5">
                      {recs.slice(0, 3).map((r: any, i: number) => (
                        <span key={i} className="inline-flex items-center gap-1 text-xs text-[#666]">
                          <PriorityDot priority={r.priority} />
                          <span className="truncate max-w-[180px]">{r.message}</span>
                        </span>
                      ))}
                      {recs.length > 3 && (
                        <span className="text-xs text-[#aaa]">+{recs.length - 3} more</span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
