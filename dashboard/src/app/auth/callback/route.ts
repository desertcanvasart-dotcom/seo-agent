import { createSupabaseServer } from "@/lib/supabase-server";
import { NextResponse } from "next/server";
import { createHash, randomBytes } from "crypto";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createSupabaseServer();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Create profile + API key if doesn't exist
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: existing } = await supabase.from("profiles").select("id").eq("id", user.id).single();
        if (!existing) {
          // Generate API key
          const rawKey = `sk_live_${randomBytes(32).toString("hex")}`;
          const keyHash = createHash("sha256").update(rawKey).digest("hex");

          const { data: apiKey } = await supabase.from("api_keys").insert({
            name: user.email,
            key_hash: keyHash,
            prefix: rawKey.slice(0, 16),
            scopes: ["read", "write"],
            is_active: true,
          }).select().single();

          await supabase.from("profiles").insert({
            id: user.id,
            email: user.email || "",
            full_name: user.user_metadata?.full_name || "",
            api_key_id: apiKey?.id || null,
          });
        }
      }

      return NextResponse.redirect(`${origin}/dashboard`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=Could not verify email`);
}
