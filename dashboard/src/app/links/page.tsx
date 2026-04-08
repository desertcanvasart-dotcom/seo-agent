import { getSuggestions } from "@/lib/api";
import { approveAction, rejectAction } from "@/lib/actions";

const SITE_ID = process.env.NEXT_PUBLIC_SITE_ID || "";

export default async function LinksPage() {
  const data = await getSuggestions(SITE_ID).catch(() => null);

  if (!data || !data.suggestions?.length) {
    return (
      <div>
        <h1 className="text-2xl font-semibold tracking-tight mb-2">Link Suggestions</h1>
        <p className="text-[#888]">No pending suggestions.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Link Suggestions</h1>
        <p className="text-sm text-[#888] mt-1">{data.total} pending &middot; Sorted by relevance</p>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-[#fafafa]">
              <th className="text-left p-3 text-[#888]">From</th>
              <th className="text-left p-3 text-[#888]">Link to</th>
              <th className="text-left p-3 text-[#888]">Anchor Text</th>
              <th className="text-right p-3 text-[#888] w-24">Similarity</th>
              <th className="text-center p-3 text-[#888] w-24">Confidence</th>
              <th className="text-center p-3 text-[#888] w-36">Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.suggestions.map((s: any) => (
              <tr key={s.id} className="border-b last:border-0 hover:bg-[#fafafa]">
                <td className="p-3">
                  <p className="font-medium truncate max-w-[200px]">{s.source_page?.title?.replace(/ - Travel2Egypt$/i, "")}</p>
                  <p className="text-xs text-[#aaa] font-mono">{s.source_page?.path}</p>
                </td>
                <td className="p-3">
                  <p className="font-medium truncate max-w-[200px]">{s.target_page?.title?.replace(/ - Travel2Egypt$/i, "")}</p>
                  <p className="text-xs text-[#aaa] font-mono">{s.target_page?.path}</p>
                </td>
                <td className="p-3">
                  <span className="font-mono text-[#22c55e] text-xs">{s.anchor_text}</span>
                </td>
                <td className="p-3 text-right tabular-nums">
                  {(s.similarity_score * 100).toFixed(1)}%
                </td>
                <td className="p-3 text-center">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    s.confidence === "high" ? "bg-[#f0fdf4] text-[#22c55e]" :
                    s.confidence === "medium" ? "bg-[#fefce8] text-[#eab308]" :
                    "bg-[#f5f5f5] text-[#888]"
                  }`}>
                    {s.confidence}
                  </span>
                </td>
                <td className="p-3 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <form action={approveAction}>
                      <input type="hidden" name="siteId" value={SITE_ID} />
                      <input type="hidden" name="suggestionId" value={s.id} />
                      <button className="px-3 py-1 text-xs rounded border border-[#22c55e] text-[#22c55e] hover:bg-[#f0fdf4] transition-colors">
                        Approve
                      </button>
                    </form>
                    <form action={rejectAction}>
                      <input type="hidden" name="siteId" value={SITE_ID} />
                      <input type="hidden" name="suggestionId" value={s.id} />
                      <button className="px-3 py-1 text-xs rounded border border-[#e5e5e5] text-[#888] hover:bg-[#f5f5f5] transition-colors">
                        Reject
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
