import { createSupabaseServer } from "@/lib/supabase-server";
import { redirect } from "next/navigation";

export async function POST() {
  const supabase = await createSupabaseServer();
  await supabase.auth.signOut();
  redirect("/login");
}
