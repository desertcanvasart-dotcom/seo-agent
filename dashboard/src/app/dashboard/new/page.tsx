"use client";

import { useActionState } from "react";
import { addSiteAction } from "@/lib/actions";

export default function NewProjectPage() {
  const [state, formAction, pending] = useActionState(addSiteAction, null);

  return (
    <div className="max-w-xl mx-auto mt-4">
      <h1 className="text-xl font-semibold text-[#1a1a1a] mb-1">New Project</h1>
      <p className="text-sm text-[#5c5c5c] mb-6">
        Enter a website URL. We&apos;ll crawl, audit, analyze links, and generate briefs automatically.
      </p>

      {state?.error && (
        <div className="flex items-center gap-2 p-3 mb-4 rounded-lg bg-[#fce8e6] text-[#c5221f] text-sm">
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {state.error}
        </div>
      )}

      <div className="bg-white border border-[#e8e5e0] rounded-2xl p-6">
        <form action={formAction} className="space-y-4">
          <div>
            <label htmlFor="url" className="block text-sm font-medium text-[#1a1a1a] mb-1.5">Website URL</label>
            <input
              type="text" id="url" name="url" placeholder="https://example.com" required disabled={pending}
              className="w-full px-4 py-3 border border-[#e8e5e0] rounded-xl text-sm focus:outline-none focus:border-[#2d5a3d] focus:ring-2 focus:ring-[#2d5a3d]/10 transition disabled:opacity-50"
            />
          </div>
          <button type="submit" disabled={pending} className="w-full py-3 bg-[#2d5a3d] text-white text-sm font-medium rounded-xl hover:bg-[#234a31] transition-colors disabled:opacity-50">
            {pending ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Analyzing...
              </span>
            ) : "Start Analysis"}
          </button>
        </form>
      </div>

      <div className="bg-white border border-[#e8e5e0] rounded-2xl p-6 mt-4">
        <p className="text-[10px] font-medium text-[#8c8c8c] uppercase tracking-wider mb-4">What happens automatically</p>
        <div className="space-y-3">
          {[
            { n: "1", title: "Crawl", desc: "Discover every page using a real browser" },
            { n: "2", title: "Audit", desc: "Score SEO & GEO health, prioritize fixes" },
            { n: "3", title: "Embed", desc: "Generate AI embeddings for similarity search" },
            { n: "4", title: "Link", desc: "Find missing internal link opportunities" },
          ].map((s) => (
            <div key={s.n} className="flex items-center gap-3">
              <div className="w-7 h-7 bg-[#e8f0e8] rounded-lg flex items-center justify-center text-[#2d5a3d] text-xs font-bold shrink-0">{s.n}</div>
              <div>
                <p className="text-sm font-medium text-[#1a1a1a]">{s.title}</p>
                <p className="text-xs text-[#8c8c8c]">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
