import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function test() {
  const siteId = "dd93832b-3f40-412f-88ca-b093c81359d4";

  // Get pages
  const { data: pages } = await supabase
    .from("pages")
    .select("id, url, path, title, content_type, outbound_links, inbound_link_count, word_count")
    .eq("site_id", siteId)
    .gt("word_count", 10)
    .not("path", "like", "%wp-%")
    .order("path")
    .limit(10); // Just test first 10

  if (!pages) { console.log("No pages"); return; }

  console.log("Testing", pages.length, "pages\n");

  let totalNew = 0;

  for (const page of pages) {
    // Get embedding
    const { data: pageEmb } = await supabase
      .from("pages")
      .select("embedding")
      .eq("id", page.id)
      .single();

    if (!pageEmb?.embedding) {
      console.log("  SKIP (no embedding):", page.path);
      continue;
    }

    // Find similar
    const { data: similar, error } = await supabase.rpc("match_pages", {
      query_embedding: pageEmb.embedding,
      match_site_id: siteId,
      match_threshold: 0.25,
      match_count: 8,
    });

    if (error) {
      console.log("  RPC ERROR for", page.path, ":", error.message);
      continue;
    }

    // Check for new links
    const outboundUrls = ((page.outbound_links || []) as any[]).map((l: any) => l.url?.replace(/\/$/, ""));

    let newCount = 0;
    for (const s of similar || []) {
      if (s.id === page.id) continue;
      const targetUrl = s.url?.replace(/\/$/, "");
      if (!outboundUrls.includes(targetUrl)) {
        newCount++;

        // Try inserting
        const { error: insertErr } = await supabase.from("link_suggestions").insert({
          site_id: siteId,
          source_page_id: page.id,
          target_page_id: s.id,
          anchor_text: (s.title || s.path).replace(/ - Travel2Egypt$/i, ""),
          similarity_score: 1 - s.distance,
          relevance_score: 1 - s.distance,
          confidence: "medium",
          reason: "Semantically similar content",
          status: "pending",
        });

        if (insertErr) {
          console.log("  INSERT ERR:", insertErr.message?.slice(0, 80));
        }
      }
    }

    totalNew += newCount;
    console.log(`  ${page.path} — ${newCount} new suggestions (${similar?.length || 0} similar, ${outboundUrls.length} existing links)`);
  }

  console.log("\nTotal new suggestions:", totalNew);

  // Check what's in DB now
  const { count } = await supabase
    .from("link_suggestions")
    .select("id", { count: "exact", head: true })
    .eq("site_id", siteId);

  console.log("Suggestions in DB:", count);
}

test().catch((e) => console.error("FATAL:", e));
