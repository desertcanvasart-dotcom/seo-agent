"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createSite,
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
        redirect(`/sites/${existing.id}`);
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

  redirect(`/sites/${siteId}`);
}

// ─── Run full pipeline on a site ─────────────────────────────────
export async function runAuditAction(formData: FormData) {
  const siteId = formData.get("siteId") as string;
  await startAudit(siteId);
  revalidatePath(`/sites/${siteId}`);
}

export async function runEmbedAction(formData: FormData) {
  const siteId = formData.get("siteId") as string;
  await startEmbed(siteId);
  revalidatePath(`/sites/${siteId}`);
}

export async function runLinkGenerationAction(formData: FormData) {
  const siteId = formData.get("siteId") as string;
  await startLinkGeneration(siteId);
  revalidatePath("/links");
}

// ─── Approve / Reject link suggestions ───────────────────────────
export async function approveAction(formData: FormData) {
  const siteId = formData.get("siteId") as string;
  const suggestionId = formData.get("suggestionId") as string;
  await approveSuggestion(siteId, suggestionId);
  revalidatePath("/links");
}

export async function rejectAction(formData: FormData) {
  const siteId = formData.get("siteId") as string;
  const suggestionId = formData.get("suggestionId") as string;
  await rejectSuggestion(siteId, suggestionId);
  revalidatePath("/links");
}

// ─── Research ────────────────────────────────────────────────────
export async function startResearchAction(formData: FormData) {
  const siteId = formData.get("siteId") as string;
  const urls = formData.get("competitorUrls") as string;
  const keyword = formData.get("keyword") as string;

  const competitorUrls = urls.split("\n").map((u) => u.trim()).filter(Boolean);
  if (competitorUrls.length === 0) throw new Error("At least one competitor URL is required");

  await startResearch(siteId, competitorUrls, keyword || undefined);
  revalidatePath("/research");
}

// ─── Briefs ──────────────────────────────────────────────────────
export async function createBriefAction(formData: FormData) {
  const siteId = formData.get("siteId") as string;
  const keyword = formData.get("keyword") as string;
  if (!keyword) throw new Error("Keyword is required");

  await createBrief(siteId, keyword);
  revalidatePath("/briefs");
}

export async function generateDraftAction(formData: FormData) {
  const siteId = formData.get("siteId") as string;
  const briefId = formData.get("briefId") as string;
  await generateDraft(siteId, briefId);
  revalidatePath(`/briefs/${briefId}`);
}
