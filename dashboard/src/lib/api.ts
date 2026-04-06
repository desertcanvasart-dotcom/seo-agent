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
