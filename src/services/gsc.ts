import { google } from "googleapis";
import { supabase } from "../db/client.js";

// ─── Types ───────────────────────────────────────────────────────
interface GscCredentials {
  client_email: string;
  private_key: string;
}

interface PageMetrics {
  page_url: string;
  page_path: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
  top_queries: { query: string; clicks: number; impressions: number; ctr: number; position: number }[];
}

// ─── Create authenticated GSC client ─────────────────────────────
function getGscClient(credentials: GscCredentials) {
  const auth = new google.auth.JWT({
    email: credentials.client_email,
    key: credentials.private_key.replace(/\\n/g, "\n"),
    scopes: ["https://www.googleapis.com/auth/webmasters.readonly"],
  });

  return google.searchconsole({ version: "v1", auth });
}

// ─── Sync GSC data for a site ────────────────────────────────────
export async function syncGscData(
  siteId: string,
  domain: string,
  credentials: GscCredentials,
  days: number = 30
): Promise<{ pages: number; synced: boolean }> {
  console.log(`\n📊 Syncing GSC data for ${domain}`);

  const searchconsole = getGscClient(credentials);

  // Date range: last N days
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const startStr = startDate.toISOString().split("T")[0];
  const endStr = endDate.toISOString().split("T")[0];
  const dateRange = `${startStr} to ${endStr}`;

  // GSC requires the site URL in a specific format
  const siteUrl = `sc-domain:${domain.replace(/^www\./, "")}`;

  try {
    // Step 1: Get per-page metrics
    const pageResponse = await searchconsole.searchanalytics.query({
      siteUrl,
      requestBody: {
        startDate: startStr,
        endDate: endStr,
        dimensions: ["page"],
        rowLimit: 500,
      },
    });

    const pageRows = pageResponse.data.rows || [];
    console.log(`   Found ${pageRows.length} pages with GSC data`);

    // Step 2: For top pages, get their query data
    const pageMetrics: PageMetrics[] = [];

    for (const row of pageRows) {
      const pageUrl = row.keys?.[0] || "";
      let pagePath = "/";
      try {
        pagePath = new URL(pageUrl).pathname;
      } catch {}

      // Get top queries for this page
      let topQueries: PageMetrics["top_queries"] = [];
      try {
        const queryResponse = await searchconsole.searchanalytics.query({
          siteUrl,
          requestBody: {
            startDate: startStr,
            endDate: endStr,
            dimensions: ["query"],
            dimensionFilterGroups: [{
              filters: [{
                dimension: "page",
                expression: pageUrl,
              }],
            }],
            rowLimit: 10,
          },
        });

        topQueries = (queryResponse.data.rows || []).map((qr) => ({
          query: qr.keys?.[0] || "",
          clicks: qr.clicks || 0,
          impressions: qr.impressions || 0,
          ctr: qr.ctr || 0,
          position: qr.position || 0,
        }));
      } catch {
        // Query-level data might fail for some pages
      }

      pageMetrics.push({
        page_url: pageUrl,
        page_path: pagePath,
        clicks: row.clicks || 0,
        impressions: row.impressions || 0,
        ctr: row.ctr || 0,
        position: row.position || 0,
        top_queries: topQueries,
      });

      // Small delay to avoid rate limits
      await new Promise((r) => setTimeout(r, 100));
    }

    // Step 3: Store in database
    for (const pm of pageMetrics) {
      await supabase.from("gsc_data").upsert({
        site_id: siteId,
        page_url: pm.page_url,
        page_path: pm.page_path,
        clicks: pm.clicks,
        impressions: pm.impressions,
        ctr: pm.ctr,
        position: pm.position,
        top_queries: pm.top_queries,
        date_range: dateRange,
        synced_at: new Date().toISOString(),
      }, { onConflict: "site_id,page_url" });
    }

    console.log(`   ✅ Synced ${pageMetrics.length} pages`);
    return { pages: pageMetrics.length, synced: true };
  } catch (err: any) {
    // Handle common GSC errors
    if (err.message?.includes("403") || err.message?.includes("Forbidden")) {
      console.error(`   ❌ GSC access denied. Make sure the service account has access to ${domain} in Search Console.`);
    } else if (err.message?.includes("404") || err.message?.includes("not found")) {
      console.error(`   ❌ Site ${domain} not found in GSC. Try: sc-domain:${domain} or https://${domain}/`);
    } else {
      console.error(`   ❌ GSC sync failed:`, err.message);
    }
    return { pages: 0, synced: false };
  }
}

// ─── Get GSC data for a site ─────────────────────────────────────
export async function getGscDataForSite(siteId: string) {
  const { data } = await supabase
    .from("gsc_data")
    .select("*")
    .eq("site_id", siteId)
    .order("clicks", { ascending: false });

  return data || [];
}
