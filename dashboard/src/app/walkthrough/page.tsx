import Link from "next/link";

export default function WalkthroughPage() {
  return (
    <div className="min-h-screen bg-[#fafaf8]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#fafaf8]/80 backdrop-blur-md border-b border-[#eeece8]">
        <div className="max-w-[900px] mx-auto px-6 flex items-center justify-between h-[64px]">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-[#1a3a2a] rounded-xl flex items-center justify-center">
              <svg className="w-4 h-4 text-[#4ade80]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="font-bold text-[15px] text-[#1a1a1a] tracking-tight">SEO Agent</span>
            <span className="text-[12px] text-[#9a9a9a] ml-1">/ Walkthrough</span>
          </Link>
          <Link href="/signup" className="text-[13px] bg-[#1a3a2a] text-white font-medium px-5 py-2 rounded-full hover:bg-[#143020] transition-colors">
            Get Started Free
          </Link>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-[900px] mx-auto px-6 py-16">
        {/* Title */}
        <div className="text-center mb-16">
          <h1 className="text-[40px] font-extrabold text-[#0f0f0f] tracking-tight leading-tight">
            How SEO Agent Works
          </h1>
          <p className="text-[16px] text-[#6b6b6b] mt-4 max-w-[520px] mx-auto leading-relaxed">
            A complete walkthrough from sign up to actionable SEO &amp; GEO insights. Takes about 5 minutes to read.
          </p>
        </div>

        {/* Table of Contents */}
        <div className="bg-white border border-[#eeece8] rounded-2xl p-6 mb-16">
          <p className="text-[11px] font-bold text-[#1a3a2a] uppercase tracking-widest mb-4">In this guide</p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { n: "1", title: "Create Your Account", anchor: "signup" },
              { n: "2", title: "Add Your First Website", anchor: "add-site" },
              { n: "3", title: "Understanding the Crawl", anchor: "crawl" },
              { n: "4", title: "Reading Your SEO & GEO Audit", anchor: "audit" },
              { n: "5", title: "Internal Link Suggestions", anchor: "links" },
              { n: "6", title: "Competitor Research", anchor: "research" },
              { n: "7", title: "Content Briefs", anchor: "briefs" },
              { n: "8", title: "Exporting & API Access", anchor: "export" },
            ].map((item) => (
              <a key={item.n} href={`#${item.anchor}`} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[#f5f3f0] transition-colors">
                <span className="w-6 h-6 bg-[#1a3a2a]/5 rounded-md flex items-center justify-center text-[11px] font-bold text-[#1a3a2a]">{item.n}</span>
                <span className="text-[13px] text-[#3a3a3a] font-medium">{item.title}</span>
              </a>
            ))}
          </div>
        </div>

        {/* Step 1: Sign Up */}
        <Section id="signup" step="1" title="Create Your Account">
          <p>Head to the <Link href="/signup" className="text-[#1a3a2a] font-semibold underline underline-offset-2">signup page</Link> and create a free account with your name, email, and password.</p>
          <p>After signing up, you&apos;ll receive a <strong>confirmation email</strong>. Click the link in the email to activate your account. Once confirmed, you&apos;re automatically logged in and redirected to your dashboard.</p>

          <MockupScreen title="Sign Up Page">
            <div className="space-y-3 max-w-[280px]">
              <MockInput label="Full Name" value="Jane Smith" />
              <MockInput label="Email" value="jane@company.com" />
              <MockInput label="Password" value="••••••••" />
              <div className="bg-[#1a3a2a] text-white text-center py-2.5 rounded-lg text-[12px] font-semibold mt-2">Create Account</div>
            </div>
          </MockupScreen>

          <Tip>Your account comes with a free API key automatically generated. You can find it in your dashboard settings.</Tip>
        </Section>

        {/* Step 2: Add Site */}
        <Section id="add-site" step="2" title="Add Your First Website">
          <p>From your dashboard, click <strong>&quot;New Project&quot;</strong> and paste any website URL. That&apos;s it — just the homepage URL. We discover all other pages automatically.</p>

          <MockupScreen title="Add New Project">
            <div className="max-w-[320px]">
              <div className="text-[11px] font-semibold text-[#1a1a1a] mb-1">Website URL</div>
              <div className="flex gap-2">
                <div className="flex-1 px-3 py-2 bg-[#f5f3f0] border border-[#e0ddd6] rounded-lg text-[12px] text-[#6b6b6b]">https://example.com</div>
              </div>
              <div className="bg-[#1a3a2a] text-white text-center py-2.5 rounded-lg text-[12px] font-semibold mt-3">Start Analysis</div>
            </div>
          </MockupScreen>

          <p>Once you click &quot;Start Analysis&quot;, the system kicks off the <strong>automatic pipeline</strong>:</p>
          <ol className="list-decimal list-inside space-y-2 text-[14px] text-[#4a4a4a]">
            <li><strong>Crawl</strong> — visits every page with a real browser (handles JavaScript sites)</li>
            <li><strong>Audit</strong> — scores each page for SEO &amp; GEO health</li>
            <li><strong>Embed</strong> — generates AI embeddings for similarity search</li>
            <li><strong>Link</strong> — finds missing internal link opportunities</li>
          </ol>
          <p>You can watch this happen in real-time on the project overview page. No need to refresh — it updates automatically every 4 seconds.</p>
        </Section>

        {/* Step 3: Crawl */}
        <Section id="crawl" step="3" title="Understanding the Crawl">
          <p>The crawler uses <strong>Puppeteer</strong> (a real Chrome browser) to visit your site. This means it works even on JavaScript-heavy sites built with React, WordPress + Elementor, Shopify, or any other framework.</p>

          <p>For each page, we extract:</p>
          <FeatureGrid items={[
            { title: "Title & Meta", desc: "Page title, meta description, canonical URL" },
            { title: "Headings", desc: "Full H1-H6 hierarchy structure" },
            { title: "Content", desc: "Body text with word count" },
            { title: "Links", desc: "All outbound links (internal & external)" },
            { title: "Schema", desc: "JSON-LD structured data types" },
            { title: "Status", desc: "HTTP status code, crawl depth" },
          ]} />

          <MockupScreen title="Pipeline Progress">
            <div className="space-y-3 max-w-[360px]">
              <MockStep n="1" title="Crawl Pages" desc="47 pages found" status="done" />
              <MockStep n="2" title="SEO & GEO Audit" desc="Scoring every page..." status="running" />
              <MockStep n="3" title="Internal Links" desc="Find missing links with AI" status="pending" />
            </div>
          </MockupScreen>

          <Tip>The crawl respects rate limits (1 request per second by default) so it won&apos;t overload your server. Typical sites with 50-100 pages take 3-5 minutes.</Tip>
        </Section>

        {/* Step 4: Audit */}
        <Section id="audit" step="4" title="Reading Your SEO & GEO Audit">
          <p>Every page gets two scores:</p>

          <div className="grid grid-cols-2 gap-4 my-6">
            <div className="bg-white border border-[#eeece8] rounded-2xl p-5">
              <div className="text-[28px] font-extrabold text-[#1a3a2a]">SEO</div>
              <p className="text-[12px] text-[#6b6b6b] mt-1">Traditional search optimization. Title tags, meta descriptions, heading hierarchy, image alt text, internal links, canonical tags, content depth, URL structure.</p>
            </div>
            <div className="bg-white border border-[#eeece8] rounded-2xl p-5">
              <div className="text-[28px] font-extrabold text-[#9334e8]">GEO</div>
              <p className="text-[12px] text-[#6b6b6b] mt-1">Generative Engine Optimization. How likely ChatGPT, Perplexity, and Google AI Overview will cite your content. Citability, AI bot access, schema, E-E-A-T.</p>
            </div>
          </div>

          <h3 className="text-[16px] font-bold text-[#0f0f0f] mt-8 mb-3">SEO Checks (20+ per page)</h3>
          <CheckList items={[
            "Title tag (10-60 characters, descriptive)",
            "Meta description (50-160 characters)",
            "Exactly one H1 tag",
            "Heading hierarchy (no skipped levels)",
            "Image alt text for all images",
            "Word count (minimum varies by page type)",
            "Internal links (3+ recommended)",
            "Canonical tag present",
            "URL structure (no uppercase, no underscores)",
          ]} />

          <h3 className="text-[16px] font-bold text-[#0f0f0f] mt-8 mb-3">GEO Checks</h3>
          <CheckList items={[
            "Citability score — are paragraphs 134-167 words, self-contained, fact-rich?",
            "AI crawler access — are GPTBot, ClaudeBot, PerplexityBot allowed in robots.txt?",
            "Schema completeness — JSON-LD structured data for your page type",
            "E-E-A-T signals — author attribution, dates, sources, first-hand experience",
            "Content structure — lists, tables, FAQ sections for better extraction",
            "llms.txt — the emerging standard for AI-readable site descriptions",
          ]} />

          <MockupScreen title="Audit Results">
            <div className="overflow-hidden">
              <table className="w-full text-[11px]">
                <thead>
                  <tr className="border-b border-[#eeece8]">
                    <th className="text-left py-2 font-semibold text-[#8c8c8c] text-[10px] uppercase">Page</th>
                    <th className="text-right py-2 font-semibold text-[#8c8c8c] text-[10px] uppercase">SEO</th>
                    <th className="text-right py-2 font-semibold text-[#8c8c8c] text-[10px] uppercase">GEO</th>
                    <th className="text-left py-2 pl-4 font-semibold text-[#8c8c8c] text-[10px] uppercase">Top Issue</th>
                  </tr>
                </thead>
                <tbody>
                  <MockAuditRow page="/about" seo={95} geo={42} issue="Missing FAQ schema" />
                  <MockAuditRow page="/pricing" seo={80} geo={28} issue="Low citability score" />
                  <MockAuditRow page="/blog/seo-tips" seo={70} geo={65} issue="No author attribution" />
                  <MockAuditRow page="/contact" seo={55} geo={15} issue="Thin content (89 words)" />
                </tbody>
              </table>
            </div>
          </MockupScreen>

          <h3 className="text-[16px] font-bold text-[#0f0f0f] mt-8 mb-3">Score Colors</h3>
          <div className="flex gap-6 text-[13px]">
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-[#1a3a2a]" /> <strong>70-100</strong> — Good</div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-[#f9ab00]" /> <strong>40-69</strong> — Needs work</div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-[#ea4335]" /> <strong>0-39</strong> — Critical</div>
          </div>

          <Tip>Each issue comes with a priority (critical, high, medium, low) and a specific fix recommendation. Focus on critical issues first — they have the biggest impact.</Tip>
        </Section>

        {/* Step 5: Links */}
        <Section id="links" step="5" title="Internal Link Suggestions">
          <p>This is where the AI magic happens. Every page on your site gets converted into a <strong>vector embedding</strong> (a mathematical representation of its content). We then use <strong>cosine similarity</strong> to find pages that are semantically related but don&apos;t link to each other.</p>

          <p>For each suggestion, you get:</p>
          <FeatureGrid items={[
            { title: "Source Page", desc: "The page that should contain the new link" },
            { title: "Target Page", desc: "The page being linked to" },
            { title: "Anchor Text", desc: "Suggested text for the link" },
            { title: "Similarity %", desc: "How related the pages are (higher = better)" },
            { title: "Confidence", desc: "Low, medium, or high confidence rating" },
            { title: "One-Click", desc: "Approve or reject each suggestion" },
          ]} />

          <MockupScreen title="Link Suggestions">
            <div className="space-y-3">
              <MockLinkSuggestion from="/blog/seo-guide" to="/pricing" anchor="SEO pricing plans" similarity="87%" />
              <MockLinkSuggestion from="/features" to="/blog/geo-tips" anchor="GEO optimization tips" similarity="82%" />
            </div>
          </MockupScreen>

          <Tip>Internal links are the highest-ROI SEO action. A single well-placed internal link can boost a page&apos;s ranking significantly. Our suggestions save hours of manual work.</Tip>
        </Section>

        {/* Step 6: Research */}
        <Section id="research" step="6" title="Competitor Research">
          <p>Enter up to 5 competitor URLs and an optional keyword. We crawl their pages, extract topics, and compare against your content to find <strong>content gaps</strong> — topics they rank for that you don&apos;t cover.</p>

          <p>The gap analysis shows:</p>
          <ul className="list-disc list-inside space-y-1 text-[14px] text-[#4a4a4a]">
            <li><strong>Topic</strong> — what the competitor covers</li>
            <li><strong>Competitor coverage</strong> — how many competitor pages mention it</li>
            <li><strong>Your coverage</strong> — whether you have content on this topic</li>
            <li><strong>Opportunity score</strong> — higher = more valuable gap to fill</li>
          </ul>

          <MockupScreen title="Content Gaps">
            <div className="overflow-hidden">
              <table className="w-full text-[11px]">
                <thead>
                  <tr className="border-b border-[#eeece8]">
                    <th className="text-left py-2 font-semibold text-[#8c8c8c] text-[10px] uppercase">Topic</th>
                    <th className="text-right py-2 font-semibold text-[#8c8c8c] text-[10px] uppercase">Competitors</th>
                    <th className="text-center py-2 font-semibold text-[#8c8c8c] text-[10px] uppercase">You</th>
                    <th className="text-right py-2 font-semibold text-[#8c8c8c] text-[10px] uppercase">Score</th>
                  </tr>
                </thead>
                <tbody className="text-[11px]">
                  <tr className="border-b border-[#f5f3f0]"><td className="py-2 font-medium">pricing comparison guide</td><td className="text-right">4 pages</td><td className="text-center text-[#ea4335] font-bold">Missing</td><td className="text-right font-bold text-[#ea4335]">85</td></tr>
                  <tr className="border-b border-[#f5f3f0]"><td className="py-2 font-medium">step by step onboarding</td><td className="text-right">3 pages</td><td className="text-center text-[#ea4335] font-bold">Missing</td><td className="text-right font-bold text-[#f9ab00]">62</td></tr>
                  <tr><td className="py-2 font-medium">best practices checklist</td><td className="text-right">5 pages</td><td className="text-center text-[#1a3a2a] font-bold">Covered</td><td className="text-right text-[#8c8c8c]">20</td></tr>
                </tbody>
              </table>
            </div>
          </MockupScreen>
        </Section>

        {/* Step 7: Briefs */}
        <Section id="briefs" step="7" title="Content Briefs">
          <p>Based on research gaps (or any keyword you enter), we generate <strong>structured content briefs</strong> — ready-to-use recipes for writers. Each brief includes:</p>

          <FeatureGrid items={[
            { title: "Title Suggestion", desc: "SEO-optimized title for the article" },
            { title: "Article Outline", desc: "H2/H3 sections with talking points and word counts" },
            { title: "Questions to Answer", desc: "5-7 questions the content should address" },
            { title: "Internal Links", desc: "Pre-identified pages to link to from the new content" },
            { title: "Schema Type", desc: "Recommended JSON-LD (Article, FAQ, Product, etc.)" },
            { title: "GEO Hints", desc: "Citable block targets, paragraph structure, fact density" },
          ]} />

          <MockupScreen title="Content Brief">
            <div className="max-w-[360px]">
              <div className="text-[13px] font-bold text-[#0f0f0f] mb-1">Best Project Management Tools: Complete Guide</div>
              <div className="flex gap-2 mb-3">
                <span className="text-[10px] bg-[#e8f0e8] text-[#1a3a2a] px-2 py-0.5 rounded-full font-medium">Article</span>
                <span className="text-[10px] text-[#8c8c8c]">1,400 words</span>
              </div>
              <div className="space-y-2">
                <MockOutlineItem heading="Introduction" words={150} />
                <MockOutlineItem heading="Top 5 Tools Compared" words={400} />
                <MockOutlineItem heading="Pricing Breakdown" words={250} />
                <MockOutlineItem heading="FAQ" words={350} />
                <MockOutlineItem heading="Conclusion" words={150} />
              </div>
            </div>
          </MockupScreen>

          <p>You can optionally generate an <strong>AI draft</strong> from any brief using Claude. The draft is GEO-optimized from birth — structured in citable 134-167 word blocks with fact-dense paragraphs.</p>

          <Tip>The brief is the primary output, not the AI draft. A good brief makes any writer — human or AI — produce better content because the research and structure are already done.</Tip>
        </Section>

        {/* Step 8: Export */}
        <Section id="export" step="8" title="Exporting & API Access">
          <p>All data is available in three ways:</p>

          <h3 className="text-[16px] font-bold text-[#0f0f0f] mt-6 mb-3">CSV Export</h3>
          <p>Download any report as a CSV file directly from the dashboard:</p>
          <ul className="list-disc list-inside space-y-1 text-[14px] text-[#4a4a4a]">
            <li><code className="text-[12px] bg-[#f5f3f0] px-1.5 py-0.5 rounded">/export/audit.csv</code> — All page scores and issues</li>
            <li><code className="text-[12px] bg-[#f5f3f0] px-1.5 py-0.5 rounded">/export/links.csv</code> — Link suggestions with anchor text</li>
            <li><code className="text-[12px] bg-[#f5f3f0] px-1.5 py-0.5 rounded">/export/briefs.csv</code> — Content briefs summary</li>
          </ul>

          <h3 className="text-[16px] font-bold text-[#0f0f0f] mt-8 mb-3">REST API</h3>
          <p>Every feature is accessible via API. See the full <Link href="/docs" className="text-[#1a3a2a] font-semibold underline underline-offset-2">API documentation</Link> for endpoints and examples.</p>

          <div className="bg-[#0f1a14] rounded-xl p-4 mt-4 font-mono text-[12px] text-[#a0d0b0] overflow-x-auto">
            <div className="text-[#4a6a50]"># Example: Get audit results</div>
            <div className="mt-1">curl https://your-api.com/v1/sites/SITE_ID/audit \</div>
            <div className="ml-4">-H &quot;Authorization: Bearer YOUR_API_KEY&quot;</div>
          </div>

          <h3 className="text-[16px] font-bold text-[#0f0f0f] mt-8 mb-3">JS Embed Snippet</h3>
          <p>Drop this on any website to auto-report pages to SEO Agent:</p>

          <div className="bg-[#0f1a14] rounded-xl p-4 mt-4 font-mono text-[12px] text-[#a0d0b0] overflow-x-auto">
            <div>&lt;script src=&quot;https://your-api.com/embed/snippet.js&quot;</div>
            <div className="ml-4">data-key=&quot;YOUR_API_KEY&quot;</div>
            <div className="ml-4">data-site=&quot;YOUR_SITE_ID&quot;&gt;</div>
            <div>&lt;/script&gt;</div>
          </div>
        </Section>

        {/* CTA */}
        <div className="text-center mt-20 mb-8">
          <h2 className="text-[28px] font-extrabold text-[#0f0f0f] tracking-tight">Ready to start?</h2>
          <p className="text-[15px] text-[#6b6b6b] mt-2 mb-6">Create a free account and analyze your first website in minutes.</p>
          <Link href="/signup" className="inline-flex items-center gap-2 bg-[#1a3a2a] text-white px-7 py-3.5 rounded-full text-[14px] font-semibold hover:bg-[#143020] transition-all">
            Get Started Free
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-[#0f1a14] border-t border-[#1a2e20]">
        <div className="max-w-[900px] mx-auto px-6 py-8 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-[#1a3a2a] rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-[#4ade80]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="text-[13px] font-semibold text-[#7a8a7f]">SEO Agent</span>
          </div>
          <div className="flex items-center gap-8 text-[12px] text-[#4a5a4f]">
            <Link href="/" className="hover:text-[#7a8a7f] transition-colors">Home</Link>
            <Link href="/docs" className="hover:text-[#7a8a7f] transition-colors">API Docs</Link>
            <Link href="/login" className="hover:text-[#7a8a7f] transition-colors">Login</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ─── Components ──────────────────────────────────────────────────

function Section({ id, step, title, children }: { id: string; step: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="mb-20 scroll-mt-24">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-10 h-10 bg-[#1a3a2a] rounded-xl flex items-center justify-center text-white font-bold text-[14px] shrink-0">{step}</div>
        <h2 className="text-[24px] font-extrabold text-[#0f0f0f] tracking-tight">{title}</h2>
      </div>
      <div className="space-y-4 text-[14px] text-[#4a4a4a] leading-[1.8] pl-14">
        {children}
      </div>
    </section>
  );
}

function MockupScreen({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="my-6 bg-white border border-[#e0ddd6] rounded-2xl overflow-hidden shadow-sm">
      <div className="flex items-center gap-2 px-4 py-2.5 bg-[#fafaf8] border-b border-[#eeece8]">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-[#e8e5e0]" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#e8e5e0]" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#e8e5e0]" />
        </div>
        <span className="text-[10px] text-[#9a9a9a] font-medium ml-2">{title}</span>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function MockInput({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] font-semibold text-[#1a1a1a] mb-1">{label}</div>
      <div className="px-3 py-2 bg-[#fafaf8] border border-[#e0ddd6] rounded-lg text-[11px] text-[#6b6b6b]">{value}</div>
    </div>
  );
}

function MockStep({ n, title, desc, status }: { n: string; title: string; desc: string; status: "done" | "running" | "pending" }) {
  const bg = status === "done" ? "bg-[#1a3a2a] text-white" : status === "running" ? "bg-[#f9ab00] text-white" : "bg-[#f1f3f4] text-[#8c8c8c]";
  return (
    <div className="flex items-center gap-3">
      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold ${bg}`}>
        {status === "done" ? "✓" : status === "running" ? "⟳" : n}
      </div>
      <div>
        <div className="text-[12px] font-semibold text-[#1a1a1a]">{title}</div>
        <div className="text-[10px] text-[#8c8c8c]">{desc}</div>
      </div>
    </div>
  );
}

function MockAuditRow({ page, seo, geo, issue }: { page: string; seo: number; geo: number; issue: string }) {
  const sc = (v: number) => v >= 70 ? "text-[#1a3a2a]" : v >= 40 ? "text-[#f9ab00]" : "text-[#ea4335]";
  return (
    <tr className="border-b border-[#f5f3f0] last:border-0">
      <td className="py-2 font-medium font-mono text-[#3a3a3a]">{page}</td>
      <td className={`text-right font-bold ${sc(seo)}`}>{seo}</td>
      <td className={`text-right font-bold ${sc(geo)}`}>{geo}</td>
      <td className="pl-4 text-[#8c8c8c]">{issue}</td>
    </tr>
  );
}

function MockLinkSuggestion({ from, to, anchor, similarity }: { from: string; to: string; anchor: string; similarity: string }) {
  return (
    <div className="flex items-center gap-3 p-3 bg-[#fafaf8] rounded-lg">
      <div className="flex-1 min-w-0">
        <div className="text-[10px] text-[#8c8c8c]">From <span className="font-mono text-[#3a3a3a]">{from}</span></div>
        <div className="text-[10px] text-[#8c8c8c] mt-0.5">Link to <span className="font-mono text-[#3a3a3a]">{to}</span></div>
        <div className="text-[11px] mt-1">Anchor: <span className="text-[#1a3a2a] font-semibold">&quot;{anchor}&quot;</span> · {similarity}</div>
      </div>
      <div className="flex gap-1.5 shrink-0">
        <div className="px-2.5 py-1 bg-[#1a3a2a] text-white text-[9px] font-bold rounded">Approve</div>
        <div className="px-2.5 py-1 border border-[#e0ddd6] text-[#6b6b6b] text-[9px] font-bold rounded">Reject</div>
      </div>
    </div>
  );
}

function MockOutlineItem({ heading, words }: { heading: string; words: number }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-l-2 border-[#1a3a2a] pl-3">
      <span className="text-[12px] font-semibold text-[#1a1a1a]">{heading}</span>
      <span className="text-[10px] text-[#8c8c8c]">~{words} words</span>
    </div>
  );
}

function FeatureGrid({ items }: { items: { title: string; desc: string }[] }) {
  return (
    <div className="grid grid-cols-3 gap-3 my-5">
      {items.map((item) => (
        <div key={item.title} className="bg-white border border-[#eeece8] rounded-xl p-3.5">
          <div className="text-[12px] font-bold text-[#1a1a1a] mb-0.5">{item.title}</div>
          <div className="text-[11px] text-[#8c8c8c] leading-[1.5]">{item.desc}</div>
        </div>
      ))}
    </div>
  );
}

function CheckList({ items }: { items: string[] }) {
  return (
    <div className="space-y-2 my-4">
      {items.map((item) => (
        <div key={item} className="flex items-start gap-2.5">
          <svg className="w-4 h-4 text-[#1a3a2a] shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          <span className="text-[13px] text-[#4a4a4a]">{item}</span>
        </div>
      ))}
    </div>
  );
}

function Tip({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-3 p-4 bg-[#e8f0e8] border border-[#c8e0c8] rounded-xl my-5">
      <svg className="w-5 h-5 text-[#1a3a2a] shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
      </svg>
      <p className="text-[13px] text-[#1a3a2a] leading-[1.6]">{children}</p>
    </div>
  );
}
