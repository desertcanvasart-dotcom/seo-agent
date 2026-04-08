import { getResearchJobs, getResearchGaps } from "@/lib/api";
import { startResearchAction } from "@/lib/actions";

export default async function SiteResearchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: siteId } = await params;
  const jobsData = await getResearchJobs(siteId).catch(() => null);
  const jobs = jobsData?.jobs || [];

  const completedJob = jobs.find((j: any) => j.status === "completed");
  let gaps = null;
  if (completedJob) {
    gaps = await getResearchGaps(siteId, completedJob.id).catch(() => null);
  }

  return (
    <div>
      {/* New research form */}
      <div className="card mb-6">
        <div className="card-body">
          <h2 className="text-sm font-semibold mb-3">New Research Job</h2>
          <form action={startResearchAction} className="space-y-3">
            <input type="hidden" name="siteId" value={siteId} />
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Competitor URLs (one per line)</label>
              <textarea name="competitorUrls" rows={3} placeholder={"https://competitor1.com\nhttps://competitor2.com"} required className="input font-mono text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Target Keyword (optional)</label>
              <input type="text" name="keyword" placeholder="e.g. your target keyword" className="input" />
            </div>
            <button className="btn btn-primary">Start Research</button>
          </form>
        </div>
      </div>

      {/* Past jobs */}
      {jobs.length > 0 && (
        <div className="card mb-6">
          <div className="card-body">
            <h2 className="text-sm font-semibold mb-3">Research History</h2>
            <div className="space-y-2">
              {jobs.map((j: any) => (
                <div key={j.id} className="flex items-center justify-between p-3 bg-[var(--bg)] rounded-lg">
                  <div>
                    <p className="text-sm font-medium">{j.keyword || "Competitor analysis"}</p>
                    <p className="text-xs text-[var(--text-muted)] font-mono">{(j.competitor_urls as string[])?.join(", ")}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`badge ${j.status === "completed" ? "badge-green" : j.status === "running" ? "badge-yellow" : j.status === "failed" ? "badge-red" : "badge-gray"}`}>{j.status}</span>
                    <span className="text-xs text-[var(--text-muted)]">{new Date(j.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Gaps */}
      {gaps && (
        <div className="card">
          <div className="card-body pb-0">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold">Content Gaps Found</h2>
              <div className="flex gap-3 text-xs">
                <span className="badge badge-red">{gaps.missing_topics} missing</span>
                <span className="badge badge-yellow">{gaps.weak_topics} weak</span>
              </div>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Topic</th>
                <th style={{ textAlign: "right" }}>Competitors</th>
                <th style={{ textAlign: "center" }}>Coverage</th>
                <th style={{ textAlign: "right" }}>Score</th>
              </tr>
            </thead>
            <tbody>
              {(gaps.gaps as any[]).slice(0, 25).map((g: any, i: number) => (
                <tr key={i}>
                  <td><p className="text-sm font-medium">{g.topic}</p></td>
                  <td style={{ textAlign: "right" }}><span className="font-mono text-sm">{g.competitor_coverage}</span></td>
                  <td style={{ textAlign: "center" }}>{g.our_coverage ? <span className="badge badge-green">Covered</span> : <span className="badge badge-red">Missing</span>}</td>
                  <td style={{ textAlign: "right" }}><span className={`font-mono font-medium ${g.opportunity_score >= 60 ? "text-[var(--red)]" : g.opportunity_score >= 40 ? "text-[var(--yellow)]" : "text-[var(--text-muted)]"}`}>{g.opportunity_score}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
