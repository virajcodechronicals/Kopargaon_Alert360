-- Extension for spatial data
CREATE EXTENSION IF NOT EXISTS postgis;

-- 1. Helper function for RLS
-- Extracts role from Supabase auth.jwt() claims or defaults to 'citizen'
CREATE OR REPLACE FUNCTION get_current_user_role() RETURNS text AS $$
  SELECT COALESCE(NULLIF(current_setting('request.jwt.claims', true)::json->>'role', ''), 'citizen')::text;
$$ LANGUAGE SQL STABLE;

-- 2. Core Entities
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    role TEXT NOT NULL DEFAULT 'citizen' CHECK (role IN ('citizen', 'authority', 'admin')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE zones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    boundary GEOMETRY(Polygon, 4326) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_zones_boundary ON zones USING GIST (boundary);

-- 3. Telemetry / Time-Series Tables
-- Shared schema structure applied to all hazard sources
CREATE TABLE reservoir_telemetry (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    zone_id UUID REFERENCES zones(id),
    value NUMERIC,
    unit TEXT,
    source TEXT NOT NULL,
    confidence NUMERIC NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
    superseded BOOLEAN NOT NULL DEFAULT false,
    is_gap BOOLEAN NOT NULL DEFAULT false,
    fetched_at TIMESTAMPTZ NOT NULL,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_reservoir_recorded_at ON reservoir_telemetry USING btree (recorded_at);

CREATE TABLE rainfall_observations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    zone_id UUID REFERENCES zones(id),
    value NUMERIC,
    unit TEXT,
    source TEXT NOT NULL,
    confidence NUMERIC NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
    superseded BOOLEAN NOT NULL DEFAULT false,
    is_gap BOOLEAN NOT NULL DEFAULT false,
    fetched_at TIMESTAMPTZ NOT NULL,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_rainfall_recorded_at ON rainfall_observations USING btree (recorded_at);

CREATE TABLE drought_indicators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    zone_id UUID REFERENCES zones(id),
    value NUMERIC,
    unit TEXT,
    source TEXT NOT NULL,
    confidence NUMERIC NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
    superseded BOOLEAN NOT NULL DEFAULT false,
    is_gap BOOLEAN NOT NULL DEFAULT false,
    fetched_at TIMESTAMPTZ NOT NULL,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_drought_recorded_at ON drought_indicators USING btree (recorded_at);

CREATE TABLE heatwave_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    zone_id UUID REFERENCES zones(id),
    value NUMERIC,
    unit TEXT,
    source TEXT NOT NULL,
    confidence NUMERIC NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
    superseded BOOLEAN NOT NULL DEFAULT false,
    is_gap BOOLEAN NOT NULL DEFAULT false,
    fetched_at TIMESTAMPTZ NOT NULL,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_heatwave_recorded_at ON heatwave_data USING btree (recorded_at);

CREATE TABLE unseasonal_weather_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    zone_id UUID REFERENCES zones(id),
    value NUMERIC,
    unit TEXT,
    source TEXT NOT NULL,
    confidence NUMERIC NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
    superseded BOOLEAN NOT NULL DEFAULT false,
    is_gap BOOLEAN NOT NULL DEFAULT false,
    fetched_at TIMESTAMPTZ NOT NULL,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_unseasonal_recorded_at ON unseasonal_weather_alerts USING btree (recorded_at);

-- 4. Risk Engine Output
CREATE TABLE risk_predictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    zone_id UUID REFERENCES zones(id),
    hazard_type TEXT NOT NULL,
    risk_level TEXT NOT NULL CHECK (risk_level IN ('LOW', 'MODERATE', 'HIGH', 'CRITICAL')),
    risk_score NUMERIC NOT NULL,
    eta_peak TIMESTAMPTZ,
    model_reasoning TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_risk_created_at ON risk_predictions USING btree (created_at);

-- 5. Ground Truth & Ops
CREATE TABLE incidents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id UUID REFERENCES profiles(id),
    hazard TEXT NOT NULL,
    description TEXT,
    location GEOMETRY(Point, 4326) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_incidents_location ON incidents USING GIST (location);
CREATE INDEX idx_incidents_created_at ON incidents USING btree (created_at);

CREATE TABLE alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    zone_id UUID REFERENCES zones(id),
    hazard TEXT NOT NULL,
    severity TEXT NOT NULL,
    message_en TEXT NOT NULL,
    message_mr TEXT NOT NULL,
    published BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_alerts_created_at ON alerts USING btree (created_at);

CREATE TABLE resources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL CHECK (type IN ('shelter', 'team')),
    name TEXT NOT NULL,
    location GEOMETRY(Point, 4326) NOT NULL,
    capacity INT,
    contact TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_resources_location ON resources USING GIST (location);

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action TEXT NOT NULL,
    user_id UUID REFERENCES profiles(id),
    details JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_audit_created_at ON audit_logs USING btree (created_at);

-- -----------------------------------------------------------------------------
-- ROW LEVEL SECURITY (RLS) POLICIES
-- -----------------------------------------------------------------------------

-- Enable RLS across all relevant tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE zones ENABLE ROW LEVEL SECURITY;

-- Time-Series tables (Read-only for public, written by Edge Functions bypassing RLS)
ALTER TABLE reservoir_telemetry ENABLE ROW LEVEL SECURITY;
ALTER TABLE rainfall_observations ENABLE ROW LEVEL SECURITY;
ALTER TABLE drought_indicators ENABLE ROW LEVEL SECURITY;
ALTER TABLE heatwave_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE unseasonal_weather_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read time-series" ON reservoir_telemetry FOR SELECT USING (true);
CREATE POLICY "Public read time-series" ON rainfall_observations FOR SELECT USING (true);
CREATE POLICY "Public read time-series" ON drought_indicators FOR SELECT USING (true);
CREATE POLICY "Public read time-series" ON heatwave_data FOR SELECT USING (true);
CREATE POLICY "Public read time-series" ON unseasonal_weather_alerts FOR SELECT USING (true);

-- Zones: Public read
CREATE POLICY "Public read zones" ON zones FOR SELECT USING (true);

-- Risk Predictions: Public read
CREATE POLICY "Public read risk_predictions" ON risk_predictions FOR SELECT USING (true);

-- Alerts: Public read IF published. Authorities/Admins can read all and write.
CREATE POLICY "Public read published alerts" ON alerts FOR SELECT USING (published = true);
CREATE POLICY "Authority read all alerts" ON alerts FOR SELECT USING (get_current_user_role() IN ('authority', 'admin'));
CREATE POLICY "Authority write alerts" ON alerts FOR ALL USING (get_current_user_role() IN ('authority', 'admin'));

-- Resources: Public read. Authorities/Admins write.
CREATE POLICY "Public read resources" ON resources FOR SELECT USING (true);
CREATE POLICY "Authority write resources" ON resources FOR ALL USING (get_current_user_role() IN ('authority', 'admin'));

-- Incidents: Citizens insert own. Authorities read all.
CREATE POLICY "Citizen insert own incidents" ON incidents FOR INSERT WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY "Citizen read own incidents" ON incidents FOR SELECT USING (auth.uid() = reporter_id);
CREATE POLICY "Authority read all incidents" ON incidents FOR SELECT USING (get_current_user_role() IN ('authority', 'admin'));

-- Audit Logs: Admin read only. System appends.
CREATE POLICY "Admin read audit_logs" ON audit_logs FOR SELECT USING (get_current_user_role() = 'admin');

-- Profiles: Users read own. Admin read all.
CREATE POLICY "Read own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Admin read all profiles" ON profiles FOR SELECT USING (get_current_user_role() = 'admin');
