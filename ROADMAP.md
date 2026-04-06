# Internal Linking & SEO/GEO Agent — Roadmap

## What This App Is

A standalone SaaS tool that audits websites, finds internal linking opportunities,
researches competitors, and generates content briefs — optimized for both
traditional search engines (Google) and AI tools (ChatGPT, Perplexity, Google AI Overviews).

**One-line pitch:**
*"Audit your website, study your competition, and know exactly what to write next —
so you rank on Google and get quoted by AI."*

---

## What We ARE Building

### Core Product
- [x] REST API (language-agnostic — any website can integrate)
- [x] Background job queue for heavy tasks (crawling, auditing, embedding)
- [x] API key authentication for multi-tenant use
- [x] Supabase (PostgreSQL + pgvector) as the database

### Module 1: Crawler
- [x] Crawl any website by giving it a URL
- [x] Extract page data: title, headings, meta, body text, existing links
- [x] Store structured page data in the database
- [x] Detect site structure (hierarchy, categories, content types)

### Module 2: Audit (SEO + GEO Health Check)
- [x] Technical SEO checks: titles, meta descriptions, heading hierarchy, image alt text, broken links
- [x] GEO checks: citability scoring (can AI quote this page?), AI crawler access (robots.txt), llms.txt
- [x] Schema/JSON-LD validation and generation (FAQ, Tour, Article, LocalBusiness, etc.)
- [x] E-E-A-T content quality assessment
- [x] Per-page score + site-wide score
- [x] Historical score tracking (see improvement over time)

### Module 3: Internal Linking Engine
- [x] Generate vector embeddings for every page (via Cohere or OpenAI)
- [x] Store embeddings in pgvector for similarity search
- [x] On new/updated page: find top related pages automatically
- [x] Suggest anchor text + target page pairs
- [x] Detect orphan pages (pages with zero inbound links)
- [x] Detect cannibalization (two pages competing for the same keyword)
- [x] Approval queue — suggestions wait for human review before applying

### Module 4: Research
- [x] Accept competitor URLs (manual or auto-discovered)
- [x] Crawl and analyze competitor content
- [x] Topic gap analysis (what they cover that you don't)
- [x] Google Search Console integration for real traffic data
- [x] Opportunity scoring: traffic potential vs. effort

### Module 5: Content Briefs (Create)
- [x] Generate structured briefs: keyword, outline, questions to answer, word count
- [x] Pre-fill internal link suggestions from Module 3
- [x] Pre-fill recommended schema type
- [x] Optional AI draft generation (via Claude API) — clearly labelled as a starting point

### Module 6: Dashboard & Integrations
- [x] Web dashboard (Next.js) — view audits, approve links, read briefs
- [x] JS embed snippet (drop-in like Google Analytics)
- [x] npm package for Next.js / React projects
- [x] Webhook support (get notified on new suggestions)

---

## What We Are NOT Building (At Least Not Now)

| Out of Scope | Why |
|---|---|
| WordPress plugin | Only after we have paying PHP customers asking for it |
| PHP SDK (Composer package) | Same — REST API works for PHP users in the meantime |
| Auto-publishing content | Too risky. Human reviews everything before it goes live |
| Full AI article writer | We generate briefs and optional drafts, not finished articles |
| Keyword volume database | We rely on Google Search Console (free) and optionally DataForSEO |
| Link building / outreach | We do internal links only. External link building is a different product |
| Rank tracking | GSC gives us position data. We don't build a separate rank tracker |
| White-label dashboard | Future feature if agencies ask for it |
| Mobile app | Web dashboard is enough for v1 |
| Multi-language UI | English-only dashboard. The tool can audit sites in any language |

---

## Build Order

### Phase 0 — Foundation (Week 1)
> Get the engine running before building any features.

- [ ] Initialize project (TypeScript + API framework)
- [ ] Set up Supabase project + enable pgvector
- [ ] Design database schema (sites, pages, audits, suggestions, briefs)
- [ ] Set up API with key-based authentication
- [ ] Set up background job queue
- [ ] Basic error handling and logging

### Phase 1 — Crawler (Week 2)
> The app needs to "see" a website before it can help it.

- [ ] Build URL crawler (respect robots.txt, rate limiting)
- [ ] Extract page data (title, headings, meta, body, links)
- [ ] Store crawl results in database
- [ ] API: `POST /v1/sites` → start a crawl
- [ ] API: `GET /v1/sites/{id}/pages` → list crawled pages

### Phase 2 — Audit (Week 3–4)
> Score every page on SEO + GEO health.

- [ ] Technical SEO checker (titles, meta, headings, images, broken links)
- [ ] GEO checker (citability score, AI bot access, schema presence)
- [ ] JSON-LD schema generator (travel-specific templates)
- [ ] Composite score per page
- [ ] Store audit history
- [ ] API: `GET /v1/sites/{id}/audit`
- [ ] API: `GET /v1/pages/{id}/audit`

### Phase 3 — Internal Linking (Week 5–6)
> The core differentiator.

- [ ] Generate embeddings for all pages
- [ ] Store in pgvector
- [ ] Similarity search on new/updated pages
- [ ] Generate link suggestions (anchor text + target)
- [ ] Orphan page detection
- [ ] Approval queue table
- [ ] API: `GET /v1/sites/{id}/suggestions`
- [ ] API: `POST /v1/suggestions/{id}/approve`

### Phase 4 — Research (Week 7–8)
> Understand the competitive landscape.

- [ ] Competitor URL input + crawl
- [ ] Content comparison (topic coverage)
- [ ] Gap analysis (what's missing)
- [ ] GSC integration (impressions, clicks, CTR, position)
- [ ] Opportunity scoring
- [ ] API: `POST /v1/research` → start research job
- [ ] API: `GET /v1/research/{id}/gaps`

### Phase 5 — Content Briefs (Week 9–10)
> Turn research into writing instructions.

- [ ] Brief generator (keyword, outline, questions, word count)
- [ ] Auto-fill internal link suggestions
- [ ] Auto-fill schema recommendation
- [ ] Optional AI draft via Claude API
- [ ] API: `POST /v1/briefs` → generate brief
- [ ] API: `GET /v1/briefs/{id}`

### Phase 6 — Dashboard & Integrations (Week 11–12)
> Make it usable by non-developers.

- [ ] Next.js dashboard: site overview + scores
- [ ] Dashboard: audit results per page
- [ ] Dashboard: link suggestion approval queue
- [ ] Dashboard: content briefs viewer
- [ ] JS embed snippet
- [ ] npm package with React hooks
- [ ] Webhook events on new suggestions

---

## Tech Stack

| Layer | Technology |
|---|---|
| Language | TypeScript |
| API Framework | Hono or Express |
| Database | Supabase (PostgreSQL) |
| Vector Search | pgvector (via Supabase) |
| Embeddings | Cohere or OpenAI |
| AI (Audit + Briefs) | Claude API (Anthropic) |
| Job Queue | BullMQ or pg-boss |
| Hosting | Railway |
| Dashboard | Next.js 15 |
| Auth | API keys (v1), OAuth later |

---

## Milestones

| Milestone | What's Shippable | When |
|---|---|---|
| **v0.1** | Crawler + basic audit → "point at a URL, get a health report" | Week 4 |
| **v0.2** | + Internal linking suggestions → "see what pages should link to each other" | Week 6 |
| **v0.3** | + Research module → "know what your competitors cover that you don't" | Week 8 |
| **v0.4** | + Content briefs → "get a writing recipe for every gap" | Week 10 |
| **v1.0** | + Dashboard + integrations → "a real product anyone can use" | Week 12 |

---

## First Customer

**Travel2Egypt** — full control, real traffic, real content.
Build everything here first, then generalize for other websites.

---

*Last updated: April 6, 2026*
