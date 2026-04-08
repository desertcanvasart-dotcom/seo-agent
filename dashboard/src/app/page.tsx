import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#fafaf8]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#fafaf8]/90 backdrop-blur-sm border-b border-[#e8e5e0]">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[#2d5a3d] rounded-lg flex items-center justify-center text-white font-bold text-sm">S</div>
              <span className="font-semibold text-[15px]">SEO Agent</span>
            </Link>
            <nav className="hidden md:flex items-center gap-6 text-sm text-[#5c5c5c]">
              <a href="#features" className="hover:text-[#1a1a1a] transition-colors">Features</a>
              <a href="#how-it-works" className="hover:text-[#1a1a1a] transition-colors">How It Works</a>
              <a href="#modules" className="hover:text-[#1a1a1a] transition-colors">Modules</a>
              <Link href="/docs" className="hover:text-[#1a1a1a] transition-colors">API Docs</Link>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-[#5c5c5c] hover:text-[#1a1a1a] transition-colors px-3 py-2">
              Log In
            </Link>
            <Link href="/signup" className="text-sm bg-[#2d5a3d] text-white px-4 py-2 rounded-lg hover:bg-[#234a31] transition-colors">
              Get Started Free
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#e8f0e8] text-[#2d5a3d] text-xs font-medium mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-[#2d5a3d]" />
          AI-Powered SEO &amp; GEO Platform
        </div>

        <h1 className="text-[44px] md:text-[56px] leading-[1.1] font-bold tracking-tight text-[#1a1a1a] max-w-3xl mx-auto">
          Make your website{" "}
          <span className="italic text-[#2d5a3d]">visible everywhere</span>{" "}
          — Google and AI.
        </h1>

        <p className="text-lg text-[#5c5c5c] mt-6 max-w-2xl mx-auto leading-relaxed">
          Paste a URL. Get a full SEO &amp; GEO audit, internal linking suggestions, competitor research, and content briefs — optimized for Google <em>and</em> AI assistants like ChatGPT.
        </p>

        <div className="flex items-center justify-center gap-4 mt-8">
          <Link href="/signup" className="bg-[#2d5a3d] text-white px-6 py-3 rounded-lg text-sm font-medium hover:bg-[#234a31] transition-colors">
            Start Free Analysis
          </Link>
          <Link href="/docs" className="bg-white border border-[#d4d0c8] text-[#1a1a1a] px-6 py-3 rounded-lg text-sm font-medium hover:bg-[#f5f3f0] transition-colors">
            See API Docs
          </Link>
        </div>

        {/* Stats */}
        <div className="flex items-center justify-center gap-12 mt-16 pt-8 border-t border-[#e8e5e0]">
          {[
            { value: "100+", label: "SEO Checks" },
            { value: "14", label: "AI Bot Analysis" },
            { value: "6", label: "Core Modules" },
            { value: "Free", label: "To Get Started" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-2xl font-bold text-[#1a1a1a]">{stat.value}</p>
              <p className="text-xs text-[#8c8c8c] mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Problem Section */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-[#1a1a1a]">
            Your SEO &amp; GEO Stack Is <span className="italic text-[#2d5a3d]">Fragmented.</span>
          </h2>
          <p className="text-[#5c5c5c] mt-3 max-w-xl mx-auto">
            One tool for audits. Another for keywords. Another for content. None of them talk to each other, and none optimize for AI search.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {[
            { title: "Scattered tools", desc: "You&apos;re switching between 3-5 SEO tools that don&apos;t share data. Your audit tool doesn&apos;t know what your content tool is doing." },
            { title: "Invisible to AI", desc: "ChatGPT, Perplexity, and Google AI Overview are answering search queries. If your content isn&apos;t structured for them, you&apos;re invisible." },
            { title: "Manual linking", desc: "Internal links are the highest-ROI SEO action, but finding opportunities across hundreds of pages manually is impossible." },
          ].map((item) => (
            <div key={item.title} className="bg-white border border-[#e8e5e0] rounded-xl p-6">
              <h3 className="font-semibold text-sm mb-2">{item.title}</h3>
              <p className="text-sm text-[#5c5c5c] leading-relaxed" dangerouslySetInnerHTML={{ __html: item.desc }} />
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="bg-white border-y border-[#e8e5e0]">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#e8f0e8] text-[#2d5a3d] text-xs font-medium mb-4">
              How It Works
            </div>
            <h2 className="text-3xl font-bold text-[#1a1a1a]">
              From URL to <span className="italic text-[#2d5a3d]">Actionable Insights</span> in Minutes
            </h2>
          </div>

          <div className="grid grid-cols-3 gap-8">
            {[
              {
                step: "1",
                title: "Paste Your URL",
                desc: "Enter any website. Our crawler visits every page with a real browser — even JavaScript-heavy sites built with React, WordPress, or Shopify.",
              },
              {
                step: "2",
                title: "Auto-Analyze Everything",
                desc: "We audit SEO health, score GEO readiness for AI assistants, find internal linking opportunities, and identify content gaps vs competitors.",
              },
              {
                step: "3",
                title: "Get Your Playbook",
                desc: "Prioritized recommendations, link suggestions with anchor text, content briefs with outlines — everything you need to improve rankings.",
              },
            ].map((item) => (
              <div key={item.step} className="relative">
                <div className="w-10 h-10 bg-[#2d5a3d] rounded-full flex items-center justify-center text-white font-bold text-sm mb-4">{item.step}</div>
                <h3 className="font-semibold mb-2">{item.title}</h3>
                <p className="text-sm text-[#5c5c5c] leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="max-w-6xl mx-auto px-6 py-20">
        <Feature
          badge="SEO Audit"
          title="Every Page Scored. Every Issue Prioritized."
          desc="Title tags, meta descriptions, heading hierarchy, image alt text, content depth, internal links, canonical tags, URL structure — all checked automatically. Each page gets a 0-100 score with specific fix instructions."
          align="left"
        />
        <Feature
          badge="GEO Score"
          title="Optimized for AI, Not Just Google."
          desc="We score how likely ChatGPT, Perplexity, and Google AI Overview will cite your content. Citability scoring, AI crawler access checks, schema validation, E-E-A-T signals, and content structure analysis."
          align="right"
        />
        <Feature
          badge="Internal Links"
          title="AI Finds the Links You're Missing."
          desc="Every page is embedded as a vector. Our engine finds semantically related pages, suggests exact anchor text, and shows you where in the content to place each link. Approve with one click."
          align="left"
        />
        <Feature
          badge="Research"
          title="See What Competitors Cover That You Don't."
          desc="Enter competitor URLs. We crawl their pages, extract topics, and compare against your content. You get a gap analysis showing exactly what to write next — ranked by opportunity score."
          align="right"
        />
      </section>

      {/* Modules Grid */}
      <section id="modules" className="bg-white border-y border-[#e8e5e0]">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-[#1a1a1a]">6 Modules. <span className="italic text-[#2d5a3d]">One Platform.</span></h2>
            <p className="text-[#5c5c5c] mt-3 max-w-xl mx-auto">Everything connects. Your audit informs your links. Your research feeds your briefs. One tool, complete coverage.</p>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {[
              { icon: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z", title: "Page Crawler", desc: "Puppeteer-powered. Renders JavaScript. Discovers every page automatically." },
              { icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z", title: "SEO Audit", desc: "20+ checks per page. Weighted scoring. Prioritized recommendations." },
              { icon: "M13 10V3L4 14h7v7l9-11h-7z", title: "GEO Score", desc: "AI citability, crawler access, schema validation, E-E-A-T analysis." },
              { icon: "M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101", title: "Internal Links", desc: "Vector similarity. Smart anchor text. One-click approval workflow." },
              { icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z", title: "Research", desc: "Competitor crawling. Topic gap analysis. Opportunity scoring." },
              { icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z", title: "Content Briefs", desc: "Outlines, questions, internal links, GEO hints. Optional AI drafts." },
            ].map((mod) => (
              <div key={mod.title} className="border border-[#e8e5e0] rounded-xl p-5 hover:border-[#2d5a3d]/30 transition-colors">
                <svg className="w-5 h-5 text-[#2d5a3d] mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={mod.icon} />
                </svg>
                <h3 className="font-semibold text-sm mb-1">{mod.title}</h3>
                <p className="text-xs text-[#5c5c5c] leading-relaxed">{mod.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="bg-[#1a1a2e]">
        <div className="max-w-6xl mx-auto px-6 py-20 text-center">
          <h2 className="text-3xl font-bold text-white mb-3">Stop Being Invisible to AI Search.</h2>
          <p className="text-[#8b8fa3] mb-8 max-w-lg mx-auto">Optimize for Google and AI assistants in one platform. Paste your URL, get a full SEO &amp; GEO analysis in minutes. Free to start.</p>
          <Link href="/signup" className="inline-flex items-center gap-2 bg-[#2d5a3d] text-white px-6 py-3 rounded-lg text-sm font-medium hover:bg-[#3a7350] transition-colors">
            Start Free Analysis
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#e8e5e0] bg-[#fafaf8]">
        <div className="max-w-6xl mx-auto px-6 py-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-[#2d5a3d] rounded flex items-center justify-center text-white font-bold text-[10px]">S</div>
              <span className="text-sm font-semibold">SEO Agent</span>
            </div>
            <div className="flex items-center gap-6 text-xs text-[#8c8c8c]">
              <Link href="/docs" className="hover:text-[#1a1a1a]">API Docs</Link>
              <Link href="/login" className="hover:text-[#1a1a1a]">Login</Link>
              <Link href="/signup" className="hover:text-[#1a1a1a]">Sign Up</Link>
            </div>
          </div>
          <p className="text-xs text-[#8c8c8c] mt-6">SEO &amp; GEO optimization — rank on Google and get cited by AI.</p>
        </div>
      </footer>
    </div>
  );
}

function Feature({ badge, title, desc, align }: { badge: string; title: string; desc: string; align: "left" | "right" }) {
  return (
    <div className={`flex items-start gap-12 py-12 ${align === "right" ? "flex-row-reverse" : ""}`}>
      <div className="flex-1">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#e8f0e8] text-[#2d5a3d] text-xs font-medium mb-4">
          {badge}
        </div>
        <h3 className="text-2xl font-bold text-[#1a1a1a] mb-3">{title}</h3>
        <p className="text-[#5c5c5c] leading-relaxed">{desc}</p>
      </div>
      <div className="flex-1 bg-white border border-[#e8e5e0] rounded-xl h-64 flex items-center justify-center text-[#d4d0c8]">
        <span className="text-sm">Dashboard Preview</span>
      </div>
    </div>
  );
}
