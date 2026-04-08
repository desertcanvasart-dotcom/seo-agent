import { addSiteAction } from "@/lib/actions";

export default function NewSitePage() {
  return (
    <div className="max-w-lg mx-auto mt-12">
      <h1 className="text-2xl font-semibold tracking-tight mb-2">Add a Website</h1>
      <p className="text-sm text-[#888] mb-8">
        Paste your website URL. We&apos;ll crawl every page, audit SEO &amp; GEO health, find internal linking opportunities, and generate content briefs.
      </p>

      <form action={addSiteAction} className="space-y-4">
        <div>
          <label htmlFor="url" className="block text-sm font-medium mb-1.5">
            Website URL
          </label>
          <input
            type="text"
            id="url"
            name="url"
            placeholder="https://example.com"
            required
            className="w-full px-4 py-3 border rounded-lg text-sm focus:outline-none focus:border-[#111] transition-colors"
          />
          <p className="text-xs text-[#aaa] mt-1.5">
            Enter the homepage URL. We&apos;ll discover all pages automatically.
          </p>
        </div>

        <button
          type="submit"
          className="w-full py-3 bg-[#111] text-white text-sm font-medium rounded-lg hover:bg-[#333] transition-colors"
        >
          Start Analysis
        </button>
      </form>

      <div className="mt-8 border rounded-lg p-4">
        <h3 className="text-xs font-medium uppercase tracking-wider text-[#888] mb-3">What happens next</h3>
        <ol className="space-y-2 text-sm text-[#666]">
          <li className="flex gap-3">
            <span className="text-[#22c55e] font-mono text-xs mt-0.5">1.</span>
            <span>Crawl all pages on your site (uses a real browser for JS sites)</span>
          </li>
          <li className="flex gap-3">
            <span className="text-[#22c55e] font-mono text-xs mt-0.5">2.</span>
            <span>Audit every page for SEO &amp; GEO health</span>
          </li>
          <li className="flex gap-3">
            <span className="text-[#22c55e] font-mono text-xs mt-0.5">3.</span>
            <span>Find internal linking opportunities using AI</span>
          </li>
          <li className="flex gap-3">
            <span className="text-[#22c55e] font-mono text-xs mt-0.5">4.</span>
            <span>Show you exactly what to fix, with priorities</span>
          </li>
        </ol>
      </div>
    </div>
  );
}
