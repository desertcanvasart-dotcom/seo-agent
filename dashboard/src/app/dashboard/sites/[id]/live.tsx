"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { deleteSiteAction, runAuditAction, reCrawlAction } from "@/lib/actions";
import { startEmbed } from "@/lib/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/v1";
const API_KEY = process.env.NEXT_PUBLIC_API_KEY || "";

async function fetchStatus(siteId: string) {
  const h = { Authorization: `Bearer ${API_KEY}`, "Content-Type": "application/json" };
  const [crawl, audit, suggestions] = await Promise.all([
    fetch(`${API_URL}/sites/${siteId}/crawl/status`, { headers: h, cache: "no-store" }).then(r => r.ok ? r.json() : null).catch(() => null),
    fetch(`${API_URL}/sites/${siteId}/audit`, { headers: h, cache: "no-store" }).then(r => r.ok ? r.json() : null).catch(() => null),
    fetch(`${API_URL}/sites/${siteId}/links/suggestions?status=pending&limit=1`, { headers: h, cache: "no-store" }).then(r => r.ok ? r.json() : null).catch(() => null),
  ]);
  return {
    crawl,
    audit: audit?.summary || null,
    suggestions: suggestions?.total || 0,
    analyzed: !!suggestions?.analyzed,
  };
}

export default function SiteLive({ siteId, initialSite, initialCrawl, initialAudit, initialSuggestions, initialAnalyzed, initialBriefs }: any) {
  const [crawl, setCrawl] = useState(initialCrawl);
  const [audit, setAudit] = useState(initialAudit);
  const [suggestions, setSuggestions] = useState(initialSuggestions);
  const [analyzed, setAnalyzed] = useState<boolean>(!!initialAnalyzed);
  const [polling, setPolling] = useState(true);
  // linkStatus derives from persisted `analyzed` (server-backed) so it survives reloads.
  const [linkStatus, setLinkStatus] = useState<"idle" | "running" | "done">(
    initialAnalyzed || initialSuggestions > 0 ? "done" : "idle"
  );

  const done = crawl?.crawl_status === "completed";
  const running = crawl?.crawl_status === "crawling";
  const failed = crawl?.crawl_status === "failed";
  const hasAudit = audit?.pages_audited > 0;

  const poll = useCallback(async () => {
    const d = await fetchStatus(siteId);
    if (d.crawl) setCrawl(d.crawl);
    if (d.audit) setAudit(d.audit);
    setSuggestions(d.suggestions);
    setAnalyzed(d.analyzed);

    // If analysis has completed on the server (embeddings exist), mark done.
    if (d.analyzed && linkStatus !== "done") {
      setLinkStatus("done");
    }

    // Stop polling when crawl and audit are done and not running link analysis
    if (d.crawl?.crawl_status === "completed" && d.audit?.pages_audited > 0 && linkStatus !== "running") {
      setPolling(false);
    }
  }, [siteId, linkStatus]);

  useEffect(() => {
    if (!polling) return;
    const i = setInterval(poll, 4000);
    return () => clearInterval(i);
  }, [poll, polling]);

  // Handle Analyze click — fire and forget with a 2-minute auto-complete
  async function handleAnalyze() {
    setLinkStatus("running");
    setPolling(true);
    try {
      await startEmbed(siteId);
    } catch {}

    // Auto-mark done after 2 minutes regardless (handles 0-suggestion case)
    setTimeout(() => {
      setLinkStatus((prev) => prev === "running" ? "done" : prev);
    }, 120000);
  }

  return (
    <div>
      {/* Pipeline */}
      <div className="bg-white border border-[#e8e5e0] rounded-2xl p-6 mb-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-sm font-semibold text-[#1a1a1a]">Analysis Pipeline</h2>
          {(running || linkStatus === "running") && <span className="text-xs text-[#b8860b] animate-pulse">Updating live...</span>}
        </div>
        <div className="space-y-4">
          {/* Step 1: Crawl */}
          <Step n={1} title="Crawl Pages"
            desc={done ? `${crawl.pages_crawled} pages found` : running ? `Crawling... ${crawl?.pages_crawled || 0} pages` : failed ? "Crawl failed" : "Waiting"}
            status={done ? "done" : running ? "running" : failed ? "failed" : "pending"}
            action={failed ? <form action={reCrawlAction}><input type="hidden" name="siteId" value={siteId} /><button className="text-xs bg-[#2d5a3d] text-white px-3 py-1.5 rounded-lg hover:bg-[#234a31]">Retry</button></form> : undefined}
          />
          {running && <ProgressBar value={crawl?.pages_crawled || 0} max={100} />}

          {/* Step 2: Audit */}
          <Step n={2} title="SEO & GEO Audit"
            desc={hasAudit ? `${audit.pages_audited} pages scored — SEO: ${audit.avg_seo_score}, GEO: ${audit.avg_geo_score}` : "Score every page"}
            status={hasAudit ? "done" : "pending"}
            action={done && !hasAudit ? <form action={runAuditAction}><input type="hidden" name="siteId" value={siteId} /><button className="text-xs bg-[#2d5a3d] text-white px-3 py-1.5 rounded-lg hover:bg-[#234a31]">Run Audit</button></form> : undefined}
          />

          {/* Step 3: Link Analysis */}
          <Step n={3} title="Internal Link Analysis"
            desc={
              suggestions > 0
                ? `${suggestions} link suggestions found`
                : linkStatus === "running"
                  ? "Embedding pages and finding link opportunities..."
                  : analyzed || linkStatus === "done"
                    ? "Analysis complete — no new link opportunities found"
                    : "Find missing links with AI"
            }
            status={suggestions > 0 || analyzed || linkStatus === "done" ? "done" : linkStatus === "running" ? "running" : "pending"}
            action={hasAudit && suggestions === 0 && !analyzed && linkStatus === "idle" ? (
              <button onClick={handleAnalyze} className="text-xs bg-[#2d5a3d] text-white px-3 py-1.5 rounded-lg hover:bg-[#234a31]">
                Analyze
              </button>
            ) : undefined}
          />
          {linkStatus === "running" && <ProgressBar value={-1} max={100} indeterminate />}
        </div>
      </div>

      {/* Scores */}
      {hasAudit && (
        <>
          <div className="grid grid-cols-4 gap-4 mb-6">
            <Score label="SEO" value={audit.avg_seo_score} />
            <Score label="GEO" value={audit.avg_geo_score} />
            <Score label="Critical" value={audit.critical_issues} type="issues" />
            <Score label="Briefs" value={initialBriefs} type="neutral" />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <QuickLink href={`/dashboard/sites/${siteId}/audit`} title="View Audit" desc={`${audit.pages_audited} pages`} color="#2d5a3d" />
            <QuickLink href={`/dashboard/sites/${siteId}/links`} title="Link Suggestions" desc={`${suggestions} pending`} color="#1a73e8" />
            <QuickLink href={`/dashboard/sites/${siteId}/research`} title="Research" desc="Competitor gaps" color="#9334e8" />
          </div>
        </>
      )}

      {/* Delete */}
      <div className="mt-8 pt-6 border-t border-[#e8e5e0]">
        <form action={deleteSiteAction}>
          <input type="hidden" name="siteId" value={siteId} />
          <button className="text-xs text-[#c5221f] hover:text-[#a31b15] transition-colors">Delete this project</button>
        </form>
      </div>
    </div>
  );
}

function ProgressBar({ value, max, indeterminate }: { value: number; max: number; indeterminate?: boolean }) {
  return (
    <div className="ml-12">
      <div className="w-full bg-[#f1f3f4] rounded-full h-1.5 overflow-hidden">
        {indeterminate ? (
          <div className="h-1.5 rounded-full bg-[#2d5a3d] w-1/3 animate-[slide_1.5s_ease-in-out_infinite]" />
        ) : (
          <div className="h-1.5 rounded-full bg-[#b8860b] transition-all duration-500" style={{ width: `${Math.min((value / max) * 100, 95)}%` }} />
        )}
      </div>
      <style>{`@keyframes slide { 0% { transform: translateX(-100%); } 100% { transform: translateX(400%); } }`}</style>
    </div>
  );
}

function Step({ n, title, desc, status, action }: { n: number; title: string; desc: string; status: "done" | "running" | "pending" | "failed"; action?: React.ReactNode }) {
  const bg = status === "done" ? "bg-[#2d5a3d] text-white" : status === "running" ? "bg-[#f9ab00] text-white" : status === "failed" ? "bg-[#ea4335] text-white" : "bg-[#f1f3f4] text-[#8c8c8c]";
  const icon = status === "done" ? <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
    : status === "running" ? <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
    : status === "failed" ? <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
    : <span className="text-xs font-bold">{n}</span>;
  return (
    <div className="flex items-center gap-4">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${bg}`}>{icon}</div>
      <div className="flex-1"><p className="text-sm font-medium text-[#1a1a1a]">{title}</p><p className="text-xs text-[#8c8c8c]">{desc}</p></div>
      {action}
    </div>
  );
}

function Score({ label, value, type = "score" }: { label: string; value: number; type?: string }) {
  const color = type === "issues" ? (value > 0 ? "#ea4335" : "#2d5a3d") : type === "neutral" ? "#1a1a1a" : (value >= 70 ? "#2d5a3d" : value >= 40 ? "#f9ab00" : "#ea4335");
  return (
    <div className="bg-white border border-[#e8e5e0] rounded-2xl p-5 text-center">
      <p className="text-3xl font-semibold tabular-nums" style={{ color }}>{value}</p>
      <p className="text-[10px] text-[#8c8c8c] uppercase tracking-wider mt-1">{label}</p>
    </div>
  );
}

function QuickLink({ href, title, desc, color }: { href: string; title: string; desc: string; color: string }) {
  return (
    <Link href={href} className="bg-white border border-[#e8e5e0] rounded-2xl p-4 hover:border-[#2d5a3d]/30 hover:shadow-sm transition-all flex items-center gap-3">
      <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: color + "15" }}>
        <div className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
      </div>
      <div>
        <p className="text-sm font-medium text-[#1a1a1a]">{title}</p>
        <p className="text-xs text-[#8c8c8c]">{desc}</p>
      </div>
    </Link>
  );
}
