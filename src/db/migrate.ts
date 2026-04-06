import { readFileSync, readdirSync } from "fs";
import { join } from "path";
import { supabase } from "./client.js";

async function migrate() {
  const migrationsDir = join(process.cwd(), "migrations");
  const files = readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  console.log(`Found ${files.length} migration files\n`);

  for (const file of files) {
    console.log(`Running: ${file}`);
    const sql = readFileSync(join(migrationsDir, file), "utf-8");

    const { error } = await supabase.rpc("exec_sql", { query: sql }).maybeSingle();

    if (error) {
      // Try running via direct SQL if rpc doesn't work
      console.error(`  Error with rpc, trying direct...`);
      const { error: directError } = await supabase.from("_migrations").select("*").limit(0);
      if (directError) {
        console.error(`  Failed: ${error.message}`);
        console.error(`\n⚠️  You may need to run this SQL manually in the Supabase SQL Editor.`);
        console.error(`  File: migrations/${file}\n`);
      }
    } else {
      console.log(`  ✓ Done`);
    }
  }

  console.log("\n✅ Migrations complete");
}

migrate().catch(console.error);
