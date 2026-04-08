import { getAudit } from "@/lib/api";

export default async function SiteAuditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: siteId } = await params;
  const data = await getAudit(siteId).catch(() => null);

  if (!data || !data.audits?.length) {
    return (
      <div className="bg-white border border-[#e8e5e0] rounded-2xl"><div className="p-6 text-center py-12 text-[#8c8c8c] text-sm">
        No audit data yet. Run an audit from the Overview page.
      </div></div>
    );
  }

  const { summary, audits } = data;

  const apiUrl = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/v1");
  const apiKey = process.env.NEXT_PUBLIC_API_KEY || "";
  const exportUrl = `${apiUrl}/sites/${siteId}/export/audit.csv`;

  return (
    <div>
      {/* Export button */}
      <div className="flex justify-end mb-4">
        <a href={`${exportUrl}?key=${apiKey}`} className="border border-[#e8e5e0] text-[#5c5c5c] px-3 py-1.5 rounded-lg text-xs hover:bg-[#f5f3f0]" target="_blank" rel="noopener">
          Export CSV
        </a>
      </div>

      {/* Score overview */}
      <div className="grid grid-cols-5 gap-3 mb-6">
        <MiniScore label="Avg SEO" value={summary.avg_seo_score} />
        <MiniScore label="Avg GEO" value={summary.avg_geo_score} />
        <MiniScore label="Overall" value={summary.avg_total_score} />
        <MiniStat label="Critical" value={summary.critical_issues} color="#ea4335" />
        <MiniStat label="High" value={summary.high_issues} color="#f9ab00" />
      </div>

      <div className="bg-white border border-[#e8e5e0] rounded-2xl">
        <table>
          <thead>
            <tr>
              <th>Page</th>
              <th>Type</th>
              <th style={{ textAlign: "right" }}>SEO</th>
              <th style={{ textAlign: "right" }}>GEO</th>
              <th style={{ textAlign: "right" }}>Total</th>
              <th>Top Issue</th>
            </tr>
          </thead>
          <tbody>
            {audits.map((a: any) => {
              const topRec = (a.recommendations as any[])?.[0];
              return (
                <tr key={a.id}>
                  <td>
                    <p className="font-medium text-sm truncate max-w-[300px]">{a.pages?.title || "Untitled"}</p>
                    <p className="text-xs text-[#8c8c8c] font-mono">{a.pages?.path}</p>
                  </td>
                  <td><span className="bg-[#f1f3f4] text-[#5c5c5c] text-[11px] px-2.5 py-0.5 rounded-full font-medium">{a.pages?.content_type || "page"}</span></td>
                  <td style={{ textAlign: "right" }}>
                    <span className={`font-mono font-medium ${sc(a.seo_score)}`}>{a.seo_score}</span>
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <span className={`font-mono font-medium ${sc(a.geo_score)}`}>{a.geo_score}</span>
                  </td>
                  <td style={{ textAlign: "right" }}><span className="font-mono font-bold">{a.total_score}</span></td>
                  <td>
                    {topRec && (
                      <div className="flex items-center gap-2">
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${topRec.priority === "critical" ? "bg-[#ea4335]" : topRec.priority === "high" ? "bg-[#f9ab00]" : "bg-[#8c8c8c]"}`} />
                        <span className="text-xs text-[#5c5c5c] truncate max-w-[250px]">{topRec.message}</span>
                      </div>
                    )}
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

function sc(v: number) { return v >= 70 ? "text-[#2d5a3d]" : v >= 40 ? "text-[#f9ab00]" : "text-[#ea4335]"; }
function MiniScore({ label, value }: { label: string; value: number }) {
  return <div className="bg-white border border-[#e8e5e0] rounded-2xl"><div className="p-6 text-center py-3"><p className={`text-2xl font-semibold tabular-nums ${sc(value)}`}>{value}</p><p className="text-[10px] text-[#8c8c8c] uppercase tracking-wider mt-0.5">{label}</p></div></div>;
}
function MiniStat({ label, value, color }: { label: string; value: number; color: string }) {
  return <div className="bg-white border border-[#e8e5e0] rounded-2xl"><div className="p-6 text-center py-3"><p className="text-2xl font-semibold tabular-nums" style={{ color }}>{value}</p><p className="text-[10px] text-[#8c8c8c] uppercase tracking-wider mt-0.5">{label}</p></div></div>;
}
