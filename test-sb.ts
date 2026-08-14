import { createClient } from "@supabase/supabase-js";
const url = process.env.SUPABASE_URL || "https://kapxdccnullmjvhcewcb.supabase.co";
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!key) {
  console.log("No key found in environment.");
  process.exit(1);
}
const supabase = createClient(url, key);
async function test() {
  const { data, error } = await supabase.from('zones').select('*').limit(1);
  if (error) {
    console.error("Connection failed:", error.message);
  } else {
    console.log("Connection successful! Data:", data);
  }
}
test();
