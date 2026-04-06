import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function check() {
  const { count: withEmb } = await supabase
    .from("pages")
    .select("id", { count: "exact", head: true })
    .eq("site_id", "dd93832b-3f40-412f-88ca-b093c81359d4")
    .not("embedding", "is", null);

  const { data: noEmb } = await supabase
    .from("pages")
    .select("path, word_count")
    .eq("site_id", "dd93832b-3f40-412f-88ca-b093c81359d4")
    .is("embedding", null)
    .gt("word_count", 10);

  console.log("With embedding:", withEmb);
  console.log("Without embedding (word_count > 10):", noEmb?.length);
  if (noEmb) {
    for (const p of noEmb) console.log("  Missing:", p.path, "(" + p.word_count + " words)");
  }
}

check().catch(console.error);
