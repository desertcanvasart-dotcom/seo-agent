import "dotenv/config";
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function test() {
  // Test 1: Generate embedding
  console.log("Key prefix:", process.env.OPENAI_API_KEY?.slice(0, 15));

  const res = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: "Egypt tours and travel packages for the best vacation",
  });

  const embedding = res.data[0].embedding;
  console.log("Embedding length:", embedding.length);

  // Test 2: Store in Supabase
  // Get first page
  const { data: page } = await supabase
    .from("pages")
    .select("id, path")
    .eq("site_id", "dd93832b-3f40-412f-88ca-b093c81359d4")
    .limit(1)
    .single();

  if (!page) {
    console.log("No page found");
    return;
  }

  console.log("Test page:", page.path);

  // Try storing as string
  const embeddingStr = `[${embedding.join(",")}]`;
  const { error } = await supabase
    .from("pages")
    .update({ embedding: embeddingStr } as any)
    .eq("id", page.id);

  if (error) {
    console.log("String storage error:", error.message);

    // Try as JSON
    const { error: err2 } = await supabase
      .from("pages")
      .update({ embedding: JSON.stringify(embedding) } as any)
      .eq("id", page.id);

    if (err2) console.log("JSON storage error:", err2.message);
    else console.log("JSON storage OK");
  } else {
    console.log("String storage OK");
  }

  // Verify
  const { data: check } = await supabase
    .from("pages")
    .select("embedding")
    .eq("id", page.id)
    .single();

  console.log("Embedding stored:", check?.embedding ? "YES" : "NO");
}

test().catch((e) => console.error("FATAL:", e));
