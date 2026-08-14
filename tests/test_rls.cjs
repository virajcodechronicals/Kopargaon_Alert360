// Smoke Test Script for Supabase RLS Policies
// Run this after provisioning your Supabase project.
// 
// Requires SUPABASE_URL, SUPABASE_ANON_KEY, and a valid citizen JWT and authority JWT.
// Usage: node test_rls.js

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.log("Skipping smoke test: SUPABASE_URL or SUPABASE_ANON_KEY not set.");
  process.exit(0);
}

// Anon Client
const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);

// Simulated authenticated clients (you would need to replace these with real JWTs or signInWithPassword calls)
// const supabaseCitizen = createClient(supabaseUrl, supabaseAnonKey, { global: { headers: { Authorization: `Bearer ${CITIZEN_JWT}` } } });
// const supabaseAuthority = createClient(supabaseUrl, supabaseAnonKey, { global: { headers: { Authorization: `Bearer ${AUTHORITY_JWT}` } } });

async function runTests() {
  console.log("Running RLS Smoke Tests...");

  // Test 1: Anon can read zones and risk_predictions
  const { data: zones, error: zoneErr } = await supabaseAnon.from('zones').select('*').limit(1);
  console.log("Anon read zones:", zoneErr ? "FAIL" : "PASS");

  // Test 2: Anon CANNOT read audit_logs
  const { data: audits, error: auditErr } = await supabaseAnon.from('audit_logs').select('*');
  console.log("Anon read audit_logs (should fail):", auditErr ? "PASS (Blocked)" : "FAIL (Not Blocked)");

  // Test 3: Anon CANNOT insert alerts
  const { error: alertErr } = await supabaseAnon.from('alerts').insert({
    hazard: 'flood', severity: 'HIGH', message_en: 'test', message_mr: 'test'
  });
  console.log("Anon insert alerts (should fail):", alertErr ? "PASS (Blocked)" : "FAIL (Not Blocked)");

  console.log("Tests complete. To test Citizen/Authority roles, supply valid JWTs to the client initialization.");
}

runTests();
