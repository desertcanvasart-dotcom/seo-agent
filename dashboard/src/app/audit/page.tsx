import { getAudit } from "@/lib/api";

const SITE_ID = process.env.NEXT_PUBLIC_SITE_ID || "";

export default async function AuditPage() {
  const data = await getAudit(SITE_ID).catch(() => null);

  if (!data || !data.audits?.length) {
    return (
      <div>
        <h1 className="text-xl font-semibold mb-2">Audit Results</h1>
        <div className="card"><div className="card-body text-center py-12 text-[var(--text-muted)] text-sm">No audit data yet. Run an audit from a project page.</div></div>
      </div>
    );
  }

  const { summary, audits } = data;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold">Audit Results</h1>
          <p className="text-sm text-[var(--text-secondary)]">{summary.pages_audited} pages analyzed</p>
        </div>
      </div>

      {/* Score overview */}
      <div className="grid grid-cols-5 gap-3 mb-6">
        <MiniScore label="Avg SEO" value={summary.avg_seo_score} />
        <MiniScore label="Avg GEO" value={summary.avg_geo_score} />
        <MiniScore label="Overall" value={summary.avg_total_score} />
        <MiniStat label="Critical" value={summary.critical_issues} color="var(--red)" />
        <MiniStat label="High" value={summary.high_issues} color="var(--yellow)" />
      </div>

      {/* Table */}
      <div className="card">
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
                    <p className="text-xs text-[var(--text-muted)] font-mono">{a.pages?.path}</p>
                  </td>
                  <td><span className="badge badge-gray">{a.pages?.content_type || "page"}</span></td>
                  <td style={{ textAlign: "right" }}>
                    <span className={`font-mono font-medium ${scoreColor(a.seo_score)}`}>{a.seo_score}</span>
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <span className={`font-mono font-medium ${scoreColor(a.geo_score)}`}>{a.geo_score}</span>
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <span className="font-mono font-bold">{a.total_score}</span>
                  </td>
                  <td>
                    {topRec && (
                      <div className="flex items-center gap-2">
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                          topRec.priority === "critical" ? "bg-[var(--red)]" :
                          topRec.priority === "high" ? "bg-[var(--yellow)]" : "bg-[var(--text-muted)]"
                        }`} />
                        <span className="text-xs text-[var(--text-secondary)] truncate max-w-[250px]">{topRec.message}</span>
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

function scoreColor(score: number) {
  if (score >= 70) return "text-[var(--green)]";
  if (score >= 40) return "text-[var(--yellow)]";
  return "text-[var(--red)]";
}

function MiniScore({ label, value }: { label: string; value: number }) {
  return (
    <div className="card">
      <div className="card-body text-center py-3">
        <p className={`text-2xl font-semibold tabular-nums ${scoreColor(value)}`}>{value}</p>
        <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mt-0.5">{label}</p>
      </div>
    </div>
  );
}

function MiniStat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="card">
      <div className="card-body text-center py-3">
        <p className="text-2xl font-semibold tabular-nums" style={{ color }}>{value}</p>
        <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mt-0.5">{label}</p>
      </div>
    </div>
  );
}
