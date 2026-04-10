const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/v1";
const API_KEY = process.env.NEXT_PUBLIC_API_KEY || "";

async function apiFetch(path: string, options?: RequestInit) {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
      ...options?.headers,
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || "API error");
  }

  return res.json();
}

export async function getSites() {
  return apiFetch("/sites");
}

export async function getSite(siteId: string) {
  return apiFetch(`/sites/${siteId}`);
}

export async function getAudit(siteId: string) {
  return apiFetch(`/sites/${siteId}/audit`);
}

export async function getSuggestions(siteId: string, status = "pending") {
  return apiFetch(`/sites/${siteId}/links/suggestions?status=${status}&limit=100`);
}

export async function approveSuggestion(siteId: string, suggestionId: string) {
  return apiFetch(`/sites/${siteId}/links/suggestions/${suggestionId}/approve`, { method: "POST" });
}

export async function rejectSuggestion(siteId: string, suggestionId: string) {
  return apiFetch(`/sites/${siteId}/links/suggestions/${suggestionId}/reject`, { method: "POST" });
}

export async function getBriefs(siteId: string) {
  return apiFetch(`/sites/${siteId}/briefs`);
}

export async function getBrief(siteId: string, briefId: string) {
  return apiFetch(`/sites/${siteId}/briefs/${briefId}`);
}

export async function getResearchJobs(siteId: string) {
  return apiFetch(`/sites/${siteId}/research`);
}

export async function getResearchGaps(siteId: string, jobId: string) {
  return apiFetch(`/sites/${siteId}/research/${jobId}/gaps`);
}

export async function startCrawl(siteId: string) {
  return apiFetch(`/sites/${siteId}/crawl`, {
    method: "POST",
    body: JSON.stringify({ max_pages: 100, max_depth: 3, delay_ms: 800, respect_robots: false, use_js_rendering: true }),
  });
}

export async function startAudit(siteId: string) {
  return apiFetch(`/sites/${siteId}/audit`, { method: "POST" });
}

export async function getCrawlStatus(siteId: string) {
  return apiFetch(`/sites/${siteId}/crawl/status`);
}

export async function createSite(domain: string, name?: string) {
  return apiFetch("/sites", {
    method: "POST",
    body: JSON.stringify({ domain, name }),
  });
}

export async function deleteSite(siteId: string) {
  // Delete is outside /v1 prefix due to Hono routing constraints
  const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/v1").replace("/v1", "");
  const API_KEY = process.env.NEXT_PUBLIC_API_KEY || "";
  const res = await fetch(`${API_BASE}/delete-site/${siteId}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${API_KEY}`, "Content-Type": "application/json" },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || "Delete failed");
  }
  return res.json();
}

export async function startEmbed(siteId: string) {
  return apiFetch(`/sites/${siteId}/links/embed`, { method: "POST" });
}

export async function startLinkGeneration(siteId: string) {
  return apiFetch(`/sites/${siteId}/links/generate`, { method: "POST" });
}

export async function startResearch(siteId: string, competitorUrls: string[], keyword?: string) {
  return apiFetch(`/sites/${siteId}/research`, {
    method: "POST",
    body: JSON.stringify({ competitor_urls: competitorUrls, keyword }),
  });
}

export async function createBrief(siteId: string, targetKeyword: string) {
  return apiFetch(`/sites/${siteId}/briefs`, {
    method: "POST",
    body: JSON.stringify({ target_keyword: targetKeyword }),
  });
}

export async function generateDraft(siteId: string, briefId: string) {
  return apiFetch(`/sites/${siteId}/briefs/${briefId}/draft`, { method: "POST" });
}

export async function getFixes(siteId: string, type?: string, status?: string) {
  let path = `/sites/${siteId}/generate/fixes?`;
  if (type) path += `type=${type}&`;
  if (status) path += `status=${status}&`;
  return apiFetch(path);
}

export async function runAllGenerators(siteId: string) {
  return apiFetch(`/sites/${siteId}/generate/all`, { method: "POST" });
}

export async function approveFix(siteId: string, fixId: string) {
  return apiFetch(`/sites/${siteId}/generate/fixes/${fixId}`, {
    method: "PATCH",
    body: JSON.stringify({ status: "approved" }),
  });
}

export async function dismissFix(siteId: string, fixId: string) {
  return apiFetch(`/sites/${siteId}/generate/fixes/${fixId}`, {
    method: "PATCH",
    body: JSON.stringify({ status: "dismissed" }),
  });
}
