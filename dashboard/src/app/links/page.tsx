import { getSuggestions } from "@/lib/api";
import { approveAction, rejectAction } from "@/lib/actions";

const SITE_ID = process.env.NEXT_PUBLIC_SITE_ID || "";

export default async function LinksPage() {
  const data = await getSuggestions(SITE_ID).catch(() => null);

  if (!data || !data.suggestions?.length) {
    return (
      <div>
        <h1 className="text-xl font-semibold mb-2">Link Suggestions</h1>
        <div className="card"><div className="card-body text-center py-12 text-[var(--text-muted)] text-sm">No pending suggestions. Run link analysis from a project page.</div></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold">Link Suggestions</h1>
          <p className="text-sm text-[var(--text-secondary)]">{data.total} pending review</p>
        </div>
      </div>

      <div className="space-y-3">
        {data.suggestions.map((s: any) => (
          <div key={s.id} className="card">
            <div className="card-body">
              <div className="flex items-start gap-4">
                {/* Link details */}
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
                    <span className="text-xs">
                      <span className="text-[var(--text-muted)]">Anchor: </span>
                      <span className="font-mono text-[var(--accent)]">&quot;{s.anchor_text}&quot;</span>
                    </span>
                    <span className="text-xs">
                      <span className="text-[var(--text-muted)]">Match: </span>
                      <span className="font-mono">{(s.similarity_score * 100).toFixed(0)}%</span>
                    </span>
                    <span className={`badge ${
                      s.confidence === "high" ? "badge-green" :
                      s.confidence === "medium" ? "badge-yellow" : "badge-gray"
                    }`}>
                      {s.confidence}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 shrink-0">
                  <form action={approveAction}>
                    <input type="hidden" name="siteId" value={SITE_ID} />
                    <input type="hidden" name="suggestionId" value={s.id} />
                    <button className="btn btn-success btn-sm">Approve</button>
                  </form>
                  <form action={rejectAction}>
                    <input type="hidden" name="siteId" value={SITE_ID} />
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
