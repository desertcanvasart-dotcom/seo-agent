import { getSite, getCrawlStatus, getAudit, getSuggestions, getBriefs } from "@/lib/api";
import SiteLive from "./live";

export default async function SiteOverviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: siteId } = await params;

  const [siteData, crawlData, auditData, suggestionsData, briefsData] = await Promise.all([
    getSite(siteId).catch(() => null),
    getCrawlStatus(siteId).catch(() => null),
    getAudit(siteId).catch(() => null),
    getSuggestions(siteId).catch(() => null),
    getBriefs(siteId).catch(() => null),
  ]);

  if (!siteData) return <p className="text-[#8c8c8c]">Site not found.</p>;

  return (
    <SiteLive
      siteId={siteId}
      initialSite={siteData.site}
      initialCrawl={crawlData}
      initialAudit={auditData?.summary || null}
      initialSuggestions={suggestionsData?.total || 0}
      initialAnalyzed={!!suggestionsData?.analyzed}
      initialBriefs={briefsData?.briefs?.length || 0}
    />
  );
}
