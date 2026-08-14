export type Language = 'en' | 'mr';

export type UserRole = 'citizen' | 'authority' | 'responder';

export type HazardType = 'flood' | 'drought' | 'heatwave' | 'unseasonal';

export type RiskLevel = 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';

export interface LiveTelemetry {
  source: string;
  coordinates: { lat: number; lng: number };
  temperature_c: number;
  relative_humidity_pct: number;
  apparent_temperature_c: number;
  precipitation_mm: number;
  rain_mm: number;
  wind_speed_kmh: number;
  fetched_at: string;
}

export interface StructuredAIPrediction {
  overallRiskLevel: RiskLevel;
  riskScore: number;
  primaryThreat: string;
  estimatedImpactTime: string;
  vulnerableAreas: string[];
  recommendedActions: string[];
  evacuationRequired: boolean;
  alertHeadlineMarathi: string;
  modelReasoning?: string;
}

export interface NormalizedTelemetry {
  value: number | string;
  unit: string;
  source: string;
  fetched_at: string;
  confidence: number;
}

export interface RiskPrediction {
  zone_id: string;
  hazard_type: HazardType;
  risk_level: RiskLevel;
  risk_score: number;
  eta_peak: string;
  model_reasoning: string;
  created_at: string;
  source: string;
  fetched_at: string;
  confidence: number;
}

export interface HazardRisk {
  hazard: HazardType;
  level: RiskLevel;
  telemetry: NormalizedTelemetry;
  prediction?: RiskPrediction; // Optional because we append this layer
}

export interface EmergencyContact {
  role: string;
  name: string;
  phone: string;
}

export interface Shelter {
  id: string;
  name: string;
  name_mr?: string;
  location: { lat: number; lng: number };
  capacity: number;
  current_occupancy: number;
  status: 'standby' | 'activated';
  address?: string;
  phone?: string;
}

export interface Alert {
  id: string;
  zone_id: string;
  hazard: HazardType;
  severity: RiskLevel;
  message_en: string;
  message_mr: string;
  created_at: string;
  published?: boolean;
}
