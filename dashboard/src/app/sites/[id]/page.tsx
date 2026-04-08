import { getSite, getCrawlStatus, getAudit } from "@/lib/api";
import { runAuditAction, runEmbedAction, runLinkGenerationAction } from "@/lib/actions";
import Link from "next/link";

export default async function SiteStatusPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: siteId } = await params;

  const [siteData, crawlData, auditData] = await Promise.all([
    getSite(siteId).catch(() => null),
    getCrawlStatus(siteId).catch(() => null),
    getAudit(siteId).catch(() => null),
  ]);

  if (!siteData) {
    return <div className="text-[#888]">Site not found.</div>;
  }

  const site = siteData.site;
  const crawl = crawlData;
  const hasAudit = auditData?.summary?.pages_audited > 0;

  return (
    <div className="max-w-2xl mx-auto">
      <Link href="/" className="text-xs text-[#888] hover:text-[#111] mb-6 inline-block">&larr; All sites</Link>

      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">{site.domain}</h1>
        <p className="text-sm text-[#888] mt-1">{site.name}</p>
      </div>

      {/* Pipeline steps */}
      <div className="space-y-4">
        {/* Step 1: Crawl */}
        <div className="border rounded-lg p-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <StepIndicator status={crawl?.crawl_status === "completed" ? "done" : crawl?.crawl_status === "crawling" ? "running" : "pending"} />
                <h3 className="font-medium">Crawl Pages</h3>
              </div>
              <p className="text-xs text-[#888] mt-1 ml-6">
                {crawl?.crawl_status === "completed"
                  ? `${crawl.pages_crawled} pages crawled`
                  : crawl?.crawl_status === "crawling"
                    ? `Crawling... ${crawl.pages_crawled || 0} pages so far`
                    : "Waiting to start"}
              </p>
            </div>
            {crawl?.crawl_status === "crawling" && (
              <span className="text-xs text-[#888] animate-pulse">Running...</span>
            )}
          </div>
        </div>

        {/* Step 2: Audit */}
        <div className="border rounded-lg p-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <StepIndicator status={hasAudit ? "done" : "pending"} />
                <h3 className="font-medium">SEO &amp; GEO Audit</h3>
              </div>
              <p className="text-xs text-[#888] mt-1 ml-6">
                {hasAudit
                  ? `${auditData.summary.pages_audited} pages audited — SEO: ${auditData.summary.avg_seo_score}, GEO: ${auditData.summary.avg_geo_score}`
                  : "Run audit after crawl completes"}
              </p>
            </div>
            {crawl?.crawl_status === "completed" && !hasAudit && (
              <form action={runAuditAction}>
                <input type="hidden" name="siteId" value={siteId} />
                <button className="px-4 py-2 text-xs border rounded-lg hover:bg-[#f5f5f5] transition-colors">
                  Run Audit
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Step 3: Embed + Link Suggestions */}
        <div className="border rounded-lg p-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <StepIndicator status="pending" />
                <h3 className="font-medium">Internal Link Analysis</h3>
              </div>
              <p className="text-xs text-[#888] mt-1 ml-6">
                Generate embeddings and find linking opportunities
              </p>
            </div>
            {hasAudit && (
              <form action={runEmbedAction}>
                <input type="hidden" name="siteId" value={siteId} />
                <button className="px-4 py-2 text-xs border rounded-lg hover:bg-[#f5f5f5] transition-colors">
                  Run Analysis
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Quick links */}
      {hasAudit && (
        <div className="mt-8 flex gap-3">
          <Link href="/audit" className="flex-1 text-center py-3 border rounded-lg text-sm hover:border-[#22c55e] transition-colors">
            View Audit
          </Link>
          <Link href="/links" className="flex-1 text-center py-3 border rounded-lg text-sm hover:border-[#22c55e] transition-colors">
            View Links
          </Link>
          <Link href="/briefs" className="flex-1 text-center py-3 border rounded-lg text-sm hover:border-[#22c55e] transition-colors">
            View Briefs
          </Link>
        </div>
      )}

      <p className="text-xs text-[#aaa] mt-6 text-center">
        Refresh this page to see updated progress.
      </p>
    </div>
  );
}

function StepIndicator({ status }: { status: "done" | "running" | "pending" }) {
  if (status === "done") {
    return <span className="w-4 h-4 rounded-full bg-[#22c55e] flex items-center justify-center text-white text-[10px]">&#10003;</span>;
  }
  if (status === "running") {
    return <span className="w-4 h-4 rounded-full border-2 border-[#22c55e] border-t-transparent animate-spin" />;
  }
  return <span className="w-4 h-4 rounded-full border-2 border-[#d4d4d4]" />;
}
