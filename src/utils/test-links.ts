import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function test() {
  const siteId = process.env.TEST_SITE_ID || "";

  // Get homepage
  const { data: page } = await supabase
    .from("pages")
    .select("id, path, title, outbound_links, embedding")
    .eq("site_id", siteId)
    .eq("path", "/sample-page")
    .single();

  if (!page) { console.log("No page"); return; }

  console.log("Source:", page.path);
  console.log("Outbound links:", (page.outbound_links as any[])?.length || 0);

  // Find similar
  const { data: similar, error } = await supabase.rpc("match_pages", {
    query_embedding: page.embedding,
    match_site_id: siteId,
    match_threshold: 0.25,
    match_count: 10,
  });

  if (error) { console.log("RPC error:", error.message); return; }

  console.log("\nSimilar pages:", similar?.length);

  // Check which ones already have links
  const outboundUrls = ((page.outbound_links || []) as any[]).map((l: any) => l.url?.replace(/\/$/, ""));

  for (const s of similar || []) {
    if (s.id === page.id) continue;
    const alreadyLinked = outboundUrls.includes(s.url?.replace(/\/$/, ""));
    const sim = (1 - s.distance).toFixed(3);
    console.log(`  ${sim} ${alreadyLinked ? "EXISTING" : "NEW"} - ${s.path} - ${s.title}`);

    if (!alreadyLinked) {
      // Try to insert a suggestion
      const { error: insertErr } = await supabase.from("link_suggestions").insert({
        site_id: siteId,
        source_page_id: page.id,
        target_page_id: s.id,
        anchor_text: s.title || s.path,
        similarity_score: 1 - s.distance,
        relevance_score: 1 - s.distance,
        confidence: "medium",
        reason: "test",
        status: "pending",
      });

      if (insertErr) console.log("    INSERT ERROR:", insertErr.message);
      else console.log("    INSERT OK");
    }
  }
}

test().catch((e) => console.error("FATAL:", e));
