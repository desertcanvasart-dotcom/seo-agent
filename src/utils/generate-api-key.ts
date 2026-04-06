import { randomBytes } from "crypto";
import { hashApiKey } from "../api/middleware/auth.js";
import { supabase } from "../db/client.js";

async function generateApiKey(name: string) {
  // Generate a random key: sk_live_<32 random hex chars>
  const raw = `sk_live_${randomBytes(32).toString("hex")}`;
  const prefix = raw.slice(0, 16);
  const keyHash = hashApiKey(raw);

  const { data, error } = await supabase
    .from("api_keys")
    .insert({
      name,
      key_hash: keyHash,
      prefix,
      scopes: ["read", "write"],
      is_active: true,
    })
    .select()
    .single();

  if (error) {
    console.error("Failed to create API key:", error.message);
    process.exit(1);
  }

  console.log("\n✅ API Key created!\n");
  console.log(`   Name:   ${name}`);
  console.log(`   Key:    ${raw}`);
  console.log(`   Prefix: ${prefix}`);
  console.log(`   ID:     ${data.id}`);
  console.log(`\n⚠️  Save this key now — it cannot be retrieved later.\n`);
}

const name = process.argv[2] || "default";
generateApiKey(name);
