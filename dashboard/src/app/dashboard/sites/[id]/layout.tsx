import Link from "next/link";
import { getSite } from "@/lib/api";

export default async function SiteLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const siteData = await getSite(id).catch(() => null);
  const domain = siteData?.site?.domain || "Unknown";

  const tabs = [
    { href: `/dashboard/sites/${id}`, label: "Overview" },
    { href: `/dashboard/sites/${id}/audit`, label: "Audit" },
    { href: `/dashboard/sites/${id}/links`, label: "Links" },
    { href: `/dashboard/sites/${id}/research`, label: "Research" },
    { href: `/dashboard/sites/${id}/briefs`, label: "Briefs" },
  ];

  return (
    <div>
      {/* Site header */}
      <div className="flex items-center gap-3 mb-2">
        <Link href="/dashboard" className="text-[#8c8c8c] hover:text-[#5c5c5c] transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div className="w-9 h-9 bg-[#e8f0e8] rounded-lg flex items-center justify-center">
          <span className="text-[#2d5a3d] font-bold text-sm">{domain.charAt(0).toUpperCase()}</span>
        </div>
        <div>
          <h1 className="font-semibold text-[15px] text-[#1a1a1a]">{domain}</h1>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-6 border-b border-[#e8e5e0] -mx-8 px-8">
        {tabs.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className="px-4 py-2.5 text-[13px] text-[#5c5c5c] hover:text-[#1a1a1a] border-b-2 border-transparent hover:border-[#2d5a3d]/30 transition-colors -mb-px"
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {children}
    </div>
  );
}
