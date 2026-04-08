import { getSuggestions } from "@/lib/api";
import { approveAction, rejectAction } from "@/lib/actions";

export default async function SiteLinksPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: siteId } = await params;
  const data = await getSuggestions(siteId).catch(() => null);

  if (!data || !data.suggestions?.length) {
    return (
      <div className="card"><div className="card-body text-center py-12 text-[var(--text-muted)] text-sm">
        No pending suggestions. Run link analysis from the Overview page.
      </div></div>
    );
  }

  return (
    <div>
      <p className="text-sm text-[var(--text-secondary)] mb-4">{data.total} pending review</p>
      <div className="space-y-3">
        {data.suggestions.map((s: any) => (
          <div key={s.id} className="card">
            <div className="card-body">
              <div className="flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">From</p>
                      <p className="text-sm font-medium truncate">{s.source_page?.title}</p>
                      <p className="text-xs text-[var(--text-muted)] font-mono">{s.source_page?.path}</p>
                    </div>
                    <svg className="w-5 h-5 text-[var(--text-muted)] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                    </svg>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">Link to</p>
                      <p className="text-sm font-medium truncate">{s.target_page?.title}</p>
                      <p className="text-xs text-[var(--text-muted)] font-mono">{s.target_page?.path}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 mt-3">
                    <span className="text-xs"><span className="text-[var(--text-muted)]">Anchor: </span><span className="font-mono text-[var(--accent)]">&quot;{s.anchor_text}&quot;</span></span>
                    <span className="text-xs"><span className="text-[var(--text-muted)]">Match: </span><span className="font-mono">{(s.similarity_score * 100).toFixed(0)}%</span></span>
                    <span className={`badge ${s.confidence === "high" ? "badge-green" : s.confidence === "medium" ? "badge-yellow" : "badge-gray"}`}>{s.confidence}</span>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <form action={approveAction}>
                    <input type="hidden" name="siteId" value={siteId} />
                    <input type="hidden" name="suggestionId" value={s.id} />
                    <button className="btn btn-success btn-sm">Approve</button>
                  </form>
                  <form action={rejectAction}>
                    <input type="hidden" name="siteId" value={siteId} />
                    <input type="hidden" name="suggestionId" value={s.id} />
                    <button className="btn btn-outline btn-sm">Reject</button>
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
