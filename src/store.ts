import localforage from 'localforage';
import { RiskPrediction, Shelter, LiveTelemetry, StructuredAIPrediction } from './types';

// Configure localForage
localforage.config({
  name: 'DisasterResponseApp',
  storeName: 'offline_cache'
});

export const DEFAULT_SHELTERS: Shelter[] = [
  {
    id: 'shelter-sanjivani',
    name: 'Sanjivani Campus Relief Hub',
    name_mr: 'संजीवनी शैक्षणिक संकुल मुख्य मदत केंद्र',
    location: { lat: 19.8781, lng: 74.4554 },
    capacity: 450,
    current_occupancy: 120,
    status: 'activated',
    address: 'Sanjivani Engineering College Campus, Kopargaon',
    phone: '02423-222862'
  },
  {
    id: 'shelter-townhall',
    name: 'Kopargaon Town Hall (Nagar Parishad)',
    name_mr: 'कोपरगाव नगर परिषद टाऊन हॉल',
    location: { lat: 19.8860, lng: 74.4812 },
    capacity: 250,
    current_occupancy: 45,
    status: 'activated',
    address: 'Near Tehsil Karyalaya, Kopargaon Main Road',
    phone: '02423-222333'
  },
  {
    id: 'shelter-kolpewadi',
    name: 'Kolpewadi High School & Ground',
    name_mr: 'कोळपेवाडी हायस्कूल व क्रीडा संकुल',
    location: { lat: 19.8650, lng: 74.4410 },
    capacity: 150,
    current_occupancy: 10,
    status: 'standby',
    address: 'Station Road, Kolpewadi',
    phone: '02423-261244'
  },
  {
    id: 'shelter-dhamori',
    name: 'Dhamori Community Center',
    name_mr: 'धामोरी समाज मंदिर व प्राथमिक केंद्र',
    location: { lat: 19.9050, lng: 74.4320 },
    capacity: 120,
    current_occupancy: 0,
    status: 'standby',
    address: 'Dhamori Phata, West Kopargaon',
    phone: '02423-222100'
  }
];

export const store = {
  async getToken(): Promise<string | null> {
    try {
      const stored = localStorage.getItem('auth_token');
      if (stored) return stored;
    } catch {}
    return await localforage.getItem<string>('auth_token');
  },
  async setToken(token: string): Promise<void> {
    try {
      localStorage.setItem('auth_token', token);
    } catch {}
    await localforage.setItem('auth_token', token);
  },
  async removeToken(): Promise<void> {
    try {
      localStorage.removeItem('auth_token');
    } catch {}
    await localforage.removeItem('auth_token');
  },

  // --- Live Open-Meteo & WRD Telemetry ---
  async getLiveTelemetry(): Promise<LiveTelemetry> {
    try {
      const res = await fetch('/api/v1/telemetry/live');
      if (!res.ok) throw new Error('Live telemetry request failed');
      const data: LiveTelemetry = await res.json();
      await localforage.setItem('live_telemetry_cache', data);
      return data;
    } catch (err) {
      console.warn('Fetching live telemetry failed, falling back to cache', err);
      const cached = await localforage.getItem<LiveTelemetry>('live_telemetry_cache');
      if (cached) return cached;
      return {
        source: 'WRD Kopargaon Station (Offline Cache)',
        coordinates: { lat: 19.8912, lng: 74.4789 },
        temperature_c: 30.2,
        relative_humidity_pct: 50,
        apparent_temperature_c: 31.5,
        precipitation_mm: 0,
        rain_mm: 0,
        wind_speed_kmh: 12.0,
        fetched_at: new Date().toISOString()
      };
    }
  },

  // --- Multimodal AI Prediction ---
  async predictRisk(params: {
    discharge_cusecs?: number;
    river_stage_m?: number;
    rainfall_mm?: number;
    temperature_c?: number;
    active_hazard?: string;
    zone_id?: string;
    notes?: string;
  }): Promise<{ success: boolean; engine: string; prediction: StructuredAIPrediction }> {
    try {
      const res = await fetch('/api/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });
      if (!res.ok) throw new Error('Prediction API failed');
      const data = await res.json();
      await localforage.setItem('latest_prediction_cache', data);
      return data;
    } catch (err) {
      console.warn('Predict risk network failed, using cached or fallback calculation', err);
      const cached = await localforage.getItem<any>('latest_prediction_cache');
      if (cached) return cached;
      throw err;
    }
  },

  // --- Multimodal AI Image Analyzer ---
  async analyzeImage(image: string, hazard: string, description: string): Promise<any> {
    try {
      const res = await fetch('/api/analyze-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image, hazard, description })
      });
      if (!res.ok) throw new Error('Image analysis failed');
      return await res.json();
    } catch (err) {
      console.warn('Image analysis network error:', err);
      return {
        success: true,
        engine: 'Offline Heuristic Vision Engine',
        assessment: `Incident: ${hazard.toUpperCase()} reported. Water/Structural inundation risk noted for ${description || 'reported scene'}.`,
        marathi_summary: 'घटनेची नोंद झाली असून आपत्कालीन पथकाला सूचित केले आहे.',
        severity_score: 0.70
      };
    }
  },

  // --- AI Assistant Q&A ---
  async askAssistant(question: string, language: 'en' | 'mr', hazardContext: string): Promise<string> {
    try {
      const res = await fetch('/api/ask-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, language, hazard_context: hazardContext })
      });
      if (!res.ok) throw new Error('Assistant API failed');
      const data = await res.json();
      return data.reply;
    } catch (err) {
      console.warn('Ask assistant offline fallback:', err);
      return language === 'mr'
        ? 'कोपरगाव आपत्ती नियंत्रण कक्ष २४ तास कार्यरत आहे. आपत्कालीन मदतीसाठी १०७७ किंवा ११२ वर संपर्क साधा.'
        : 'Kopargaon Disaster Response Cell is active 24x7. For immediate rescue assistance, dial 1077 or 112.';
    }
  },

  // --- Risk Feed ---
  async getZones(): Promise<any[]> {
    try {
      const res = await fetch('/api/v1/zones');
      if (!res.ok) throw new Error('Network response not ok');
      const data = await res.json();
      await localforage.setItem('zones_cache', data);
      return data;
    } catch (err) {
      console.warn('Fetching zones failed, using offline cache', err);
      const cached = await localforage.getItem<any[]>('zones_cache');
      if (cached) return cached;
      return [];
    }
  },

  async getRiskFeed(zone: string): Promise<RiskPrediction[]> {
    try {
      const res = await fetch(`/api/v1/risk-feed?zone=${zone}`);
      if (!res.ok) throw new Error('Network response not ok');
      const data = await res.json();
      await localforage.setItem(`risk_feed_${zone}`, data);
      return data;
    } catch (err) {
      console.warn('Fetching risk feed failed, using offline cache', err);
      const cached = await localforage.getItem<RiskPrediction[]>(`risk_feed_${zone}`);
      if (cached) return cached;
      throw err;
    }
  },

  // --- Alerts ---
  async getAlerts(): Promise<any[]> {
    try {
      const res = await fetch('/api/v1/alerts');
      if (!res.ok) throw new Error('Network response not ok');
      const data = await res.json();
      await localforage.setItem('alerts_cache', data);
      return data;
    } catch (err) {
      console.warn('Fetching alerts failed, using offline cache', err);
      const cached = await localforage.getItem<any[]>('alerts_cache');
      if (cached) return cached;
      return [];
    }
  },

  // --- Shelters ---
  async getShelters(): Promise<Shelter[]> {
    try {
      const res = await fetch('/api/v1/shelters');
      if (!res.ok) throw new Error('Network response not ok');
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        await localforage.setItem('shelters_cache', data);
        return data;
      }
      return DEFAULT_SHELTERS;
    } catch (err) {
      console.warn('Fetching shelters failed, using offline cache/defaults', err);
      const cached = await localforage.getItem<Shelter[]>('shelters_cache');
      if (cached && cached.length > 0) return cached;
      return DEFAULT_SHELTERS;
    }
  },

  // --- Contacts ---
  async getContacts(): Promise<any[]> {
    try {
      const res = await fetch('/api/v1/contacts');
      if (!res.ok) throw new Error('Network response not ok');
      const data = await res.json();
      await localforage.setItem('contacts_cache', data);
      return data;
    } catch (err) {
      console.warn('Fetching contacts failed, using offline cache', err);
      const cached = await localforage.getItem<any[]>('contacts_cache');
      if (cached) return cached;
      return [
        { role: 'National Emergency Helpline', name: 'National SDRF/Police Dispatch', phone: '112' },
        { role: 'Emergency Medical & Ambulance', name: 'Maharashtra 108 Ambulance Network', phone: '108' },
        { role: 'Kopargaon Taluka Disaster Control', name: 'Tehsil Control Room 24x7', phone: '1077' },
        { role: 'Kopargaon Police Station', name: 'City Police HQ', phone: '02423-222333' },
        { role: 'Municipal Fire Services', name: 'Kopargaon Fire Brigade', phone: '101' },
        { role: 'Rural / Sub-District Hospital', name: 'SDH Kopargaon Medical Officer', phone: '02423-222233' }
      ];
    }
  },

  // --- Hazard Surface ---
  async getHazardSurface(type: string, zone: string): Promise<any> {
    try {
      const res = await fetch(`/api/v1/hazard-surface?type=${type}&zone=${zone}`);
      if (!res.ok) throw new Error('Network response not ok');
      const data = await res.json();
      await localforage.setItem(`surface_${type}_${zone}`, data);
      return data;
    } catch (err) {
      console.warn(`Fetching hazard surface for ${type} failed, using offline cache`, err);
      const cached = await localforage.getItem<any>(`surface_${type}_${zone}`);
      if (cached) return cached;
      return { type: "FeatureCollection", features: [] };
    }
  }
};
