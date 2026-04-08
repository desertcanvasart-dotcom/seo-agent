import { getSuggestions } from "@/lib/api";
import { approveAction, rejectAction } from "@/lib/actions";

export default async function SiteLinksPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: siteId } = await params;
  const data = await getSuggestions(siteId).catch(() => null);

  if (!data || !data.suggestions?.length) {
    return (
      <div className="bg-white border border-[#e8e5e0] rounded-2xl"><div className="p-6 text-center py-12 text-[#8c8c8c] text-sm">
        No pending suggestions. Run link analysis from the Overview page.
      </div></div>
    );
  }

  return (
    <div>
      <p className="text-sm text-[#5c5c5c] mb-4">{data.total} pending review</p>
      <div className="space-y-3">
        {data.suggestions.map((s: any) => (
          <div key={s.id} className="bg-white border border-[#e8e5e0] rounded-2xl">
            <div className="p-6">
              <div className="flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] uppercase tracking-wider text-[#8c8c8c]">From</p>
                      <p className="text-sm font-medium truncate">{s.source_page?.title}</p>
                      <p className="text-xs text-[#8c8c8c] font-mono">{s.source_page?.path}</p>
                    </div>
                    <svg className="w-5 h-5 text-[#8c8c8c] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                    </svg>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] uppercase tracking-wider text-[#8c8c8c]">Link to</p>
                      <p className="text-sm font-medium truncate">{s.target_page?.title}</p>
                      <p className="text-xs text-[#8c8c8c] font-mono">{s.target_page?.path}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 mt-3">
                    <span className="text-xs"><span className="text-[#8c8c8c]">Anchor: </span><span className="font-mono text-[#2d5a3d]">&quot;{s.anchor_text}&quot;</span></span>
                    <span className="text-xs"><span className="text-[#8c8c8c]">Match: </span><span className="font-mono">{(s.similarity_score * 100).toFixed(0)}%</span></span>
                    <span className={s.confidence === "high" ? "bg-[#e8f0e8] text-[#2d5a3d] text-[11px] px-2.5 py-0.5 rounded-full font-medium" : s.confidence === "medium" ? "bg-[#fef7e0] text-[#f9ab00] text-[11px] px-2.5 py-0.5 rounded-full font-medium" : "bg-[#f1f3f4] text-[#5c5c5c] text-[11px] px-2.5 py-0.5 rounded-full font-medium"}>{s.confidence}</span>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <form action={approveAction}>
                    <input type="hidden" name="siteId" value={siteId} />
                    <input type="hidden" name="suggestionId" value={s.id} />
                    <button className="bg-[#2d5a3d] text-white px-3 py-1.5 rounded-lg text-xs">Approve</button>
                  </form>
                  <form action={rejectAction}>
                    <input type="hidden" name="siteId" value={siteId} />
                    <input type="hidden" name="suggestionId" value={s.id} />
                    <button className="border border-[#e8e5e0] text-[#5c5c5c] px-3 py-1.5 rounded-lg text-xs hover:bg-[#f5f3f0]">Reject</button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
