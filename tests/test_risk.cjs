const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function run() {
    const { data } = await supabase.from('risk_predictions').select('*').order('created_at', { ascending: false }).limit(5);
    console.log(data.map(d => `${d.hazard_type} - ${d.risk_level}`));
}
run();
