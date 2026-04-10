"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createSite,
  deleteSite,
  getSites,
  startCrawl,
  startAudit,
  startEmbed,
  startLinkGeneration,
  approveSuggestion,
  rejectSuggestion,
  startResearch,
  createBrief,
  generateDraft,
  runAllGenerators,
  approveFix,
  dismissFix,
} from "./api";

// ─── Add a new site and start crawling ───────────────────────────
export async function addSiteAction(_prevState: any, formData: FormData) {
  const url = formData.get("url") as string;
  if (!url) return { error: "URL is required" };

  // Clean the URL to extract domain
  let domain = url.replace(/^https?:\/\//, "").replace(/\/$/, "");
  domain = domain.split("/")[0];

  let siteId: string;

  try {
    const result = await createSite(domain);
    siteId = result.site.id;
  } catch (err: any) {
    // If site already exists, find it and redirect to it
    if (err.message?.includes("already registered")) {
      const sitesData = await getSites();
      const existing = sitesData.sites.find((s: any) => s.domain === domain);
      if (existing) {
        redirect(`/dashboard/sites/${existing.id}`);
      }
    }
    return { error: err.message || "Failed to create site" };
  }

  // Auto-start crawl
  try {
    await startCrawl(siteId);
  } catch {
    // Crawl might fail to start, still redirect to site page
  }

  redirect(`/dashboard/sites/${siteId}`);
}

// ─── Delete a site ───────────────────────────────────────────────
export async function deleteSiteAction(formData: FormData) {
  const siteId = formData.get("siteId") as string;
  await deleteSite(siteId);
  revalidatePath("/dashboard");
  redirect("/dashboard");
}

// ─── Re-crawl a site ─────────────────────────────────────────────
export async function reCrawlAction(formData: FormData) {
  const siteId = formData.get("siteId") as string;
  await startCrawl(siteId);
  revalidatePath(`/dashboard/sites/${siteId}`);
}

// ─── Run full pipeline on a site ─────────────────────────────────
export async function runAuditAction(formData: FormData) {
  const siteId = formData.get("siteId") as string;
  await startAudit(siteId);
  revalidatePath(`/dashboard/sites/${siteId}`);
}

export async function runEmbedAction(formData: FormData) {
  const siteId = formData.get("siteId") as string;
  // Start embed — this runs in background on the API
  await startEmbed(siteId);
  // Wait a bit for embeddings to start, then trigger link generation
  // The API runs these in background, so we fire both
  await startLinkGeneration(siteId).catch(() => {});
  revalidatePath(`/dashboard/sites/${siteId}`);
  revalidatePath(`/dashboard/sites/${siteId}/links`);
}

export async function runLinkGenerationAction(formData: FormData) {
  const siteId = formData.get("siteId") as string;
  await startLinkGeneration(siteId);
  revalidatePath(`/dashboard/sites/${siteId}`);
  revalidatePath(`/dashboard/sites/${siteId}/links`);
}

// ─── Approve / Reject link suggestions ───────────────────────────
export async function approveAction(formData: FormData) {
  const siteId = formData.get("siteId") as string;
  const suggestionId = formData.get("suggestionId") as string;
  await approveSuggestion(siteId, suggestionId);
  revalidatePath(`/dashboard/sites/${siteId}/links`);
}

export async function rejectAction(formData: FormData) {
  const siteId = formData.get("siteId") as string;
  const suggestionId = formData.get("suggestionId") as string;
  await rejectSuggestion(siteId, suggestionId);
  revalidatePath(`/dashboard/sites/${siteId}/links`);
}

// ─── Research ────────────────────────────────────────────────────
export async function startResearchAction(formData: FormData) {
  const siteId = formData.get("siteId") as string;
  const urls = formData.get("competitorUrls") as string;
  const keyword = formData.get("keyword") as string;

  const competitorUrls = urls.split("\n").map((u) => u.trim()).filter(Boolean);
  if (competitorUrls.length === 0) throw new Error("At least one competitor URL is required");

  await startResearch(siteId, competitorUrls, keyword || undefined);
  revalidatePath(`/dashboard/sites/${siteId}/research`);
}

// ─── Briefs ──────────────────────────────────────────────────────
export async function createBriefAction(formData: FormData) {
  const siteId = formData.get("siteId") as string;
  const keyword = formData.get("keyword") as string;
  if (!keyword) throw new Error("Keyword is required");

  await createBrief(siteId, keyword);
  revalidatePath(`/dashboard/sites/${siteId}/briefs`);
}

export async function generateDraftAction(formData: FormData) {
  const siteId = formData.get("siteId") as string;
  const briefId = formData.get("briefId") as string;
  await generateDraft(siteId, briefId);
  revalidatePath(`/dashboard/sites/${siteId}/briefs/${briefId}`);
}

// ─── Fixes ───────────────────────────────────────────────────────
export async function runGeneratorsAction(formData: FormData) {
  const siteId = formData.get("siteId") as string;
  await runAllGenerators(siteId);
  revalidatePath(`/dashboard/sites/${siteId}/fixes`);
}

export async function approveFixAction(formData: FormData) {
  const siteId = formData.get("siteId") as string;
  const fixId = formData.get("fixId") as string;
  await approveFix(siteId, fixId);
  revalidatePath(`/dashboard/sites/${siteId}/fixes`);
}

export async function dismissFixAction(formData: FormData) {
  const siteId = formData.get("siteId") as string;
  const fixId = formData.get("fixId") as string;
  await dismissFix(siteId, fixId);
  revalidatePath(`/dashboard/sites/${siteId}/fixes`);
}
