import { getBrief } from "@/lib/api";
import Link from "next/link";

const SITE_ID = process.env.NEXT_PUBLIC_SITE_ID || "";

export default async function BriefDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getBrief(SITE_ID, id).catch(() => null);

  if (!data) {
    return <div className="text-[#888]">Brief not found.</div>;
  }

  const brief = data.brief;
  const outline = (brief.outline || []) as { heading: string; talking_points: string[]; target_word_count: number }[];
  const questions = (brief.questions_to_answer || []) as string[];
  const internalLinks = (brief.internal_links || []) as { anchor_text: string; target_url: string; target_path: string }[];
  const geoHints = (brief.geo_hints || {}) as Record<string, any>;

  return (
    <div>
      <Link href="/briefs" className="text-xs text-[#888] hover:text-[#111] mb-6 inline-block">&larr; Back to briefs</Link>

      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">{brief.title_suggestion}</h1>
        <p className="text-sm text-[#888] mt-1">
          <span className="font-mono text-[#22c55e]">{brief.target_keyword}</span>
          &nbsp;&middot;&nbsp; {brief.recommended_word_count} words
          &nbsp;&middot;&nbsp; {brief.recommended_schema}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main */}
        <div className="lg:col-span-2 space-y-6">
          {/* Outline */}
          <div className="border rounded-lg p-6">
            <h2 className="text-xs font-medium uppercase tracking-wider text-[#888] mb-4">Article Outline</h2>
            <div className="space-y-5">
              {outline.map((section, i) => (
                <div key={i} className="border-l-2 border-[#22c55e] pl-4">
                  <h3 className="font-medium">{section.heading}</h3>
                  <p className="text-xs text-[#aaa] mb-2">~{section.target_word_count} words</p>
                  <ul className="space-y-1">
                    {section.talking_points.map((point, j) => (
                      <li key={j} className="text-sm text-[#666] flex items-start gap-2">
                        <span className="text-[#d4d4d4] mt-1">-</span>
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* Questions */}
          <div className="border rounded-lg p-6">
            <h2 className="text-xs font-medium uppercase tracking-wider text-[#888] mb-4">Questions to Answer</h2>
            <ol className="space-y-2">
              {questions.map((q, i) => (
                <li key={i} className="text-sm text-[#444] flex items-start gap-3">
                  <span className="text-xs text-[#aaa] tabular-nums mt-0.5">{i + 1}.</span>
                  {q}
                </li>
              ))}
            </ol>
          </div>

          {/* AI Draft */}
          {brief.ai_draft && (
            <div className="border rounded-lg p-6">
              <h2 className="text-xs font-medium uppercase tracking-wider text-[#888] mb-4">AI Draft</h2>
              <div className="text-sm text-[#333] leading-relaxed whitespace-pre-wrap">
                {brief.ai_draft}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Internal links */}
          <div className="border rounded-lg p-5">
            <h2 className="text-xs font-medium uppercase tracking-wider text-[#888] mb-3">Internal Links</h2>
            {internalLinks.length === 0 ? (
              <p className="text-sm text-[#aaa]">No suggestions</p>
            ) : (
              <ul className="space-y-3">
                {internalLinks.map((link, i) => (
                  <li key={i}>
                    <p className="text-sm font-mono text-[#22c55e]">{link.anchor_text}</p>
                    <p className="text-xs text-[#aaa]">{link.target_path}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* GEO */}
          <div className="border border-[#22c55e]/20 bg-[#f0fdf4] rounded-lg p-5">
            <h2 className="text-xs font-medium uppercase tracking-wider text-[#22c55e] mb-3">GEO Optimization</h2>
            <ul className="space-y-2 text-sm text-[#444]">
              <li>Target <strong>{geoHints.citable_block_targets}</strong> citable blocks</li>
              {geoHints.faq_section && <li>Include FAQ section</li>}
              <li className="text-xs text-[#666]">{geoHints.fact_density}</li>
            </ul>
          </div>

          {/* Meta */}
          <div className="border rounded-lg p-5">
            <h2 className="text-xs font-medium uppercase tracking-wider text-[#888] mb-3">Info</h2>
            <dl className="text-sm space-y-2">
              <div className="flex justify-between">
                <dt className="text-[#888]">Status</dt>
                <dd>{brief.status}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[#888]">Draft</dt>
                <dd>{brief.draft_status === "none" ? "Not generated" : brief.draft_status}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[#888]">Created</dt>
                <dd>{new Date(brief.created_at).toLocaleDateString()}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
