import { getBrief } from "@/lib/api";
import { generateDraftAction } from "@/lib/actions";
import Link from "next/link";

export default async function SiteBriefDetailPage({ params }: { params: Promise<{ id: string; briefId: string }> }) {
  const { id: siteId, briefId } = await params;
  const data = await getBrief(siteId, briefId).catch(() => null);

  if (!data) return <div className="text-[#8c8c8c]">Brief not found.</div>;

  const brief = data.brief;
  const outline = (brief.outline || []) as { heading: string; talking_points: string[]; target_word_count: number }[];
  const questions = (brief.questions_to_answer || []) as string[];
  const internalLinks = (brief.internal_links || []) as { anchor_text: string; target_path: string }[];
  const geoHints = (brief.geo_hints || {}) as Record<string, any>;

  return (
    <div>
      <Link href={`/dashboard/sites/${siteId}/briefs`} className="text-[#5c5c5c] text-sm hover:underline mb-4 inline-block">&larr; All Briefs</Link>
      <div className="mb-6">
        <h1 className="text-xl font-semibold">{brief.title_suggestion}</h1>
        <div className="flex items-center gap-3 mt-2">
          <span className="font-mono text-sm text-[#2d5a3d]">{brief.target_keyword}</span>
          <span className="bg-[#f1f3f4] text-[#5c5c5c] text-[11px] px-2.5 py-0.5 rounded-full font-medium">{brief.recommended_schema}</span>
          <span className="text-xs text-[#8c8c8c]">{brief.recommended_word_count} words</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-[#e8e5e0] rounded-2xl"><div className="p-6">
            <h2 className="text-sm font-semibold mb-4">Article Outline</h2>
            <div className="space-y-5">
              {outline.map((s, i) => (
                <div key={i} className="border-l-2 border-[#2d5a3d] pl-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium">{s.heading}</h3>
                    <span className="text-[10px] text-[#8c8c8c]">~{s.target_word_count} words</span>
                  </div>
                  <ul className="mt-2 space-y-1">
                    {s.talking_points.map((p, j) => (
                      <li key={j} className="text-xs text-[#5c5c5c] flex items-start gap-2">
                        <span className="text-[#8c8c8c] mt-0.5">-</span>{p}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div></div>

          <div className="bg-white border border-[#e8e5e0] rounded-2xl"><div className="p-6">
            <h2 className="text-sm font-semibold mb-3">Questions to Answer</h2>
            <ol className="space-y-2">
              {questions.map((q, i) => (
                <li key={i} className="text-sm text-[#5c5c5c] flex gap-3">
                  <span className="text-xs text-[#8c8c8c] tabular-nums mt-0.5 shrink-0">{i + 1}.</span>{q}
                </li>
              ))}
            </ol>
          </div></div>

          {brief.ai_draft && (
            <div className="bg-white border border-[#e8e5e0] rounded-2xl"><div className="p-6">
              <h2 className="text-sm font-semibold mb-3">AI Draft</h2>
              <div className="text-sm text-[#5c5c5c] leading-relaxed whitespace-pre-wrap">{brief.ai_draft}</div>
            </div></div>
          )}
        </div>

        <div className="space-y-4">
          {brief.draft_status === "none" && (
            <div className="bg-white border border-[#e8e5e0] rounded-2xl"><div className="p-6">
              <form action={generateDraftAction}>
                <input type="hidden" name="siteId" value={siteId} />
                <input type="hidden" name="briefId" value={brief.id} />
                <button className="bg-[#2d5a3d] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#234a31] w-full">Generate AI Draft</button>
              </form>
              <p className="text-[10px] text-[#8c8c8c] mt-2 text-center">Requires ANTHROPIC_API_KEY</p>
            </div></div>
          )}

          <div className="bg-white border border-[#e8e5e0] rounded-2xl"><div className="p-6">
            <h2 className="text-sm font-semibold mb-3">Internal Links</h2>
            {internalLinks.length === 0 ? <p className="text-xs text-[#8c8c8c]">No suggestions</p> : (
              <ul className="space-y-3">
                {internalLinks.map((l, i) => (
                  <li key={i}>
                    <p className="text-xs font-mono text-[#2d5a3d]">{l.anchor_text}</p>
                    <p className="text-[10px] text-[#8c8c8c]">{l.target_path}</p>
                  </li>
                ))}
              </ul>
            )}
          </div></div>

          <div className="bg-white border border-[#e8e5e0] rounded-2xl" style={{ borderColor: "#9334e8" }}>
            <div className="p-6">
              <h2 className="text-sm font-semibold text-[#9334e8] mb-3">GEO Optimization</h2>
              <ul className="space-y-2 text-xs text-[#5c5c5c]">
                <li>Target <strong>{geoHints.citable_block_targets}</strong> citable blocks</li>
                {geoHints.faq_section && <li>Include FAQ section</li>}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
