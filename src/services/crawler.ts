import * as cheerio from "cheerio";
import { URL } from "url";
import puppeteer, { type Browser } from "puppeteer";
import { supabase } from "../db/client.js";

// ─── Types ───────────────────────────────────────────────────────
interface CrawlOptions {
  siteId: string;
  domain: string;
  maxDepth: number;
  maxPages: number;
  respectRobots: boolean;
  delayMs: number;
  useJsRendering?: boolean;
  autoPipeline?: boolean; // auto-run audit + embed + links after crawl
}

interface PageData {
  url: string;
  path: string;
  title: string | null;
  metaDescription: string | null;
  h1: string | null;
  headings: { level: number; text: string }[];
  bodyText: string;
  wordCount: number;
  outboundLinks: { url: string; anchorText: string; isInternal: boolean }[];
  schemaTypes: string[];
  hasJsonLd: boolean;
  statusCode: number;
}

interface CrawlProgress {
  queued: number;
  crawled: number;
  failed: number;
  total: number;
}

// ─── Robots.txt parser (simple) ──────────────────────────────────
async function fetchRobotsTxt(domain: string): Promise<Set<string>> {
  const disallowed = new Set<string>();
  try {
    const res = await fetch(`https://${domain}/robots.txt`, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return disallowed;
    const text = await res.text();

    let isRelevantAgent = false;
    for (const line of text.split("\n")) {
      const trimmed = line.trim().toLowerCase();
      if (trimmed.startsWith("user-agent:")) {
        const agent = trimmed.split(":")[1]?.trim();
        isRelevantAgent = agent === "*" || agent === "googlebot";
      } else if (isRelevantAgent && trimmed.startsWith("disallow:")) {
        const path = line.split(":").slice(1).join(":").trim();
        if (path) disallowed.add(path);
      }
    }
  } catch {
    // Can't fetch robots.txt — allow everything
  }
  return disallowed;
}

function isDisallowed(path: string, disallowedPaths: Set<string>): boolean {
  for (const rule of disallowedPaths) {
    if (path.startsWith(rule)) return true;
  }
  return false;
}

// ─── HTML Parser ─────────────────────────────────────────────────
function parsePage(html: string, pageUrl: string, domain: string): PageData {
  const $ = cheerio.load(html);

  // Remove script, style, nav, footer, header noise
  $("script, style, noscript, iframe, svg").remove();

  // Title
  const title = $("title").first().text().trim() || null;

  // Meta description
  const metaDescription =
    $('meta[name="description"]').attr("content")?.trim() ||
    $('meta[property="og:description"]').attr("content")?.trim() ||
    null;

  // H1
  const h1 = $("h1").first().text().trim() || null;

  // All headings
  const headings: { level: number; text: string }[] = [];
  $("h1, h2, h3, h4, h5, h6").each((_, el) => {
    const tag = (el as any).tagName;
    const level = parseInt(tag.charAt(1));
    const text = $(el).text().trim();
    if (text) headings.push({ level, text });
  });

  // Body text — get all text, only strip elements that are definitely not content
  const bodyClone = $("body").clone();
  // Remove noise elements only
  bodyClone.find("script, style, noscript, iframe, svg, nav, [role='navigation']").remove();
  // Remove cookie banners, popups, chat widgets
  bodyClone.find("[class*='cookie'], [class*='popup'], [class*='chat-widget'], [id*='cookie']").remove();

  const rawBodyText = bodyClone.text().replace(/\s+/g, " ").trim();

  // Try to get just the main content area for a cleaner extract
  const contentSelectors = [
    ".elementor-section-wrap",       // Elementor full page
    ".elementor",                    // Elementor container
    "main",
    "article",
    "[role='main']",
    ".entry-content",
    ".post-content",
    ".page-content",
    "#content",
    ".site-content",
  ];

  let bodyText = rawBodyText;
  for (const selector of contentSelectors) {
    const found = $("body").find(selector);
    if (found.length) {
      const clone = found.clone();
      clone.find("script, style, noscript, nav, [role='navigation']").remove();
      const text = clone.text().replace(/\s+/g, " ").trim();
      // Use the content selector only if it captures substantial content
      if (text.length > rawBodyText.length * 0.3 && text.length > 200) {
        bodyText = text;
        break;
      }
    }
  }

  // If all selectors failed and raw body is very short, use the raw body
  const wordCount = bodyText.split(/\s+/).filter(Boolean).length;

  // Parse URL for path
  let path = "/";
  try {
    path = new URL(pageUrl).pathname;
  } catch {}

  // Outbound links
  const outboundLinks: { url: string; anchorText: string; isInternal: boolean }[] = [];
  const seenLinks = new Set<string>();

  $("a[href]").each((_, el) => {
    const href = $(el).attr("href");
    if (!href) return;

    if (href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:") || href.startsWith("javascript:")) return;

    let absoluteUrl: string;
    try {
      absoluteUrl = new URL(href, pageUrl).href;
    } catch {
      return;
    }

    const clean = absoluteUrl.split("#")[0].replace(/\/$/, "");
    if (seenLinks.has(clean)) return;
    seenLinks.add(clean);

    const anchorText = $(el).text().trim();
    let isInternal = false;
    try {
      isInternal = new URL(absoluteUrl).hostname.replace("www.", "") === domain.replace("www.", "");
    } catch {}

    outboundLinks.push({ url: clean, anchorText, isInternal });
  });

  // JSON-LD / Schema
  const schemaTypes: string[] = [];
  let hasJsonLd = false;

  $('script[type="application/ld+json"]').each((_, el) => {
    hasJsonLd = true;
    try {
      const data = JSON.parse($(el).html() || "");
      const types = Array.isArray(data) ? data : [data];
      for (const item of types) {
        if (item["@type"]) {
          const t = Array.isArray(item["@type"]) ? item["@type"] : [item["@type"]];
          schemaTypes.push(...t);
        }
      }
    } catch {}
  });

  return {
    url: pageUrl,
    path,
    title,
    metaDescription,
    h1,
    headings,
    bodyText: bodyText.slice(0, 50000),
    wordCount,
    outboundLinks,
    schemaTypes: [...new Set(schemaTypes)],
    hasJsonLd,
    statusCode: 200,
  };
}

// ─── Fetch with plain HTTP (fast, no JS) ─────────────────────────
async function fetchPageSimple(url: string): Promise<{ html: string; statusCode: number } | null> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      return { html: "", statusCode: res.status };
    }

    const contentType = res.headers.get("content-type") || "";
    if (!contentType.includes("text/html")) return null;

    const html = await res.text();
    return { html, statusCode: res.status };
  } catch (err) {
    console.error(`   ❌ Fetch error for ${url}:`, (err as Error).message);
    return null;
  }
}

// ─── Fetch with Puppeteer (JS rendering) ─────────────────────────
async function fetchPageWithBrowser(
  browser: Browser,
  url: string
): Promise<{ html: string; statusCode: number } | null> {
  let page;
  try {
    page = await browser.newPage();

    // Block images, fonts, media to speed up crawl
    await page.setRequestInterception(true);
    page.on("request", (req) => {
      const type = req.resourceType();
      if (["image", "font", "media", "stylesheet"].includes(type)) {
        req.abort();
      } else {
        req.continue();
      }
    });

    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    );

    const response = await page.goto(url, {
      waitUntil: "networkidle2",
      timeout: 15000,
    });

    const statusCode = response?.status() ?? 0;

    if (statusCode >= 400) {
      return { html: "", statusCode };
    }

    // Wait a bit for any lazy-loaded content
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });
    await new Promise((r) => setTimeout(r, 1000));

    // Get the fully rendered HTML
    const html = await page.content();

    return { html, statusCode };
  } catch (err) {
    console.error(`   ❌ Browser fetch error for ${url}:`, (err as Error).message);
    return null;
  } finally {
    if (page) await page.close().catch(() => {});
  }
}

// ─── Main Crawl Function ─────────────────────────────────────────
export async function crawlSite(options: CrawlOptions, onProgress?: (p: CrawlProgress) => void): Promise<void> {
  const { siteId, domain, maxDepth, maxPages, respectRobots, delayMs, useJsRendering = true } = options;

  // Update site status
  await supabase
    .from("sites")
    .update({ crawl_status: "crawling", crawl_started_at: new Date().toISOString() })
    .eq("id", siteId);

  // Fetch robots.txt
  const disallowed = respectRobots ? await fetchRobotsTxt(domain) : new Set<string>();

  // Launch browser if JS rendering is enabled
  let browser: Browser | null = null;
  if (useJsRendering) {
    console.log("   🌐 Launching browser for JS rendering...");
    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage", "--disable-gpu"],
    });
  }

  // BFS crawl queue
  const startUrl = `https://${domain}`;
  const queue: { url: string; depth: number }[] = [{ url: startUrl, depth: 0 }];
  const visited = new Set<string>();
  let crawledCount = 0;
  let failedCount = 0;

  console.log(`\n🕷️  Starting crawl: ${domain}`);
  console.log(`   Max depth: ${maxDepth}, Max pages: ${maxPages}`);
  console.log(`   JS rendering: ${useJsRendering ? "ON" : "OFF"}`);
  if (disallowed.size > 0) {
    console.log(`   Robots.txt: ${disallowed.size} disallowed paths`);
  }

  try {
    while (queue.length > 0 && crawledCount < maxPages) {
      const { url, depth } = queue.shift()!;

      // Normalize URL
      const cleanUrl = url.split("#")[0].replace(/\/$/, "") || url;
      if (visited.has(cleanUrl)) continue;
      visited.add(cleanUrl);

      // Check if URL belongs to same domain
      try {
        const parsed = new URL(cleanUrl);
        if (parsed.hostname.replace("www.", "") !== domain.replace("www.", "")) continue;
        if (respectRobots && isDisallowed(parsed.pathname, disallowed)) {
          console.log(`   ⛔ Blocked by robots.txt: ${parsed.pathname}`);
          continue;
        }
      } catch {
        continue;
      }

      // Fetch page
      console.log(`   📄 [${crawledCount + 1}/${maxPages}] ${cleanUrl}`);
      const result = browser
        ? await fetchPageWithBrowser(browser, cleanUrl)
        : await fetchPageSimple(cleanUrl);

      if (!result) {
        failedCount++;
        continue;
      }

      if (!result.html) {
        await supabase.from("pages").upsert(
          {
            site_id: siteId,
            url: cleanUrl,
            path: new URL(cleanUrl).pathname,
            status_code: result.statusCode,
            last_crawled_at: new Date().toISOString(),
            crawl_depth: depth,
          },
          { onConflict: "site_id,url" }
        );
        failedCount++;
        continue;
      }

      // Parse the page
      const pageData = parsePage(result.html, cleanUrl, domain);
      pageData.statusCode = result.statusCode;

      // Store in database
      const { error } = await supabase.from("pages").upsert(
        {
          site_id: siteId,
          url: pageData.url,
          path: pageData.path,
          title: pageData.title,
          meta_description: pageData.metaDescription,
          h1: pageData.h1,
          headings: pageData.headings,
          body_text: pageData.bodyText,
          word_count: pageData.wordCount,
          outbound_links: pageData.outboundLinks,
          schema_types: pageData.schemaTypes,
          has_json_ld: pageData.hasJsonLd,
          status_code: pageData.statusCode,
          crawl_depth: depth,
          last_crawled_at: new Date().toISOString(),
          content_type: guessContentType(pageData.path),
        },
        { onConflict: "site_id,url" }
      );

      if (error) {
        console.error(`   ❌ DB error for ${cleanUrl}: ${error.message}`);
        failedCount++;
        continue;
      }

      crawledCount++;
      console.log(`      ✓ ${pageData.wordCount} words, ${pageData.outboundLinks.filter((l) => l.isInternal).length} internal links`);

      // Report progress
      if (onProgress) {
        onProgress({ queued: queue.length, crawled: crawledCount, failed: failedCount, total: maxPages });
      }

      // Add internal links to queue
      if (depth < maxDepth) {
        for (const link of pageData.outboundLinks) {
          if (link.isInternal && !visited.has(link.url.replace(/\/$/, ""))) {
            queue.push({ url: link.url, depth: depth + 1 });
          }
        }
      }

      // Rate limiting
      if (delayMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }

    // Update inbound link counts
    await updateInboundCounts(siteId);

    // Update site status
    await supabase
      .from("sites")
      .update({
        crawl_status: "completed",
        crawl_completed_at: new Date().toISOString(),
        page_count: crawledCount,
      })
      .eq("id", siteId);

    console.log(`\n✅ Crawl complete: ${domain}`);
    console.log(`   Pages crawled: ${crawledCount}`);
    console.log(`   Failed: ${failedCount}`);
    console.log(`   Queued but skipped: ${queue.length}`);

    // Auto pipeline: crawl → audit → embed → links
    if (options.autoPipeline && crawledCount > 0) {
      console.log(`\n🔄 Auto-pipeline starting...`);
      try {
        // Dynamic imports to avoid circular deps
        const { auditSite } = await import("./auditor.js");
        console.log(`   📋 Running audit...`);
        await auditSite(siteId);

        const { embedSitePages } = await import("./embedder.js");
        console.log(`   🧠 Generating embeddings...`);
        await embedSitePages(siteId);

        const { generateLinkSuggestions } = await import("./linker.js");
        console.log(`   🔗 Generating link suggestions...`);
        await generateLinkSuggestions(siteId);

        console.log(`   ✅ Auto-pipeline complete!`);
      } catch (err) {
        console.error(`   ❌ Auto-pipeline error:`, (err as Error).message);
      }
    }
  } finally {
    // Always close the browser
    if (browser) {
      await browser.close().catch(() => {});
      console.log("   🌐 Browser closed");
    }
  }
}

// ─── Update inbound link counts ──────────────────────────────────
async function updateInboundCounts(siteId: string) {
  const { data: pages } = await supabase
    .from("pages")
    .select("id, url, outbound_links")
    .eq("site_id", siteId);

  if (!pages) return;

  const urlToId = new Map<string, string>();
  const inboundCounts = new Map<string, number>();

  for (const page of pages) {
    urlToId.set(page.url, page.id);
    inboundCounts.set(page.id, 0);
  }

  for (const page of pages) {
    const links = (page.outbound_links as { url: string; isInternal: boolean }[]) || [];
    for (const link of links) {
      if (link.isInternal) {
        const cleanUrl = link.url.replace(/\/$/, "");
        const targetId = urlToId.get(cleanUrl);
        if (targetId) {
          inboundCounts.set(targetId, (inboundCounts.get(targetId) || 0) + 1);
        }
      }
    }
  }

  for (const [pageId, count] of inboundCounts) {
    await supabase.from("pages").update({ inbound_link_count: count }).eq("id", pageId);
  }
}

// ─── Guess content type from URL path ────────────────────────────
function guessContentType(path: string): string {
  const p = path.toLowerCase();
  if (p === "/" || p === "") return "homepage";
  if (p.includes("/blog") || p.includes("/news") || p.includes("/article")) return "blog";
  if (p.includes("/product") || p.includes("/item") || p.includes("/shop")) return "product";
  if (p.includes("/service") || p.includes("/solution") || p.includes("/offering")) return "service";
  if (p.includes("/category") || p.includes("/tag")) return "category";
  if (p.includes("/about") || p.includes("/contact") || p.includes("/faq")) return "info";
  if (p.includes("/privacy") || p.includes("/terms") || p.includes("/legal")) return "legal";
  return "page";
}
