import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function test() {
  // Get a page with embedding
  const { data: page, error: pageErr } = await supabase
    .from("pages")
    .select("id, path, title, embedding")
    .eq("site_id", "dd93832b-3f40-412f-88ca-b093c81359d4")
    .not("embedding", "is", null)
    .eq("path", "/")
    .single();

  if (pageErr || !page) {
    console.log("Page error:", pageErr?.message);
    return;
  }

  console.log("Source page:", page.path, "-", page.title);
  console.log("Has embedding:", !!page.embedding);

  // Test the RPC function
  const { data, error } = await supabase.rpc("match_pages", {
    query_embedding: page.embedding,
    match_site_id: "dd93832b-3f40-412f-88ca-b093c81359d4",
    match_threshold: 0.25,
    match_count: 10,
  });

  if (error) {
    console.log("RPC error:", error.message);
    console.log("Error details:", JSON.stringify(error));
    return;
  }

  console.log("\nSimilar pages found:", data?.length || 0);
  for (const d of data || []) {
    const similarity = (1 - d.distance).toFixed(3);
    console.log(`  ${similarity} - ${d.path} - ${d.title}`);
  }
}

test().catch((e) => console.error("FATAL:", e));
