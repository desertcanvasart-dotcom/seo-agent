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
      <div className="bg-white border border-[#e8e5e0] rounded-2xl mb-6">
        <div className="p-6">
          <h2 className="text-sm font-semibold mb-3">New Research Job</h2>
          <form action={startResearchAction} className="space-y-3">
            <input type="hidden" name="siteId" value={siteId} />
            <div>
              <label className="block text-xs font-medium text-[#5c5c5c] mb-1">Competitor URLs (one per line)</label>
              <textarea name="competitorUrls" rows={3} placeholder={"https://competitor1.com\nhttps://competitor2.com"} required className="w-full px-4 py-2.5 border border-[#e8e5e0] rounded-xl text-sm focus:outline-none focus:border-[#2d5a3d] font-mono" />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#5c5c5c] mb-1">Target Keyword (optional)</label>
              <input type="text" name="keyword" placeholder="e.g. your target keyword" className="w-full px-4 py-2.5 border border-[#e8e5e0] rounded-xl text-sm focus:outline-none focus:border-[#2d5a3d]" />
            </div>
            <button className="bg-[#2d5a3d] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#234a31]">Start Research</button>
          </form>
        </div>
      </div>

      {/* Past jobs */}
      {jobs.length > 0 && (
        <div className="bg-white border border-[#e8e5e0] rounded-2xl mb-6">
          <div className="p-6">
            <h2 className="text-sm font-semibold mb-3">Research History</h2>
            <div className="space-y-2">
              {jobs.map((j: any) => (
                <div key={j.id} className="flex items-center justify-between p-3 bg-[#fafaf8] rounded-lg">
                  <div>
                    <p className="text-sm font-medium">{j.keyword || "Competitor analysis"}</p>
                    <p className="text-xs text-[#8c8c8c] font-mono">{(j.competitor_urls as string[])?.join(", ")}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={j.status === "completed" ? "bg-[#e8f0e8] text-[#2d5a3d] text-[11px] px-2.5 py-0.5 rounded-full font-medium" : j.status === "running" ? "bg-[#fef7e0] text-[#f9ab00] text-[11px] px-2.5 py-0.5 rounded-full font-medium" : j.status === "failed" ? "bg-[#fce8e6] text-[#ea4335] text-[11px] px-2.5 py-0.5 rounded-full font-medium" : "bg-[#f1f3f4] text-[#5c5c5c] text-[11px] px-2.5 py-0.5 rounded-full font-medium"}>{j.status}</span>
                    <span className="text-xs text-[#8c8c8c]">{new Date(j.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Gaps */}
      {gaps && (
        <div className="bg-white border border-[#e8e5e0] rounded-2xl">
          <div className="p-6 pb-0">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold">Content Gaps Found</h2>
              <div className="flex gap-3 text-xs">
                <span className="bg-[#fce8e6] text-[#ea4335] text-[11px] px-2.5 py-0.5 rounded-full font-medium">{gaps.missing_topics} missing</span>
                <span className="bg-[#fef7e0] text-[#f9ab00] text-[11px] px-2.5 py-0.5 rounded-full font-medium">{gaps.weak_topics} weak</span>
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
                  <td style={{ textAlign: "center" }}>{g.our_coverage ? <span className="bg-[#e8f0e8] text-[#2d5a3d] text-[11px] px-2.5 py-0.5 rounded-full font-medium">Covered</span> : <span className="bg-[#fce8e6] text-[#ea4335] text-[11px] px-2.5 py-0.5 rounded-full font-medium">Missing</span>}</td>
                  <td style={{ textAlign: "right" }}><span className={`font-mono font-medium ${g.opportunity_score >= 60 ? "text-[#ea4335]" : g.opportunity_score >= 40 ? "text-[#f9ab00]" : "text-[#8c8c8c]"}`}>{g.opportunity_score}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
