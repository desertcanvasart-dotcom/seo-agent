"use client";

import { useActionState } from "react";
import { addSiteAction } from "@/lib/actions";

export default function NewSitePage() {
  const [state, formAction, pending] = useActionState(addSiteAction, null);

  return (
    <div className="max-w-xl mx-auto mt-8">
      <h1 className="text-xl font-semibold mb-1">New Project</h1>
      <p className="text-sm text-[var(--text-secondary)] mb-6">
        Enter a website URL to start a full SEO &amp; GEO analysis.
      </p>

      {state?.error && (
        <div className="flex items-center gap-2 p-3 mb-4 rounded-lg bg-[var(--red-light)] text-[var(--red)] text-sm">
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {state.error}
        </div>
      )}

      <div className="card">
        <div className="card-body">
          <form action={formAction} className="space-y-4">
            <div>
              <label htmlFor="url" className="block text-sm font-medium mb-1.5">Website URL</label>
              <input
                type="text"
                id="url"
                name="url"
                placeholder="https://example.com"
                required
                disabled={pending}
                className="input"
              />
            </div>

            <button type="submit" disabled={pending} className="btn btn-primary w-full py-3">
              {pending ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Analyzing...
                </>
              ) : (
                "Start Analysis"
              )}
            </button>
          </form>
        </div>
      </div>

      <div className="card mt-6">
        <div className="card-body">
          <h3 className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)] mb-4">What we analyze</h3>
          <div className="grid grid-cols-2 gap-4">
            {[
              { title: "Page Crawl", desc: "Discover all pages with a real browser", color: "var(--accent)" },
              { title: "SEO Audit", desc: "Title, meta, headings, content quality", color: "var(--green)" },
              { title: "GEO Score", desc: "AI citability, schema, E-E-A-T signals", color: "var(--purple)" },
              { title: "Internal Links", desc: "Find missing link opportunities with AI", color: "var(--yellow)" },
            ].map((item) => (
              <div key={item.title} className="flex gap-3">
                <div className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ background: item.color }} />
                <div>
                  <p className="text-sm font-medium">{item.title}</p>
                  <p className="text-xs text-[var(--text-muted)]">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
