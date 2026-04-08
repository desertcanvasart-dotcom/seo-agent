import { getBriefs } from "@/lib/api";
import { createBriefAction } from "@/lib/actions";
import Link from "next/link";

export default async function SiteBriefsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: siteId } = await params;
  const data = await getBriefs(siteId).catch(() => null);
  const allBriefs = data?.briefs || [];

  return (
    <div>
      {/* Create brief */}
      <div className="bg-white border border-[#e8e5e0] rounded-2xl mb-6">
        <div className="p-6">
          <h2 className="text-sm font-semibold mb-3">Generate New Brief</h2>
          <form action={createBriefAction} className="flex gap-3">
            <input type="hidden" name="siteId" value={siteId} />
            <input type="text" name="keyword" placeholder="Enter target keyword..." required className="w-full px-4 py-2.5 border border-[#e8e5e0] rounded-xl text-sm focus:outline-none focus:border-[#2d5a3d] flex-1" />
            <button className="bg-[#2d5a3d] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#234a31] shrink-0">Generate</button>
          </form>
        </div>
      </div>

      {allBriefs.length === 0 ? (
        <div className="bg-white border border-[#e8e5e0] rounded-2xl"><div className="p-6 text-center py-12 text-[#8c8c8c] text-sm">No briefs yet. Enter a keyword above.</div></div>
      ) : (
        <div className="bg-white border border-[#e8e5e0] rounded-2xl">
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
                  <td><span className="font-mono text-xs text-[#2d5a3d]">{b.target_keyword}</span></td>
                  <td><span className="bg-[#f1f3f4] text-[#5c5c5c] text-[11px] px-2.5 py-0.5 rounded-full font-medium">{b.recommended_schema}</span></td>
                  <td style={{ textAlign: "right" }} className="font-mono tabular-nums">{b.recommended_word_count?.toLocaleString()}</td>
                  <td style={{ textAlign: "center" }}>
                    {b.draft_status === "ready" ? <span className="bg-[#e8f0e8] text-[#2d5a3d] text-[11px] px-2.5 py-0.5 rounded-full font-medium">Ready</span>
                      : b.draft_status === "generating" ? <span className="bg-[#fef7e0] text-[#f9ab00] text-[11px] px-2.5 py-0.5 rounded-full font-medium">Generating</span>
                      : <span className="text-xs text-[#8c8c8c]">-</span>}
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <Link href={`/dashboard/sites/${siteId}/briefs/${b.id}`} className="text-[#2d5a3d] text-sm hover:underline">View &rarr;</Link>
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
