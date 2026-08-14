const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function run() {
    const { data, error } = await supabase.from('risk_predictions').select('*').order('created_at', { ascending: false }).limit(20);
    if (error) console.error("Error:", error);
    else console.log(JSON.stringify(data, null, 2));
}
run();
