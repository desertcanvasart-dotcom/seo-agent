import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import * as cheerio from "cheerio";

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function testCrawl() {
  const domain = "travel2egypt.org";
  const url = "https://" + domain;

  console.log("Fetching:", url);
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml",
    },
    redirect: "follow",
    signal: AbortSignal.timeout(10000),
  });

  console.log("Status:", res.status);
  const ct = res.headers.get("content-type");
  console.log("Content-Type:", ct);

  const html = await res.text();
  console.log("HTML length:", html.length);

  const doc = cheerio.load(html);
  const title = doc("title").text().trim();
  console.log("Title:", title);

  // Count internal links
  let internal = 0;
  let external = 0;
  const internalUrls: string[] = [];

  doc("a[href]").each((_, el) => {
    const href = doc(el).attr("href");
    if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return;
    try {
      const u = new URL(href, url);
      if (u.hostname.replace("www.", "") === domain.replace("www.", "")) {
        internal++;
        const clean = u.href.split("#")[0].replace(/\/$/, "");
        if (!internalUrls.includes(clean) && clean !== url && clean !== url.replace(/\/$/, "")) {
          internalUrls.push(clean);
        }
      } else {
        external++;
      }
    } catch {}
  });

  console.log("Internal links found:", internal);
  console.log("External links found:", external);
  console.log("Unique internal URLs:", internalUrls.length);
  console.log("First 10 internal URLs:");
  internalUrls.slice(0, 10).forEach((u) => console.log("  ", u));

  // Try to insert homepage into DB
  const { data, error } = await supabase
    .from("pages")
    .upsert(
      {
        site_id: "dd93832b-3f40-412f-88ca-b093c81359d4",
        url: url.replace(/\/$/, ""),
        path: "/",
        title: title,
        status_code: 200,
        word_count: doc("body").text().split(/\s+/).length,
        content_type: "homepage",
        last_crawled_at: new Date().toISOString(),
      },
      { onConflict: "site_id,url" }
    )
    .select()
    .single();

  if (error) console.log("DB ERROR:", JSON.stringify(error));
  else console.log("DB OK — page id:", data.id);
}

testCrawl().catch((e) => console.error("FATAL:", e));
