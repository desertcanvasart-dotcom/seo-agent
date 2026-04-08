import { getResearchJobs, getResearchGaps } from "@/lib/api";
import { startResearchAction } from "@/lib/actions";

const SITE_ID = process.env.NEXT_PUBLIC_SITE_ID || "";

export default async function ResearchPage() {
  const jobsData = await getResearchJobs(SITE_ID).catch(() => null);
  const jobs = jobsData?.jobs || [];

  const completedJob = jobs.find((j: any) => j.status === "completed");
  let gaps = null;
  if (completedJob) {
    gaps = await getResearchGaps(SITE_ID, completedJob.id).catch(() => null);
  }

  return (
    <div>
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Research</h1>
          <p className="text-sm text-[#888] mt-1">Competitor analysis and content gaps</p>
        </div>
      </div>

      {/* New research form */}
      <div className="border rounded-lg p-5 mb-8">
        <h2 className="text-xs font-medium uppercase tracking-wider text-[#888] mb-3">New Research</h2>
        <form action={startResearchAction} className="space-y-3">
          <input type="hidden" name="siteId" value={SITE_ID} />
          <div>
            <label className="block text-sm mb-1">Competitor URLs <span className="text-[#aaa]">(one per line)</span></label>
            <textarea
              name="competitorUrls"
              rows={3}
              placeholder={"https://competitor1.com\nhttps://competitor2.com"}
              required
              className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:border-[#111] font-mono"
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Keyword <span className="text-[#aaa]">(optional)</span></label>
            <input
              type="text"
              name="keyword"
              placeholder="e.g. your target keyword"
              className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:border-[#111]"
            />
          </div>
          <button className="px-4 py-2 bg-[#111] text-white text-sm rounded-lg hover:bg-[#333] transition-colors">
            Start Research
          </button>
        </form>
      </div>

      {/* Jobs */}
      {jobs.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xs font-medium uppercase tracking-wider text-[#888] mb-3">Research Jobs</h2>
          <div className="space-y-2">
            {jobs.map((j: any) => (
              <div key={j.id} className="border rounded-lg p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{j.keyword || "Competitor analysis"}</p>
                  <p className="text-xs text-[#aaa] font-mono mt-0.5">
                    {(j.competitor_urls as string[])?.join(" , ")}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`inline-flex items-center gap-1.5 text-xs ${
                    j.status === "completed" ? "text-[#22c55e]" :
                    j.status === "running" ? "text-[#3b82f6]" :
                    j.status === "failed" ? "text-[#ef4444]" : "text-[#888]"
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      j.status === "completed" ? "bg-[#22c55e]" :
                      j.status === "running" ? "bg-[#3b82f6]" :
                      j.status === "failed" ? "bg-[#ef4444]" : "bg-[#d4d4d4]"
                    }`} />
                    {j.status}
                  </span>
                  <span className="text-xs text-[#aaa]">{new Date(j.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Gaps table */}
      {gaps && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-medium uppercase tracking-wider text-[#888]">Content Gaps</h2>
            <div className="flex gap-4 text-xs">
              <span><span className="font-medium text-[#ef4444]">{gaps.missing_topics}</span> <span className="text-[#888]">missing</span></span>
              <span><span className="font-medium text-[#eab308]">{gaps.weak_topics}</span> <span className="text-[#888]">weak</span></span>
              <span><span className="font-medium">{gaps.total_gaps}</span> <span className="text-[#888]">total</span></span>
            </div>
          </div>

          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-[#fafafa]">
                  <th className="text-left p-3 text-[#888]">Topic</th>
                  <th className="text-right p-3 text-[#888] w-28">Competitors</th>
                  <th className="text-center p-3 text-[#888] w-28">We Cover?</th>
                  <th className="text-right p-3 text-[#888] w-24">Score</th>
                </tr>
              </thead>
              <tbody>
                {(gaps.gaps as any[]).slice(0, 30).map((g: any, i: number) => (
                  <tr key={i} className="border-b last:border-0 hover:bg-[#fafafa]">
                    <td className="p-3">
                      <p className="font-medium">{g.topic}</p>
                      <p className="text-xs text-[#aaa] font-mono truncate max-w-md mt-0.5">
                        {(g.competitor_urls as string[])?.slice(0, 2).map((u: string) => {
                          try { return new URL(u).hostname; } catch { return u; }
                        }).join(", ")}
                      </p>
                    </td>
                    <td className="p-3 text-right tabular-nums">
                      {g.competitor_coverage} <span className="text-[#aaa]">pages</span>
                    </td>
                    <td className="p-3 text-center">
                      {g.our_coverage ? (
                        <span className="text-[#22c55e]">Yes</span>
                      ) : (
                        <span className="text-[#ef4444] font-medium">Missing</span>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      <span className={`tabular-nums font-medium ${
                        g.opportunity_score >= 60 ? "text-[#ef4444]" :
                        g.opportunity_score >= 40 ? "text-[#eab308]" : "text-[#888]"
                      }`}>
                        {g.opportunity_score}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!gaps && jobs.length === 0 && (
        <p className="text-sm text-[#888]">Start a research job above to analyze competitors.</p>
      )}
    </div>
  );
}
