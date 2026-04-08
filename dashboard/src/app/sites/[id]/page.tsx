import { getSite, getCrawlStatus, getAudit, getSuggestions, getBriefs } from "@/lib/api";
import SiteLiveView from "./live";

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

  return (
    <SiteLiveView
      siteId={siteId}
      initialSite={siteData.site}
      initialCrawl={crawlData}
      initialAudit={auditData?.summary || null}
      initialSuggestions={suggestionsData?.total || 0}
      initialBriefs={briefsData?.briefs?.length || 0}
    />
  );
}
