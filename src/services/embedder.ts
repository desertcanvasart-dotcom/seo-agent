import OpenAI from "openai";
import { supabase } from "../db/client.js";
import { env } from "../config/env.js";

const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });

// ─── Generate embedding for a text ──────────────────────────────
async function getEmbedding(text: string): Promise<number[]> {
  // OpenAI text-embedding-3-small has 8191 token limit (~5000 words safe)
  const truncated = text.split(/\s+/).slice(0, 5000).join(" ");

  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: truncated,
  });

  return response.data[0].embedding;
}

// ─── Prepare page text for embedding ─────────────────────────────
function preparePageText(page: {
  title: string | null;
  h1: string | null;
  meta_description: string | null;
  headings: { level: number; text: string }[];
  body_text: string;
  path: string;
  content_type: string;
}): string {
  // Combine signals — title and headings get extra weight by being included first
  const parts: string[] = [];

  if (page.title) parts.push(`Title: ${page.title}`);
  if (page.h1 && page.h1 !== page.title) parts.push(`H1: ${page.h1}`);
  if (page.meta_description) parts.push(`Description: ${page.meta_description}`);

  // Add headings
  const headingTexts = (page.headings || [])
    .filter((h) => h.level <= 3)
    .map((h) => h.text);
  if (headingTexts.length > 0) {
    parts.push(`Headings: ${headingTexts.join(". ")}`);
  }

  // Add body text
  if (page.body_text) {
    parts.push(page.body_text);
  }

  return parts.join("\n\n");
}

// ─── Embed all pages for a site ──────────────────────────────────
export async function embedSitePages(
  siteId: string,
  onProgress?: (done: number, total: number) => void
): Promise<{ embedded: number; failed: number }> {
  // Get all pages with content
  const { data: pages, error } = await supabase
    .from("pages")
    .select("id, title, h1, meta_description, headings, body_text, path, content_type, word_count")
    .eq("site_id", siteId)
    .gt("word_count", 10) // Skip near-empty pages
    .order("path");

  if (error || !pages) throw new Error(`Failed to get pages: ${error?.message}`);

  console.log(`\n🧠 Embedding ${pages.length} pages for site ${siteId}`);

  let embedded = 0;
  let failed = 0;

  // Process in batches of 5 to avoid rate limits
  const batchSize = 5;

  for (let i = 0; i < pages.length; i += batchSize) {
    const batch = pages.slice(i, i + batchSize);

    const promises = batch.map(async (page) => {
      try {
        const text = preparePageText(page);
        if (text.length < 50) {
          console.log(`   ⏭️  Skipping ${page.path} (too short)`);
          return;
        }

        const embedding = await getEmbedding(text);

        // Sanity-check: text-embedding-3-small must return 1536 dims.
        // Any other length means the model changed and will fail the vector(1536) cast.
        if (embedding.length !== 1536) {
          throw new Error(`Unexpected embedding length ${embedding.length} (expected 1536)`);
        }

        // Store embedding as a stringified array — pgvector accepts "[0.1,0.2,...]" and
        // casts it to vector(1536). supabase-js cannot send a native number[] through
        // PostgREST for pgvector columns, so this stringified form is the idiomatic path.
        const { error: updateError } = await supabase
          .from("pages")
          .update({ embedding: JSON.stringify(embedding) } as never)
          .eq("id", page.id);

        if (updateError) {
          console.error(`   ❌ Failed to store embedding for ${page.path}: ${updateError.message}`);
          failed++;
        } else {
          embedded++;
          console.log(`   ✓ [${embedded}/${pages.length}] ${page.path}`);
        }
      } catch (err) {
        console.error(`   ❌ Embedding failed for ${page.path}: ${(err as Error).message}`);
        failed++;
      }
    });

    await Promise.all(promises);

    if (onProgress) onProgress(Math.min(i + batchSize, pages.length), pages.length);

    // Small delay between batches
    if (i + batchSize < pages.length) {
      await new Promise((r) => setTimeout(r, 200));
    }
  }

  console.log(`\n✅ Embedding complete: ${embedded} embedded, ${failed} failed`);

  // Post-embed verification: count rows that actually have a non-null embedding.
  // This exposes silent cast failures that supabase-js reports as successful updates.
  const { count: verifiedCount, error: verifyErr } = await supabase
    .from("pages")
    .select("id", { count: "exact", head: true })
    .eq("site_id", siteId)
    .not("embedding", "is", null);

  if (verifyErr) {
    console.error(`   ⚠️  Post-embed verification query failed: ${verifyErr.message}`);
  } else {
    console.log(`   📊 Post-embed check: ${verifiedCount}/${pages.length} pages have non-null embeddings`);
    if ((verifiedCount || 0) === 0 && embedded > 0) {
      console.error(`   ❌ STORAGE BUG: ${embedded} updates reported success but 0 rows have embeddings — likely a pgvector cast failure`);
    }
  }

  return { embedded, failed };
}

// ─── Find similar pages using pgvector ───────────────────────────
export async function findSimilarPages(
  pageId: string,
  siteId: string,
  limit: number = 10,
  threshold: number = 0.3
): Promise<{ page_id: string; url: string; path: string; title: string; similarity: number; content_type: string }[]> {
  // Get the page's embedding
  const { data: page } = await supabase
    .from("pages")
    .select("embedding")
    .eq("id", pageId)
    .single();

  if (!page?.embedding) {
    console.log(`   🔍 findSimilarPages(${pageId}): source page has no embedding`);
    return [];
  }

  // supabase-js returns pgvector columns as a string like "[0.123,0.456,...]".
  // PostgREST will cast this back to vector(1536) when passed to the RPC.
  const embType = typeof page.embedding;
  const embLen = embType === "string" ? (page.embedding as string).length : -1;

  // Query pgvector for similar pages
  const { data, error } = await supabase.rpc("match_pages", {
    query_embedding: page.embedding,
    match_site_id: siteId,
    match_threshold: threshold,
    match_count: limit + 1, // +1 because the page itself will match
  });

  if (error) {
    console.error(`   ❌ match_pages RPC error: ${error.message} (emb type=${embType}, strlen=${embLen})`);
    return [];
  }

  const rawCount = (data || []).length;
  if (rawCount === 0) {
    console.log(`   🔍 match_pages returned 0 rows for ${pageId} (threshold=${threshold}, emb type=${embType}, strlen=${embLen})`);
  } else {
    const firstDist = (data as any)[0]?.distance;
    console.log(`   🔍 match_pages returned ${rawCount} rows for ${pageId}, first distance=${firstDist?.toFixed?.(4)}`);
  }

  // Filter out the page itself
  return (data || [])
    .filter((d: any) => d.id !== pageId)
    .slice(0, limit)
    .map((d: any) => ({
      page_id: d.id,
      url: d.url,
      path: d.path,
      title: d.title,
      similarity: 1 - d.distance, // Convert distance to similarity
      content_type: d.content_type,
    }));
}
