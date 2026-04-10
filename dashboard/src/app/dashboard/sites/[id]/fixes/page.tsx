import { getFixes, getCrawlStatus } from "@/lib/api";
import { runGeneratorsAction, approveFixAction, dismissFixAction } from "@/lib/actions";

const TYPE_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  schema: { label: "Schema", color: "#1a3a2a", bg: "#e8f0e8" },
  content_rewrite: { label: "Content", color: "#9334e8", bg: "#f3e8fd" },
  llms_txt: { label: "llms.txt", color: "#1a73e8", bg: "#e8f0fe" },
  robots_txt: { label: "Robots.txt", color: "#ea4335", bg: "#fce8e6" },
  meta_title: { label: "Meta/Title", color: "#f9ab00", bg: "#fef7e0" },
};

export default async function FixesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: siteId } = await params;
  const [fixesData, crawlData] = await Promise.all([
    getFixes(siteId).catch(() => null),
    getCrawlStatus(siteId).catch(() => null),
  ]);

  const summary = fixesData?.summary || { total: 0, pending: 0, approved: 0, dismissed: 0 };
  const fixes = fixesData?.fixes || [];
  const crawlDone = crawlData?.crawl_status === "completed";

  // Empty state
  if (summary.total === 0) {
    return (
      <div>
        <div className="bg-white border border-[#e8e5e0] rounded-2xl p-10 text-center">
          <div className="w-14 h-14 bg-[#e8f0e8] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-[#1a3a2a]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17l-5.384-3.19A1 1 0 005 12.93V19a1 1 0 001.555.832l5.384-3.19a1 1 0 000-1.664zM16.5 3.75V16.5L12 14.25 16.5 3.75z" />
            </svg>
          </div>
          {crawlDone ? (
            <>
              <h2 className="text-[16px] font-bold text-[#1a1a1a] mb-1">No fixes generated yet</h2>
              <p className="text-[13px] text-[#6b6b6b] mb-5">Run the fix generator to create ready-to-use code for your site&apos;s issues.</p>
              <form action={runGeneratorsAction}>
                <input type="hidden" name="siteId" value={siteId} />
                <button className="bg-[#1a3a2a] text-white px-5 py-2.5 rounded-lg text-[13px] font-semibold hover:bg-[#143020] transition-colors">
                  Generate Fixes
                </button>
              </form>
            </>
          ) : (
            <>
              <h2 className="text-[16px] font-bold text-[#1a1a1a] mb-1">Waiting for analysis</h2>
              <p className="text-[13px] text-[#6b6b6b]">Fixes will be generated after the crawl and audit complete.</p>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Summary */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex gap-3 text-[12px]">
          <span className="px-2.5 py-1 rounded-full bg-[#fef7e0] text-[#b8860b] font-medium">{summary.pending} pending</span>
          <span className="px-2.5 py-1 rounded-full bg-[#e8f0e8] text-[#1a3a2a] font-medium">{summary.approved} approved</span>
          <span className="px-2.5 py-1 rounded-full bg-[#f1f3f4] text-[#6b6b6b] font-medium">{summary.dismissed} dismissed</span>
        </div>
        <form action={runGeneratorsAction} className="ml-auto">
          <input type="hidden" name="siteId" value={siteId} />
          <button className="text-[12px] text-[#1a3a2a] font-semibold hover:underline">Regenerate All</button>
        </form>
      </div>

      {/* Fix cards */}
      <div className="space-y-4">
        {fixes.map((fix: any) => {
          const typeInfo = TYPE_LABELS[fix.fix_type] || TYPE_LABELS.schema;
          const content = fix.generated_content || {};
          const isPending = fix.status === "pending";

          return (
            <div key={fix.id} className={`bg-white border rounded-2xl overflow-hidden ${isPending ? "border-[#e8e5e0]" : "border-[#f1f3f4] opacity-70"}`}>
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-[#f5f3f0]">
                <div className="flex items-center gap-3">
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full" style={{ background: typeInfo.bg, color: typeInfo.color }}>
                    {typeInfo.label}
                  </span>
                  {fix.page_url && <span className="text-[11px] text-[#8c8c8c] font-mono truncate max-w-[300px]">{fix.page_path || fix.page_url}</span>}
                  <span className={`text-[10px] font-medium ${fix.status === "approved" ? "text-[#1a3a2a]" : fix.status === "dismissed" ? "text-[#8c8c8c]" : "text-[#b8860b]"}`}>
                    {fix.status}
                  </span>
                </div>
                {isPending && (
                  <div className="flex gap-2">
                    <form action={approveFixAction}>
                      <input type="hidden" name="siteId" value={siteId} />
                      <input type="hidden" name="fixId" value={fix.id} />
                      <button className="bg-[#1a3a2a] text-white px-3 py-1.5 rounded-lg text-[11px] font-semibold hover:bg-[#143020]">Approve</button>
                    </form>
                    <form action={dismissFixAction}>
                      <input type="hidden" name="siteId" value={siteId} />
                      <input type="hidden" name="fixId" value={fix.id} />
                      <button className="border border-[#e8e5e0] text-[#6b6b6b] px-3 py-1.5 rounded-lg text-[11px] font-semibold hover:bg-[#f5f3f0]">Dismiss</button>
                    </form>
                  </div>
                )}
              </div>

              {/* Content — rendered differently per fix_type */}
              <div className="px-5 py-4">
                {fix.fix_type === "schema" && <SchemaFix content={content} />}
                {fix.fix_type === "robots_txt" && <RobotsFix content={content} />}
                {fix.fix_type === "llms_txt" && <LlmsTxtFix content={content} />}
                {fix.fix_type === "meta_title" && <MetaTitleFix content={content} />}
                {fix.fix_type === "content_rewrite" && <ContentRewriteFix content={content} />}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Fix type renderers ──────────────────────────────────────────

function SchemaFix({ content }: { content: any }) {
  const schemas = content.schemas || [];
  return (
    <div className="space-y-3">
      {schemas.map((s: any, i: number) => (
        <div key={i}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[12px] font-semibold text-[#1a1a1a]">{s.schema_type}</span>
            <span className="text-[10px] text-[#8c8c8c]">{s.placement} · {s.priority}</span>
          </div>
          <p className="text-[11px] text-[#6b6b6b] mb-2 italic">{s.rationale}</p>
          <pre className="bg-[#0f1a14] text-[#a0d0b0] text-[11px] p-3 rounded-xl overflow-x-auto font-mono leading-relaxed max-h-[200px] overflow-y-auto">
            {s.json_ld}
          </pre>
        </div>
      ))}
    </div>
  );
}

function RobotsFix({ content }: { content: any }) {
  return (
    <div>
      {content.explanation && <p className="text-[12px] text-[#6b6b6b] mb-3">{content.explanation}</p>}
      {content.blocked_bots?.length > 0 && (
        <p className="text-[11px] text-[#ea4335] mb-2">Blocked bots: {content.blocked_bots.join(", ")}</p>
      )}
      <pre className="bg-[#0f1a14] text-[#a0d0b0] text-[11px] p-3 rounded-xl overflow-x-auto font-mono leading-relaxed">
        {content.fixed_robots_txt || content.lines_to_add}
      </pre>
    </div>
  );
}

function LlmsTxtFix({ content }: { content: any }) {
  return (
    <div>
      <div className="flex items-center gap-4 mb-3 text-[11px] text-[#6b6b6b]">
        {content.section_count && <span>{content.section_count} sections</span>}
        {content.word_count && <span>{content.word_count} words</span>}
      </div>
      <p className="text-[11px] text-[#8c8c8c] mb-2">Deploy this file at <code className="bg-[#f5f3f0] px-1 rounded">/llms.txt</code> on your website root.</p>
      <pre className="bg-[#0f1a14] text-[#a0d0b0] text-[11px] p-3 rounded-xl overflow-x-auto font-mono leading-relaxed max-h-[300px] overflow-y-auto">
        {content.content}
      </pre>
    </div>
  );
}

function MetaTitleFix({ content }: { content: any }) {
  return (
    <div className="space-y-3">
      {content.title_issue && (
        <div>
          <p className="text-[10px] text-[#8c8c8c] uppercase tracking-wider mb-1">Title Issue</p>
          <p className="text-[12px] text-[#ea4335]">{content.title_issue}</p>
          <div className="mt-2 flex gap-3">
            <div className="flex-1">
              <p className="text-[10px] text-[#8c8c8c] mb-1">Suggested</p>
              <div className="px-3 py-2 bg-[#e8f0e8] border border-[#c8e0c8] rounded-lg text-[13px] text-[#1a3a2a] font-medium">{content.suggested_title}</div>
            </div>
          </div>
        </div>
      )}
      {content.meta_issue && (
        <div>
          <p className="text-[10px] text-[#8c8c8c] uppercase tracking-wider mb-1">Meta Description Issue</p>
          <p className="text-[12px] text-[#ea4335]">{content.meta_issue}</p>
          <div className="mt-2">
            <p className="text-[10px] text-[#8c8c8c] mb-1">Suggested</p>
            <div className="px-3 py-2 bg-[#e8f0e8] border border-[#c8e0c8] rounded-lg text-[13px] text-[#1a3a2a]">{content.suggested_meta}</div>
          </div>
        </div>
      )}
    </div>
  );
}

function ContentRewriteFix({ content }: { content: any }) {
  const rewrites = content.rewrites || [];
  const faqs = content.faq_additions || [];
  return (
    <div className="space-y-4">
      {rewrites.map((r: any, i: number) => (
        <div key={i}>
          <p className="text-[11px] text-[#6b6b6b] mb-2 italic">{r.improvement_reason}</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-[10px] text-[#ea4335] font-semibold mb-1">Before</p>
              <div className="text-[11px] text-[#4a4a4a] bg-[#fce8e6] p-3 rounded-lg leading-relaxed">{r.original_text?.slice(0, 300)}{r.original_text?.length > 300 ? "..." : ""}</div>
            </div>
            <div>
              <p className="text-[10px] text-[#1a3a2a] font-semibold mb-1">After</p>
              <div className="text-[11px] text-[#1a1a1a] bg-[#e8f0e8] p-3 rounded-lg leading-relaxed">{r.rewritten_text?.slice(0, 300)}{r.rewritten_text?.length > 300 ? "..." : ""}</div>
            </div>
          </div>
        </div>
      ))}
      {faqs.length > 0 && (
        <div>
          <p className="text-[10px] text-[#8c8c8c] uppercase tracking-wider mb-2">FAQ Additions</p>
          <div className="space-y-2">
            {faqs.map((faq: any, i: number) => (
              <div key={i} className="bg-[#fafaf8] border border-[#eeece8] rounded-lg p-3">
                <p className="text-[12px] font-semibold text-[#1a1a1a]">{faq.question}</p>
                <p className="text-[11px] text-[#6b6b6b] mt-1">{faq.answer?.slice(0, 200)}{faq.answer?.length > 200 ? "..." : ""}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
