import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";
import { createHash } from "crypto";
import { supabase } from "../../db/client.js";
import type { AppEnv } from "../../types/hono.js";

export function hashApiKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

export const authMiddleware = createMiddleware<AppEnv>(async (c, next) => {
  const header = c.req.header("Authorization");

  if (!header?.startsWith("Bearer ")) {
    throw new HTTPException(401, { message: "Missing API key. Use: Authorization: Bearer <key>" });
  }

  const key = header.slice(7);
  const keyHash = hashApiKey(key);

  const { data, error } = await supabase
    .from("api_keys")
    .select("id, name, scopes, is_active")
    .eq("key_hash", keyHash)
    .single();

  if (error || !data) {
    throw new HTTPException(401, { message: "Invalid API key" });
  }

  if (!data.is_active) {
    throw new HTTPException(403, { message: "API key is disabled" });
  }

  // Update last used timestamp
  await supabase
    .from("api_keys")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", data.id);

  // Attach key info to context
  c.set("apiKeyId", data.id);
  c.set("apiKeyName", data.name);
  c.set("apiKeyScopes", data.scopes);

  await next();
});
