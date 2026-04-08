import { getBriefs } from "@/lib/api";
import { createBriefAction } from "@/lib/actions";
import Link from "next/link";

const SITE_ID = process.env.NEXT_PUBLIC_SITE_ID || "";

export default async function BriefsPage() {
  const data = await getBriefs(SITE_ID).catch(() => null);
  const allBriefs = data?.briefs || [];

  return (
    <div>
      <h1 className="text-xl font-semibold mb-1">Content Briefs</h1>
      <p className="text-sm text-[var(--text-secondary)] mb-6">{allBriefs.length} brief{allBriefs.length !== 1 ? "s" : ""} generated</p>

      {/* Create brief */}
      <div className="card mb-6">
        <div className="card-body">
          <h2 className="text-sm font-semibold mb-3">Generate New Brief</h2>
          <form action={createBriefAction} className="flex gap-3">
            <input type="hidden" name="siteId" value={SITE_ID} />
            <input type="text" name="keyword" placeholder="Enter target keyword..." required className="input flex-1" />
            <button className="btn btn-primary shrink-0">Generate</button>
          </form>
        </div>
      </div>

      {/* Briefs list */}
      {allBriefs.length === 0 ? (
        <div className="card"><div className="card-body text-center py-12 text-[var(--text-muted)] text-sm">No briefs yet. Enter a keyword above to generate your first brief.</div></div>
      ) : (
        <div className="card">
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Keyword</th>
                <th>Schema</th>
                <th style={{ textAlign: "right" }}>Words</th>
                <th style={{ textAlign: "center" }}>Draft</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {allBriefs.map((b: any) => (
                <tr key={b.id}>
                  <td><p className="font-medium text-sm truncate max-w-[280px]">{b.title_suggestion}</p></td>
                  <td><span className="font-mono text-xs text-[var(--accent)]">{b.target_keyword}</span></td>
                  <td><span className="badge badge-gray">{b.recommended_schema}</span></td>
                  <td style={{ textAlign: "right" }} className="font-mono tabular-nums">{b.recommended_word_count?.toLocaleString()}</td>
                  <td style={{ textAlign: "center" }}>
                    {b.draft_status === "ready" ? <span className="badge badge-green">Ready</span>
                      : b.draft_status === "generating" ? <span className="badge badge-yellow">Generating</span>
                      : <span className="text-xs text-[var(--text-muted)]">-</span>}
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <Link href={`/briefs/${b.id}`} className="btn btn-ghost btn-sm text-[var(--accent)]">View &rarr;</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
