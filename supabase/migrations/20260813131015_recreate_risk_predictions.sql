-- Create a backup of existing risk_predictions just in case
CREATE TABLE IF NOT EXISTS risk_predictions_backup AS SELECT * FROM risk_predictions;

-- Drop the old table (dropping constraints/indexes automatically)
DROP TABLE IF EXISTS risk_predictions CASCADE;

-- Recreate exactly as requested
CREATE TABLE risk_predictions (
  id bigint generated always as identity primary key,
  zone_id uuid references zones(id),
  hazard_type text check (hazard_type in ('flood','drought','heatwave','unseasonal')),
  risk_level text check (risk_level in ('LOW','MODERATE','HIGH','CRITICAL')),
  risk_score numeric,
  eta_peak timestamptz,
  model_reasoning_en text,
  model_reasoning_mr text,
  source text,
  fetched_at timestamptz,
  confidence numeric,
  created_at timestamptz default now()
);
CREATE INDEX risk_predictions_time_idx ON risk_predictions(created_at);
CREATE INDEX risk_predictions_zone_hazard_idx ON risk_predictions(zone_id, hazard_type, created_at desc);
ALTER TABLE risk_predictions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read risk_predictions" ON risk_predictions FOR SELECT USING (true);

-- Ensure incidents has the requested columns
ALTER TABLE incidents ADD COLUMN IF NOT EXISTS photo_url TEXT;
ALTER TABLE incidents ADD COLUMN IF NOT EXISTS ai_severity_score NUMERIC;

