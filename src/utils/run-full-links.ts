import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function run() {
  const siteId = "dd93832b-3f40-412f-88ca-b093c81359d4";

  const { data: pages } = await supabase
    .from("pages")
    .select("id, url, path, title, content_type, outbound_links, inbound_link_count, word_count")
    .eq("site_id", siteId)
    .gt("word_count", 10)
    .not("path", "like", "%wp-%")
    .order("path");

  if (!pages) { console.log("No pages"); return; }

  console.log("Generating links for", pages.length, "pages\n");
  let totalNew = 0;

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];

    if (page.content_type === "legal") continue;

    const { data: pageEmb } = await supabase
      .from("pages")
      .select("embedding")
      .eq("id", page.id)
      .single();

    if (!pageEmb?.embedding) continue;

    const { data: similar, error } = await supabase.rpc("match_pages", {
      query_embedding: pageEmb.embedding,
      match_site_id: siteId,
      match_threshold: 0.25,
      match_count: 10,
    });

    if (error || !similar) continue;

    const outboundUrls = ((page.outbound_links || []) as any[]).map((l: any) => l.url?.replace(/\/$/, ""));
    let newCount = 0;

    for (const s of similar) {
      if (s.id === page.id) continue;
      const targetUrl = s.url?.replace(/\/$/, "");
      if (outboundUrls.includes(targetUrl)) continue;

      const similarity = 1 - s.distance;
      if (similarity < 0.3) continue;

      let confidence: "low" | "medium" | "high" = "low";
      if (similarity >= 0.6) confidence = "high";
      else if (similarity >= 0.4) confidence = "medium";

      const { error: insertErr } = await supabase.from("link_suggestions").upsert({
        site_id: siteId,
        source_page_id: page.id,
        target_page_id: s.id,
        anchor_text: (s.title || s.path).replace(/ - Travel2Egypt$/i, ""),
        similarity_score: similarity,
        relevance_score: similarity,
        confidence,
        reason: similarity > 0.6 ? "Highly related content" : "Semantically similar content",
        status: "pending",
      }, { onConflict: "source_page_id,target_page_id" });

      if (!insertErr) newCount++;
    }

    totalNew += newCount;
    if (newCount > 0) console.log(`  [${i+1}/${pages.length}] ${page.path} → ${newCount} new`);
  }

  console.log("\n✅ Done! Total new suggestions:", totalNew);

  const { count } = await supabase
    .from("link_suggestions")
    .select("id", { count: "exact", head: true })
    .eq("site_id", siteId);
  console.log("Total in DB:", count);
}

run().catch((e) => console.error("FATAL:", e));
