import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function test() {
  // Check two different pages
  const { data: p1 } = await supabase
    .from("pages")
    .select("id, path, embedding")
    .eq("site_id", "dd93832b-3f40-412f-88ca-b093c81359d4")
    .eq("path", "/egypt-travel-faqs")
    .single();

  const { data: p2 } = await supabase
    .from("pages")
    .select("id, path, embedding")
    .eq("site_id", "dd93832b-3f40-412f-88ca-b093c81359d4")
    .eq("path", "/")
    .single();

  console.log("P1 has embedding:", !!p1?.embedding);
  console.log("P2 has embedding:", !!p2?.embedding);

  if (p1?.embedding) {
    const emb = typeof p1.embedding === "string" ? p1.embedding : JSON.stringify(p1.embedding);
    console.log("P1 embedding type:", typeof p1.embedding);
    console.log("P1 preview:", emb.slice(0, 80));
  }

  // Try raw match_pages with p2 embedding on p1
  if (p2?.embedding) {
    console.log("\nTesting match_pages with homepage embedding...");
    const { data, error } = await supabase.rpc("match_pages", {
      query_embedding: p2.embedding,
      match_site_id: "dd93832b-3f40-412f-88ca-b093c81359d4",
      match_threshold: 0.1,  // Very low threshold
      match_count: 5,
    });
    console.log("Error:", error?.message || "none");
    console.log("Results:", data?.length || 0);
    if (data) {
      for (const d of data) {
        console.log(`  dist=${d.distance.toFixed(4)} ${d.path}`);
      }
    }
  }
}

test().catch((e) => console.error("FATAL:", e));
