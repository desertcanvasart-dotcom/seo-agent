import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function test() {
  const siteId = "dd93832b-3f40-412f-88ca-b093c81359d4";

  // Pick a blog post page (less likely to link everywhere)
  const { data: page } = await supabase
    .from("pages")
    .select("id, path, title, outbound_links, embedding")
    .eq("site_id", siteId)
    .eq("path", "/the-curse-of-king-tuts-tomb")
    .single();

  if (!page) { console.log("No page"); return; }

  const outbound = (page.outbound_links || []) as any[];
  const internalLinks = outbound.filter((l: any) => l.isInternal);
  const internalUrls = internalLinks.map((l: any) => l.url?.replace(/\/$/, ""));

  console.log("Source:", page.path);
  console.log("Total outbound:", outbound.length);
  console.log("Internal links:", internalLinks.length);
  console.log("Sample internal URLs:");
  internalUrls.slice(0, 5).forEach((u: string) => console.log("  ", u));

  // Find similar
  const { data: similar, error } = await supabase.rpc("match_pages", {
    query_embedding: page.embedding,
    match_site_id: siteId,
    match_threshold: 0.25,
    match_count: 10,
  });

  if (error) { console.log("Error:", error.message); return; }

  console.log("\nSimilar pages:", similar?.length);
  let newLinks = 0;
  let existingLinks = 0;

  for (const s of similar || []) {
    if (s.id === page.id) continue;
    const targetUrl = s.url?.replace(/\/$/, "");
    const alreadyLinked = internalUrls.some((u: string) => u === targetUrl);
    const sim = (1 - s.distance).toFixed(3);

    if (alreadyLinked) {
      existingLinks++;
      console.log("  EXISTING", sim, s.path);
    } else {
      newLinks++;
      console.log("  NEW     ", sim, s.path);
    }
  }

  console.log("\nNew link opportunities:", newLinks);
  console.log("Already linked:", existingLinks);
}

test().catch((e) => console.error("FATAL:", e));
