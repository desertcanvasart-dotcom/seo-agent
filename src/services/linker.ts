import { supabase } from "../db/client.js";
import { findSimilarPages } from "./embedder.js";

// ─── Types ───────────────────────────────────────────────────────
interface LinkSuggestion {
  source_page_id: string;
  target_page_id: string;
  anchor_text: string;
  context_snippet: string;
  similarity_score: number;
  relevance_score: number;
  confidence: "low" | "medium" | "high";
  reason: string;
}

// ─── Content type link relevance matrix ──────────────────────────
// Some content type pairs make better links than others
const LINK_RELEVANCE: Record<string, Record<string, number>> = {
  homepage: { tour: 1.2, destination: 1.2, blog: 1.0, page: 0.8, info: 0.6, category: 1.0 },
  blog: { tour: 1.3, destination: 1.2, blog: 1.0, page: 0.9, info: 0.7, category: 0.8 },
  tour: { tour: 0.9, destination: 1.3, blog: 1.1, page: 0.8, info: 0.6, category: 0.7 },
  destination: { tour: 1.4, destination: 1.0, blog: 1.1, page: 0.9, info: 0.7, category: 0.8 },
  page: { tour: 1.2, destination: 1.1, blog: 1.0, page: 0.8, info: 0.7, category: 0.7 },
  info: { tour: 0.8, destination: 0.7, blog: 0.6, page: 0.5, info: 0.4, category: 0.5 },
  category: { tour: 1.1, destination: 1.0, blog: 0.9, page: 0.7, info: 0.5, category: 0.6 },
  legal: { tour: 0.2, destination: 0.2, blog: 0.2, page: 0.2, info: 0.3, category: 0.2 },
};

// ─── Generate anchor text from target page ───────────────────────
function generateAnchorText(targetTitle: string, targetPath: string, targetContentType: string): string {
  // Clean up the title — remove site name suffix
  let anchor = targetTitle
    .replace(/\s*[-|–]\s*Travel2Egypt$/i, "")
    .replace(/\s*[-|–]\s*[^-|–]*$/i, "") // Generic site name removal
    .trim();

  // If title is too long, shorten it
  if (anchor.length > 60) {
    // Try to find a natural break point
    const words = anchor.split(/\s+/);
    anchor = words.slice(0, 6).join(" ");
  }

  // If title is empty, generate from path
  if (!anchor) {
    anchor = targetPath
      .replace(/^\//, "")
      .replace(/-/g, " ")
      .replace(/\//g, " - ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }

  return anchor;
}

// ─── Find context snippet in source page ─────────────────────────
function findContextSnippet(bodyText: string, targetTitle: string, targetKeywords: string[]): string {
  if (!bodyText) return "";

  // Split into sentences
  const sentences = bodyText.split(/[.!?]+/).filter((s) => s.trim().length > 20);

  // Score each sentence by relevance to the target
  const keywords = [
    ...targetKeywords,
    ...targetTitle.toLowerCase().split(/\s+/).filter((w) => w.length > 3),
  ];

  let bestSentence = "";
  let bestScore = 0;

  for (const sentence of sentences) {
    const lower = sentence.toLowerCase();
    let score = 0;
    for (const keyword of keywords) {
      if (lower.includes(keyword.toLowerCase())) score++;
    }
    if (score > bestScore) {
      bestScore = score;
      bestSentence = sentence.trim();
    }
  }

  // Return the best matching sentence (truncated)
  if (bestSentence) {
    return bestSentence.length > 200 ? bestSentence.slice(0, 200) + "..." : bestSentence;
  }

  return "";
}

// ─── Check if link already exists ────────────────────────────────
function linkAlreadyExists(
  sourceLinks: { url: string; isInternal: boolean }[],
  targetUrl: string
): boolean {
  const cleanTarget = targetUrl.replace(/\/$/, "");
  return sourceLinks.some((l) => l.url.replace(/\/$/, "") === cleanTarget);
}

// ─── Generate link suggestions for a site ────────────────────────
export async function generateLinkSuggestions(
  siteId: string,
  onProgress?: (done: number, total: number) => void
): Promise<{ suggestions: number; orphans: number }> {
  // Get all pages with embeddings
  const { data: pages, error } = await supabase
    .from("pages")
    .select("id, url, path, title, h1, body_text, content_type, outbound_links, inbound_link_count, word_count")
    .eq("site_id", siteId)
    .gt("word_count", 10)
    .order("path");

  if (error || !pages) throw new Error(`Failed to get pages: ${error?.message}`);

  console.log(`\n🔗 Generating link suggestions for ${pages.length} pages`);

  let totalSuggestions = 0;
  let orphanCount = 0;

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];

    // Skip legal pages and login pages
    if (page.content_type === "legal" || page.path.includes("wp-login") || page.path.includes("wp-content")) {
      continue;
    }

    console.log(`   🔍 [${i + 1}/${pages.length}] ${page.path}`);

    // Find similar pages
    const similar = await findSimilarPages(page.id, siteId, 8, 0.25);

    if (similar.length === 0) continue;

    // Check for orphan pages
    if (page.inbound_link_count === 0) {
      orphanCount++;
    }

    // Generate suggestions for each similar page
    for (const target of similar) {
      // Skip if link already exists
      if (linkAlreadyExists(page.outbound_links || [], target.url)) continue;

      // Skip self-links and same content type with low similarity
      if (target.page_id === page.id) continue;

      // Calculate relevance score (similarity adjusted by content type pairing)
      const typeMultiplier = LINK_RELEVANCE[page.content_type]?.[target.content_type] ?? 0.7;
      const relevanceScore = target.similarity * typeMultiplier;

      // Skip low-relevance suggestions
      if (relevanceScore < 0.25) continue;

      // Determine confidence
      let confidence: "low" | "medium" | "high" = "low";
      if (relevanceScore >= 0.6) confidence = "high";
      else if (relevanceScore >= 0.4) confidence = "medium";

      // Generate anchor text
      const anchorText = generateAnchorText(target.title || "", target.path, target.content_type);

      // Find where in the source page the link could go
      const contextSnippet = findContextSnippet(
        page.body_text || "",
        target.title || "",
        target.path.split(/[-/]/).filter((w: string) => w.length > 3)
      );

      // Determine reason
      let reason = "Semantically similar content";
      if (page.inbound_link_count === 0) reason = "Orphan page rescue — this page has no inbound links";
      else if (target.content_type === "tour" && page.content_type === "destination")
        reason = "Destination → Tour connection";
      else if (target.content_type === "destination" && page.content_type === "blog")
        reason = "Blog → Destination reference";
      else if (target.similarity > 0.7) reason = "Highly related content";

      // Insert suggestion
      const { error: insertError } = await supabase.from("link_suggestions").upsert(
        {
          site_id: siteId,
          source_page_id: page.id,
          target_page_id: target.page_id,
          anchor_text: anchorText,
          context_snippet: contextSnippet,
          similarity_score: Math.round(target.similarity * 1000) / 1000,
          relevance_score: Math.round(relevanceScore * 1000) / 1000,
          confidence,
          reason,
          status: "pending",
        },
        { onConflict: "source_page_id,target_page_id" }
      );

      if (!insertError) totalSuggestions++;
    }

    if (onProgress) onProgress(i + 1, pages.length);
  }

  console.log(`\n✅ Link suggestions complete`);
  console.log(`   Suggestions generated: ${totalSuggestions}`);
  console.log(`   Orphan pages found: ${orphanCount}`);

  return { suggestions: totalSuggestions, orphans: orphanCount };
}

// ─── Detect keyword cannibalization ──────────────────────────────
export async function detectCannibalization(
  siteId: string
): Promise<{ page_a: string; page_b: string; similarity: number; paths: [string, string] }[]> {
  // Get all pages with embeddings
  const { data: pages } = await supabase
    .from("pages")
    .select("id, path, title, content_type")
    .eq("site_id", siteId)
    .gt("word_count", 100);

  if (!pages || pages.length < 2) return [];

  const cannibalized: { page_a: string; page_b: string; similarity: number; paths: [string, string] }[] = [];

  // Check each page against others for very high similarity (>0.85)
  for (const page of pages) {
    const similar = await findSimilarPages(page.id, siteId, 3, 0.8);

    for (const match of similar) {
      // Same content type + very high similarity = potential cannibalization
      if (match.content_type === page.content_type && match.similarity > 0.8) {
        // Avoid duplicates (A→B and B→A)
        const key = [page.id, match.page_id].sort().join("-");
        if (!cannibalized.some((c) => [c.page_a, c.page_b].sort().join("-") === key)) {
          cannibalized.push({
            page_a: page.id,
            page_b: match.page_id,
            similarity: match.similarity,
            paths: [page.path, match.path],
          });
        }
      }
    }
  }

  return cannibalized;
}
