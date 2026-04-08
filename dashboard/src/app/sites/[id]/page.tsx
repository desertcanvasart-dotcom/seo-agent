import { getSite, getCrawlStatus, getAudit, getSuggestions, getBriefs } from "@/lib/api";
import { runAuditAction, runEmbedAction, deleteSiteAction } from "@/lib/actions";
import Link from "next/link";

export default async function SiteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: siteId } = await params;

  const [siteData, crawlData, auditData, suggestionsData, briefsData] = await Promise.all([
    getSite(siteId).catch(() => null),
    getCrawlStatus(siteId).catch(() => null),
    getAudit(siteId).catch(() => null),
    getSuggestions(siteId).catch(() => null),
    getBriefs(siteId).catch(() => null),
  ]);

  if (!siteData) return <div className="text-[var(--text-muted)]">Site not found.</div>;

  const site = siteData.site;
  const crawl = crawlData;
  const audit = auditData?.summary;
  const hasAudit = audit?.pages_audited > 0;
  const suggestions = suggestionsData?.total || 0;
  const briefs = briefsData?.briefs?.length || 0;

  const crawlDone = crawl?.crawl_status === "completed";
  const crawling = crawl?.crawl_status === "crawling";

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/" className="btn btn-ghost btn-sm">&larr;</Link>
          <div>
            <h1 className="text-xl font-semibold">{site.domain}</h1>
            <p className="text-sm text-[var(--text-secondary)]">{crawl?.pages_crawled || 0} pages crawled</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={crawl?.crawl_status || "pending"} />
          <form action={deleteSiteAction}>
            <input type="hidden" name="siteId" value={siteId} />
            <button className="btn btn-outline btn-sm text-[var(--red)] border-[var(--red)] hover:bg-[var(--red-light)]">
              Delete
            </button>
          </form>
        </div>
      </div>

      {/* Pipeline */}
      <div className="card mb-6">
        <div className="card-body">
          <h2 className="text-sm font-semibold mb-4">Analysis Pipeline</h2>
          <div className="space-y-4">
            {/* Crawl */}
            <PipelineStep
              step={1}
              title="Crawl Pages"
              description={crawlDone ? `${crawl.pages_crawled} pages discovered and parsed` : crawling ? `Crawling... ${crawl?.pages_crawled || 0} pages so far` : "Waiting to start"}
              status={crawlDone ? "done" : crawling ? "running" : "pending"}
            />

            {/* Audit */}
            <PipelineStep
              step={2}
              title="SEO & GEO Audit"
              description={hasAudit ? `${audit.pages_audited} pages scored — SEO: ${audit.avg_seo_score}/100, GEO: ${audit.avg_geo_score}/100` : "Score every page for SEO and AI readiness"}
              status={hasAudit ? "done" : "pending"}
              action={crawlDone && !hasAudit ? (
                <form action={runAuditAction}>
                  <input type="hidden" name="siteId" value={siteId} />
                  <button className="btn btn-primary btn-sm">Run Audit</button>
                </form>
              ) : undefined}
            />

            {/* Links */}
            <PipelineStep
              step={3}
              title="Internal Link Analysis"
              description={suggestions > 0 ? `${suggestions} link suggestions found` : "Find missing internal links using AI embeddings"}
              status={suggestions > 0 ? "done" : "pending"}
              action={hasAudit && suggestions === 0 ? (
                <form action={runEmbedAction}>
                  <input type="hidden" name="siteId" value={siteId} />
                  <button className="btn btn-primary btn-sm">Analyze Links</button>
                </form>
              ) : undefined}
            />
          </div>
        </div>
      </div>

      {/* Score cards (only if audited) */}
      {hasAudit && (
        <div className="grid grid-cols-4 gap-4 mb-6">
          <ScoreCard label="SEO Score" value={audit.avg_seo_score} />
          <ScoreCard label="GEO Score" value={audit.avg_geo_score} />
          <ScoreCard label="Critical Issues" value={audit.critical_issues} type="issues" />
          <ScoreCard label="Content Briefs" value={briefs} type="neutral" />
        </div>
      )}

      {/* Quick actions */}
      {hasAudit && (
        <div className="grid grid-cols-3 gap-4">
          <Link href="/audit" className="card hover:shadow-md transition-shadow">
            <div className="card-body flex items-center gap-3">
              <div className="w-10 h-10 bg-[var(--green-light)] rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-[var(--green)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium">View Audit</p>
                <p className="text-xs text-[var(--text-muted)]">{audit.pages_audited} pages scored</p>
              </div>
            </div>
          </Link>
          <Link href="/links" className="card hover:shadow-md transition-shadow">
            <div className="card-body flex items-center gap-3">
              <div className="w-10 h-10 bg-[var(--accent-light)] rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-[var(--accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium">Link Suggestions</p>
                <p className="text-xs text-[var(--text-muted)]">{suggestions} pending</p>
              </div>
            </div>
          </Link>
          <Link href="/research" className="card hover:shadow-md transition-shadow">
            <div className="card-body flex items-center gap-3">
              <div className="w-10 h-10 bg-[var(--purple-light)] rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-[var(--purple)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium">Research</p>
                <p className="text-xs text-[var(--text-muted)]">Competitor analysis</p>
              </div>
            </div>
          </Link>
        </div>
      )}

      {crawling && (
        <p className="text-xs text-[var(--text-muted)] mt-4 text-center">Refresh this page to check progress</p>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === "completed") return <span className="badge badge-green">Completed</span>;
  if (status === "crawling") return <span className="badge badge-yellow">Crawling...</span>;
  if (status === "failed") return <span className="badge badge-red">Failed</span>;
  return <span className="badge badge-gray">Pending</span>;
}

function PipelineStep({ step, title, description, status, action }: {
  step: number; title: string; description: string; status: "done" | "running" | "pending"; action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-4">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
        status === "done" ? "bg-[var(--green)] text-white" :
        status === "running" ? "bg-[var(--yellow)] text-white" :
        "bg-[#f1f3f4] text-[var(--text-muted)]"
      }`}>
        {status === "done" ? (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        ) : status === "running" ? (
          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : step}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-[var(--text-muted)]">{description}</p>
      </div>
      {action}
    </div>
  );
}

function ScoreCard({ label, value, type = "score" }: { label: string; value: number; type?: "score" | "issues" | "neutral" }) {
  const color = type === "issues"
    ? (value > 0 ? "text-[var(--red)]" : "text-[var(--green)]")
    : type === "neutral"
      ? "text-[var(--text)]"
      : (value >= 70 ? "text-[var(--green)]" : value >= 40 ? "text-[var(--yellow)]" : "text-[var(--red)]");

  return (
    <div className="card">
      <div className="card-body text-center">
        <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-1">{label}</p>
        <p className={`text-3xl font-semibold tabular-nums ${color}`}>{value}</p>
      </div>
    </div>
  );
}
