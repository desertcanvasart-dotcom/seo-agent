const endpoints = [
  {
    group: "Sites",
    routes: [
      { method: "GET", path: "/v1/sites", desc: "List all sites" },
      { method: "POST", path: "/v1/sites", desc: "Register a new site", body: '{ "domain": "example.com" }' },
      { method: "GET", path: "/v1/sites/:id", desc: "Get site details" },
    ],
  },
  {
    group: "Crawling",
    routes: [
      { method: "POST", path: "/v1/sites/:id/crawl", desc: "Start crawling a site", body: '{ "max_pages": 100, "max_depth": 3, "use_js_rendering": true, "auto_pipeline": true }' },
      { method: "GET", path: "/v1/sites/:id/crawl/status", desc: "Check crawl progress" },
    ],
  },
  {
    group: "Audit",
    routes: [
      { method: "POST", path: "/v1/sites/:id/audit", desc: "Run SEO & GEO audit on all pages" },
      { method: "GET", path: "/v1/sites/:id/audit", desc: "Get audit results with scores" },
    ],
  },
  {
    group: "Pages",
    routes: [
      { method: "GET", path: "/v1/sites/:id/pages", desc: "List all crawled pages (paginated)" },
      { method: "GET", path: "/v1/sites/:id/pages/:pageId", desc: "Get full page details" },
    ],
  },
  {
    group: "Internal Links",
    routes: [
      { method: "POST", path: "/v1/sites/:id/links/embed", desc: "Generate embeddings for pages" },
      { method: "POST", path: "/v1/sites/:id/links/generate", desc: "Generate link suggestions" },
      { method: "GET", path: "/v1/sites/:id/links/suggestions", desc: "List pending suggestions" },
      { method: "POST", path: "/v1/sites/:id/links/suggestions/:sid/approve", desc: "Approve a suggestion" },
      { method: "POST", path: "/v1/sites/:id/links/suggestions/:sid/reject", desc: "Reject a suggestion" },
      { method: "GET", path: "/v1/sites/:id/links/cannibalization", desc: "Detect keyword cannibalization" },
    ],
  },
  {
    group: "Research",
    routes: [
      { method: "POST", path: "/v1/sites/:id/research", desc: "Start competitor research", body: '{ "competitor_urls": ["https://..."], "keyword": "..." }' },
      { method: "GET", path: "/v1/sites/:id/research", desc: "List research jobs" },
      { method: "GET", path: "/v1/sites/:id/research/:jobId/gaps", desc: "Get content gaps" },
    ],
  },
  {
    group: "Content Briefs",
    routes: [
      { method: "POST", path: "/v1/sites/:id/briefs", desc: "Generate a content brief", body: '{ "target_keyword": "..." }' },
      { method: "GET", path: "/v1/sites/:id/briefs", desc: "List all briefs" },
      { method: "GET", path: "/v1/sites/:id/briefs/:briefId", desc: "Get full brief" },
      { method: "POST", path: "/v1/sites/:id/briefs/:briefId/draft", desc: "Generate AI draft" },
    ],
  },
  {
    group: "Google Search Console",
    routes: [
      { method: "POST", path: "/v1/sites/:id/gsc/sync", desc: "Sync GSC data", body: '{ "client_email": "...", "private_key": "..." }' },
      { method: "GET", path: "/v1/sites/:id/gsc", desc: "Get GSC metrics" },
    ],
  },
  {
    group: "Export",
    routes: [
      { method: "GET", path: "/v1/sites/:id/export/audit.csv", desc: "Download audit as CSV" },
      { method: "GET", path: "/v1/sites/:id/export/links.csv", desc: "Download links as CSV" },
      { method: "GET", path: "/v1/sites/:id/export/briefs.csv", desc: "Download briefs as CSV" },
    ],
  },
  {
    group: "Schedule & History",
    routes: [
      { method: "POST", path: "/v1/sites/:id/schedule/recrawl", desc: "Trigger full re-crawl + audit" },
      { method: "GET", path: "/v1/sites/:id/schedule/history", desc: "Get score history" },
    ],
  },
  {
    group: "Embed",
    routes: [
      { method: "GET", path: "/embed/snippet.js", desc: "Get the JS embed snippet" },
    ],
  },
];

function MethodBadge({ method }: { method: string }) {
  const colors: Record<string, string> = {
    GET: "bg-[var(--green-light)] text-[var(--green)]",
    POST: "bg-[var(--accent-light)] text-[var(--accent)]",
    DELETE: "bg-[var(--red-light)] text-[var(--red)]",
  };
  return <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${colors[method] || "bg-[#f1f3f4] text-[var(--text-muted)]"}`}>{method}</span>;
}

export default function DocsPage() {
  return (
    <div>
      <h1 className="text-xl font-semibold mb-1">API Documentation</h1>
      <p className="text-sm text-[var(--text-secondary)] mb-2">Base URL: <code className="font-mono text-xs bg-[#f1f3f4] px-1.5 py-0.5 rounded">http://localhost:8000</code></p>
      <p className="text-sm text-[var(--text-secondary)] mb-6">Auth: <code className="font-mono text-xs bg-[#f1f3f4] px-1.5 py-0.5 rounded">Authorization: Bearer YOUR_API_KEY</code></p>

      {/* Embed snippet example */}
      <div className="card mb-6">
        <div className="card-body">
          <h2 className="text-sm font-semibold mb-2">JS Embed Snippet</h2>
          <p className="text-xs text-[var(--text-secondary)] mb-3">Add this to any website to auto-report pages to SEO Agent:</p>
          <pre className="bg-[#1a1a2e] text-[#e2e8f0] text-xs p-4 rounded-lg overflow-x-auto font-mono">
{`<script src="https://YOUR_API_HOST/embed/snippet.js"
  data-key="YOUR_API_KEY"
  data-site="YOUR_SITE_ID">
</script>`}
          </pre>
        </div>
      </div>

      {/* Endpoints */}
      <div className="space-y-6">
        {endpoints.map((group) => (
          <div key={group.group} className="card">
            <div className="card-body pb-0">
              <h2 className="text-sm font-semibold mb-3">{group.group}</h2>
            </div>
            <table>
              <tbody>
                {group.routes.map((route, i) => (
                  <tr key={i}>
                    <td className="w-16"><MethodBadge method={route.method} /></td>
                    <td><code className="font-mono text-xs">{route.path}</code></td>
                    <td className="text-xs text-[var(--text-secondary)]">{route.desc}</td>
                    <td className="text-right">
                      {route.body && (
                        <code className="font-mono text-[10px] text-[var(--text-muted)] bg-[#f1f3f4] px-1.5 py-0.5 rounded">{route.body}</code>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </div>
  );
}
