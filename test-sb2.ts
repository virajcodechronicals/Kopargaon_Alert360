import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL || "https://kapxdccnullmjvhcewcb.supabase.co";
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!key) {
  console.error("No SUPABASE_SERVICE_ROLE_KEY found in environment.");
  process.exit(1);
}

const supabase = createClient(url, key);

async function checkDatabase() {
  console.log("Checking Database Connection...");
  
  const { data, error } = await supabase.from('zones').select('count');
  
  if (error) {
    console.error("❌ Database Error:", error.message);
  } else {
    console.log("✅ Database Connection: SUCCESS");
    console.log("✅ Tables: ACTIVE");
  }
  
  const jwt = process.env.JWT_SECRET;
  if (!jwt || jwt === "your_jwt_secret_here") {
    console.log("⚠️ JWT_SECRET: MISSING OR DEFAULT (Needs to be set in Settings)");
  } else {
    console.log("✅ JWT_SECRET: SET");
  }
}

checkDatabase();
