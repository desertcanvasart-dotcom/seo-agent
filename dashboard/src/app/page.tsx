import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#fafaf8]" style={{ fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}>
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#fafaf8]/80 backdrop-blur-md">
        <div className="max-w-[1180px] mx-auto px-6 flex items-center justify-between h-[72px]">
          <div className="flex items-center gap-10">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-[#1a3a2a] rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-[#4ade80]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span className="font-bold text-[17px] text-[#1a1a1a] tracking-tight">SEO Agent</span>
            </Link>
            <nav className="hidden md:flex items-center gap-7">
              {["Features", "How It Works", "Modules"].map((item) => (
                <a key={item} href={`#${item.toLowerCase().replace(/\s/g, "-")}`} className="text-[13px] text-[#6b6b6b] hover:text-[#1a1a1a] transition-colors font-medium">
                  {item}
                </a>
              ))}
              <Link href="/docs" className="text-[13px] text-[#6b6b6b] hover:text-[#1a1a1a] transition-colors font-medium">
                API
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/login" className="text-[13px] text-[#6b6b6b] hover:text-[#1a1a1a] font-medium px-4 py-2 transition-colors">
              Log in
            </Link>
            <Link href="/signup" className="text-[13px] bg-[#1a3a2a] text-white font-medium px-5 py-2.5 rounded-full hover:bg-[#143020] transition-colors">
              Get Started Free
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-[1180px] mx-auto px-6 pt-24 pb-20">
        <div className="max-w-[780px] mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#1a3a2a]/5 border border-[#1a3a2a]/10 text-[#1a3a2a] text-[12px] font-semibold mb-8 tracking-wide uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-[#4ade80] animate-pulse" />
            SEO &amp; GEO Optimization Platform
          </div>

          <h1 className="text-[52px] md:text-[64px] leading-[1.05] font-extrabold tracking-[-0.03em] text-[#0f0f0f]">
            Rank on Google.
            <br />
            <span className="bg-gradient-to-r from-[#1a3a2a] to-[#2d8a5e] bg-clip-text text-transparent">Get cited by AI.</span>
          </h1>

          <p className="text-[18px] text-[#6b6b6b] mt-7 max-w-[560px] mx-auto leading-[1.7] font-normal">
            One platform to audit your website, find internal links, research competitors, and create content — optimized for Google <em>and</em> ChatGPT.
          </p>

          <div className="flex items-center justify-center gap-3 mt-10">
            <Link href="/signup" className="bg-[#1a3a2a] text-white px-7 py-3.5 rounded-full text-[14px] font-semibold hover:bg-[#143020] transition-all hover:shadow-lg hover:shadow-[#1a3a2a]/20">
              Start Free Analysis
            </Link>
            <a href="#how-it-works" className="bg-white border border-[#e0ddd6] text-[#3a3a3a] px-7 py-3.5 rounded-full text-[14px] font-semibold hover:border-[#c0bdb6] transition-colors">
              See How It Works
            </a>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center justify-center gap-16 mt-20">
          {[
            { value: "100+", label: "SEO & GEO Checks" },
            { value: "14", label: "AI Bots Analyzed" },
            { value: "6", label: "Core Modules" },
            { value: "Free", label: "To Start" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-[32px] font-extrabold text-[#1a3a2a] tracking-tight">{stat.value}</p>
              <p className="text-[12px] text-[#9a9a9a] mt-1 font-medium tracking-wide uppercase">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Problem */}
      <section className="bg-white border-y border-[#eeece8]">
        <div className="max-w-[1180px] mx-auto px-6 py-24">
          <div className="text-center mb-14">
            <p className="text-[12px] font-semibold text-[#1a3a2a] uppercase tracking-widest mb-3">The Problem</p>
            <h2 className="text-[36px] font-extrabold text-[#0f0f0f] tracking-tight leading-tight">
              Your SEO &amp; GEO stack is{" "}
              <span className="bg-gradient-to-r from-[#ea4335] to-[#f97316] bg-clip-text text-transparent">broken</span>.
            </h2>
          </div>

          <div className="grid grid-cols-3 gap-5">
            {[
              {
                icon: "M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
                title: "Scattered Tools",
                desc: "3-5 tools that don't share data. Your audit tool doesn't know what your content tool is doing.",
              },
              {
                icon: "M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M3 3l18 18",
                title: "Invisible to AI",
                desc: "ChatGPT and Perplexity answer search queries. If your content isn't structured for them, you don't exist.",
              },
              {
                icon: "M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101",
                title: "Manual Linking",
                desc: "Internal links are the highest-ROI action, but finding them across hundreds of pages is impossible manually.",
              },
            ].map((item) => (
              <div key={item.title} className="bg-[#fafaf8] border border-[#eeece8] rounded-2xl p-7">
                <div className="w-11 h-11 bg-[#fce8e6] rounded-xl flex items-center justify-center mb-4">
                  <svg className="w-5 h-5 text-[#ea4335]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                  </svg>
                </div>
                <h3 className="font-bold text-[15px] text-[#1a1a1a] mb-2">{item.title}</h3>
                <p className="text-[13px] text-[#6b6b6b] leading-[1.7]">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="max-w-[1180px] mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <p className="text-[12px] font-semibold text-[#1a3a2a] uppercase tracking-widest mb-3">How It Works</p>
          <h2 className="text-[36px] font-extrabold text-[#0f0f0f] tracking-tight">
            URL to insights in <span className="bg-gradient-to-r from-[#1a3a2a] to-[#2d8a5e] bg-clip-text text-transparent">minutes</span>
          </h2>
        </div>

        <div className="grid grid-cols-3 gap-8">
          {[
            {
              step: "01",
              title: "Paste a URL",
              desc: "Enter any website. Our Puppeteer-powered crawler renders JavaScript, discovers every page, and extracts all content.",
              color: "#1a3a2a",
            },
            {
              step: "02",
              title: "We Analyze Everything",
              desc: "SEO audit, GEO scoring, AI bot access, schema validation, internal link mapping, competitor gap analysis — all automatic.",
              color: "#2d8a5e",
            },
            {
              step: "03",
              title: "Get Your Playbook",
              desc: "Prioritized fixes, link suggestions with anchor text, content briefs with outlines — ready to act on immediately.",
              color: "#4ade80",
            },
          ].map((item) => (
            <div key={item.step} className="relative">
              <div className="text-[64px] font-black leading-none mb-4" style={{ color: item.color + "15" }}>{item.step}</div>
              <h3 className="font-bold text-[17px] text-[#1a1a1a] mb-2 -mt-4">{item.title}</h3>
              <p className="text-[13px] text-[#6b6b6b] leading-[1.7]">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="bg-white border-y border-[#eeece8]">
        <div className="max-w-[1180px] mx-auto px-6 py-24">
          <div className="text-center mb-16">
            <p className="text-[12px] font-semibold text-[#1a3a2a] uppercase tracking-widest mb-3">Features</p>
            <h2 className="text-[36px] font-extrabold text-[#0f0f0f] tracking-tight">
              Everything you need, <span className="bg-gradient-to-r from-[#1a3a2a] to-[#2d8a5e] bg-clip-text text-transparent">nothing you don&apos;t</span>
            </h2>
          </div>

          <div className="space-y-20">
            <FeatureRow
              label="SEO Audit"
              title="Every page scored. Every issue prioritized."
              desc="Title tags, meta descriptions, heading hierarchy, image alt text, content depth, internal links, canonical tags, URL structure — 20+ checks per page with weighted scoring and specific fix instructions."
              align="left"
            />
            <FeatureRow
              label="GEO Score"
              title="Built for the AI search era."
              desc="We score how likely ChatGPT, Perplexity, and Google AI Overview will cite your content. Citability scoring, AI crawler access for 14 bots, schema validation, E-E-A-T signals, and content structure analysis."
              align="right"
            />
            <FeatureRow
              label="Internal Links"
              title="AI finds the links you're missing."
              desc="Every page becomes a vector. Our engine finds semantically related pages, suggests exact anchor text, and shows you where to place each link. Review and approve with one click."
              align="left"
            />
            <FeatureRow
              label="Research"
              title="See what competitors rank for. You don't."
              desc="Enter competitor URLs. We crawl their pages, extract topics, and compare against your content. Gap analysis ranked by opportunity score — you know exactly what to write next."
              align="right"
            />
          </div>
        </div>
      </section>

      {/* Modules */}
      <section id="modules" className="max-w-[1180px] mx-auto px-6 py-24">
        <div className="text-center mb-14">
          <p className="text-[12px] font-semibold text-[#1a3a2a] uppercase tracking-widest mb-3">Platform</p>
          <h2 className="text-[36px] font-extrabold text-[#0f0f0f] tracking-tight">
            6 modules. <span className="bg-gradient-to-r from-[#1a3a2a] to-[#2d8a5e] bg-clip-text text-transparent">One platform.</span>
          </h2>
          <p className="text-[15px] text-[#6b6b6b] mt-3 max-w-[480px] mx-auto">Everything connects. Your audit informs your links. Your research feeds your briefs.</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[
            { icon: "M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9", title: "Crawler", desc: "Puppeteer-powered, renders JS, discovers every page" },
            { icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z", title: "SEO Audit", desc: "20+ checks, weighted scoring, prioritized fixes" },
            { icon: "M13 10V3L4 14h7v7l9-11h-7z", title: "GEO Score", desc: "AI citability, 14 bot checks, schema, E-E-A-T" },
            { icon: "M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101", title: "Links", desc: "Vector similarity, smart anchors, one-click approve" },
            { icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z", title: "Research", desc: "Competitor crawl, topic gaps, opportunity scoring" },
            { icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z", title: "Briefs", desc: "Outlines, questions, GEO hints, AI drafts" },
          ].map((mod) => (
            <div key={mod.title} className="bg-white border border-[#eeece8] rounded-2xl p-6 hover:border-[#1a3a2a]/20 hover:shadow-sm transition-all group">
              <div className="w-10 h-10 bg-[#1a3a2a]/5 rounded-xl flex items-center justify-center mb-4 group-hover:bg-[#1a3a2a]/10 transition-colors">
                <svg className="w-5 h-5 text-[#1a3a2a]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={mod.icon} />
                </svg>
              </div>
              <h3 className="font-bold text-[14px] text-[#1a1a1a] mb-1">{mod.title}</h3>
              <p className="text-[12px] text-[#6b6b6b] leading-[1.6]">{mod.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="bg-[#0f1a14]">
        <div className="max-w-[1180px] mx-auto px-6 py-24 text-center">
          <h2 className="text-[40px] font-extrabold text-white tracking-tight leading-tight">
            Stop being invisible
            <br />
            to AI search.
          </h2>
          <p className="text-[16px] text-[#7a8a7f] mt-5 max-w-[440px] mx-auto leading-relaxed">
            Optimize for Google and AI assistants in one platform. Free to start, no credit card.
          </p>
          <Link href="/signup" className="inline-flex items-center gap-2 bg-[#4ade80] text-[#0f1a14] px-8 py-4 rounded-full text-[14px] font-bold hover:bg-[#22c55e] transition-colors mt-8">
            Start Free Analysis
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0f1a14] border-t border-[#1a2e20]">
        <div className="max-w-[1180px] mx-auto px-6 py-8 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-[#1a3a2a] rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-[#4ade80]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="text-[13px] font-semibold text-[#7a8a7f]">SEO Agent</span>
          </div>
          <div className="flex items-center gap-8 text-[12px] text-[#4a5a4f]">
            <Link href="/docs" className="hover:text-[#7a8a7f] transition-colors">API Docs</Link>
            <Link href="/login" className="hover:text-[#7a8a7f] transition-colors">Login</Link>
            <Link href="/signup" className="hover:text-[#7a8a7f] transition-colors">Sign Up</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureRow({ label, title, desc, align }: { label: string; title: string; desc: string; align: "left" | "right" }) {
  return (
    <div className={`flex items-center gap-16 ${align === "right" ? "flex-row-reverse" : ""}`}>
      <div className="flex-1">
        <p className="text-[11px] font-bold text-[#1a3a2a] uppercase tracking-widest mb-3">{label}</p>
        <h3 className="text-[28px] font-extrabold text-[#0f0f0f] tracking-tight leading-tight mb-4">{title}</h3>
        <p className="text-[14px] text-[#6b6b6b] leading-[1.8]">{desc}</p>
      </div>
      <div className="flex-1">
        <div className="bg-gradient-to-br from-[#f5f3f0] to-[#eeece8] border border-[#e0ddd6] rounded-2xl aspect-[4/3] flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-[#1a3a2a]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
              </svg>
            </div>
            <p className="text-[12px] text-[#9a9a9a] font-medium">Dashboard Preview</p>
          </div>
        </div>
      </div>
    </div>
  );
}
