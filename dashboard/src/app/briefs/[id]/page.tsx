import { getBrief } from "@/lib/api";
import { generateDraftAction } from "@/lib/actions";
import Link from "next/link";

const SITE_ID = process.env.NEXT_PUBLIC_SITE_ID || "";

export default async function BriefDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getBrief(SITE_ID, id).catch(() => null);

  if (!data) return <div className="text-[var(--text-muted)]">Brief not found.</div>;

  const brief = data.brief;
  const outline = (brief.outline || []) as { heading: string; talking_points: string[]; target_word_count: number }[];
  const questions = (brief.questions_to_answer || []) as string[];
  const internalLinks = (brief.internal_links || []) as { anchor_text: string; target_url: string; target_path: string }[];
  const geoHints = (brief.geo_hints || {}) as Record<string, any>;

  return (
    <div>
      <Link href="/briefs" className="btn btn-ghost btn-sm mb-4">&larr; All Briefs</Link>

      <div className="mb-6">
        <h1 className="text-xl font-semibold">{brief.title_suggestion}</h1>
        <div className="flex items-center gap-3 mt-2">
          <span className="font-mono text-sm text-[var(--accent)]">{brief.target_keyword}</span>
          <span className="badge badge-gray">{brief.recommended_schema}</span>
          <span className="text-xs text-[var(--text-muted)]">{brief.recommended_word_count} words target</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main */}
        <div className="lg:col-span-2 space-y-6">
          {/* Outline */}
          <div className="card">
            <div className="card-body">
              <h2 className="text-sm font-semibold mb-4">Article Outline</h2>
              <div className="space-y-5">
                {outline.map((section, i) => (
                  <div key={i} className="border-l-2 border-[var(--accent)] pl-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium">{section.heading}</h3>
                      <span className="text-[10px] text-[var(--text-muted)]">~{section.target_word_count} words</span>
                    </div>
                    <ul className="mt-2 space-y-1">
                      {section.talking_points.map((point, j) => (
                        <li key={j} className="text-xs text-[var(--text-secondary)] flex items-start gap-2">
                          <span className="text-[var(--text-muted)] mt-0.5">-</span>
                          {point}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Questions */}
          <div className="card">
            <div className="card-body">
              <h2 className="text-sm font-semibold mb-3">Questions to Answer</h2>
              <ol className="space-y-2">
                {questions.map((q, i) => (
                  <li key={i} className="text-sm text-[var(--text-secondary)] flex gap-3">
                    <span className="text-xs text-[var(--text-muted)] tabular-nums mt-0.5 shrink-0">{i + 1}.</span>
                    {q}
                  </li>
                ))}
              </ol>
            </div>
          </div>

          {/* AI Draft */}
          {brief.ai_draft && (
            <div className="card">
              <div className="card-body">
                <h2 className="text-sm font-semibold mb-3">AI Draft</h2>
                <div className="text-sm text-[var(--text-secondary)] leading-relaxed whitespace-pre-wrap">{brief.ai_draft}</div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Generate draft button */}
          {brief.draft_status === "none" && (
            <div className="card">
              <div className="card-body">
                <form action={generateDraftAction}>
                  <input type="hidden" name="siteId" value={SITE_ID} />
                  <input type="hidden" name="briefId" value={brief.id} />
                  <button className="btn btn-primary w-full">Generate AI Draft</button>
                </form>
                <p className="text-[10px] text-[var(--text-muted)] mt-2 text-center">Uses Claude API. Requires ANTHROPIC_API_KEY.</p>
              </div>
            </div>
          )}
          {brief.draft_status === "generating" && (
            <div className="card">
              <div className="card-body text-center">
                <span className="badge badge-yellow">Generating draft...</span>
              </div>
            </div>
          )}
          {brief.draft_status === "ready" && (
            <div className="card">
              <div className="card-body text-center">
                <span className="badge badge-green">Draft ready</span>
              </div>
            </div>
          )}

          {/* Internal links */}
          <div className="card">
            <div className="card-body">
              <h2 className="text-sm font-semibold mb-3">Internal Links to Include</h2>
              {internalLinks.length === 0 ? (
                <p className="text-xs text-[var(--text-muted)]">No suggestions</p>
              ) : (
                <ul className="space-y-3">
                  {internalLinks.map((link, i) => (
                    <li key={i}>
                      <p className="text-xs font-mono text-[var(--accent)]">{link.anchor_text}</p>
                      <p className="text-[10px] text-[var(--text-muted)]">{link.target_path}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* GEO */}
          <div className="card" style={{ borderColor: "var(--purple)", borderWidth: "1px" }}>
            <div className="card-body">
              <h2 className="text-sm font-semibold text-[var(--purple)] mb-3">GEO Optimization</h2>
              <ul className="space-y-2 text-xs text-[var(--text-secondary)]">
                <li>Target <strong>{geoHints.citable_block_targets}</strong> citable blocks</li>
                {geoHints.faq_section && <li>Include FAQ section</li>}
                {geoHints.fact_density && <li className="text-[10px] text-[var(--text-muted)]">{geoHints.fact_density}</li>}
              </ul>
            </div>
          </div>

          {/* Info */}
          <div className="card">
            <div className="card-body">
              <h2 className="text-sm font-semibold mb-3">Info</h2>
              <dl className="text-xs space-y-2">
                <div className="flex justify-between"><dt className="text-[var(--text-muted)]">Status</dt><dd>{brief.status}</dd></div>
                <div className="flex justify-between"><dt className="text-[var(--text-muted)]">Created</dt><dd>{new Date(brief.created_at).toLocaleDateString()}</dd></div>
              </dl>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
