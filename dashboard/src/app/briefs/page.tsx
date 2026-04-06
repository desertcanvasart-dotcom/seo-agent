import { getBriefs } from "@/lib/api";
import Link from "next/link";

const SITE_ID = process.env.NEXT_PUBLIC_SITE_ID || "";

export default async function BriefsPage() {
  const data = await getBriefs(SITE_ID).catch(() => null);
  const allBriefs = data?.briefs || [];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Content Briefs</h1>
        <p className="text-sm text-[#888] mt-1">{allBriefs.length} briefs ready</p>
      </div>

      {allBriefs.length === 0 ? (
        <div className="border rounded-lg p-8 text-center text-[#888] text-sm">
          No briefs yet. Generate them from research or the API.
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-[#fafafa]">
                <th className="text-left p-3 text-[#888]">Title</th>
                <th className="text-left p-3 text-[#888]">Keyword</th>
                <th className="text-left p-3 text-[#888] w-24">Schema</th>
                <th className="text-right p-3 text-[#888] w-24">Words</th>
                <th className="text-center p-3 text-[#888] w-24">Draft</th>
                <th className="text-right p-3 text-[#888] w-20"></th>
              </tr>
            </thead>
            <tbody>
              {allBriefs.map((b: any) => (
                <tr key={b.id} className="border-b last:border-0 hover:bg-[#fafafa]">
                  <td className="p-3">
                    <p className="font-medium truncate max-w-sm">{b.title_suggestion}</p>
                  </td>
                  <td className="p-3">
                    <span className="font-mono text-xs text-[#22c55e]">{b.target_keyword}</span>
                  </td>
                  <td className="p-3">
                    <span className="text-xs bg-[#f5f5f5] px-1.5 py-0.5 rounded">{b.recommended_schema}</span>
                  </td>
                  <td className="p-3 text-right tabular-nums">{b.recommended_word_count?.toLocaleString()}</td>
                  <td className="p-3 text-center">
                    {b.draft_status === "ready" ? (
                      <span className="text-xs text-[#22c55e]">Ready</span>
                    ) : b.draft_status === "generating" ? (
                      <span className="text-xs text-[#3b82f6]">Generating...</span>
                    ) : (
                      <span className="text-xs text-[#aaa]">-</span>
                    )}
                  </td>
                  <td className="p-3 text-right">
                    <Link href={`/briefs/${b.id}`} className="text-xs text-[#22c55e] hover:underline">
                      View &rarr;
                    </Link>
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
