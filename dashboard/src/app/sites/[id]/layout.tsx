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

  return (
    <div>
      {/* Site sub-nav */}
      <div className="flex items-center gap-6 mb-6 border-b pb-3">
        <Link href="/" className="text-xs text-[var(--text-muted)] hover:text-[var(--text)]">&larr; All Projects</Link>
        <span className="text-sm font-semibold">{domain}</span>
        <nav className="flex items-center gap-1 ml-auto">
          {[
            { href: `/sites/${id}`, label: "Overview" },
            { href: `/sites/${id}/audit`, label: "Audit" },
            { href: `/sites/${id}/links`, label: "Links" },
            { href: `/sites/${id}/research`, label: "Research" },
            { href: `/sites/${id}/briefs`, label: "Briefs" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="px-3 py-1.5 rounded-md text-xs text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-[#f1f3f4] transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
      {children}
    </div>
  );
}
