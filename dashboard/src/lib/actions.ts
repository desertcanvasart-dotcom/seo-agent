"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createSite,
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
export async function addSiteAction(formData: FormData) {
  const url = formData.get("url") as string;
  if (!url) throw new Error("URL is required");

  // Clean the URL to extract domain
  let domain = url.replace(/^https?:\/\//, "").replace(/\/$/, "");
  // Remove path if any
  domain = domain.split("/")[0];

  const result = await createSite(domain);
  const siteId = result.site.id;

  // Auto-start crawl
  await startCrawl(siteId);

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
