import { getSites } from "@/lib/api";
import { redirect } from "next/navigation";

export default async function AuditRedirect() {
  const data = await getSites().catch(() => null);
  const sites = data?.sites || [];
  if (sites.length > 0) redirect(`/sites/${sites[0].id}/audit`);
  return <div className="card"><div className="card-body text-center py-12 text-[var(--text-muted)] text-sm">Add a site first to see audit results.</div></div>;
}
