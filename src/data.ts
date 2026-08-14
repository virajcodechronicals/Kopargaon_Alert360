import { HazardType, HazardRisk, EmergencyContact, Shelter } from './types';

// The offline fallback state for telemetry anomalies
export const fallback_predictions: Record<HazardType, HazardRisk> = {
  flood: {
    hazard: 'flood',
    level: 'LOW',
    telemetry: { value: 'Offline', unit: '', source: 'Local Cache', fetched_at: new Date().toISOString(), confidence: 0 }
  },
  drought: {
    hazard: 'drought',
    level: 'LOW',
    telemetry: { value: 'Offline', unit: '', source: 'Local Cache', fetched_at: new Date().toISOString(), confidence: 0 }
  },
  heatwave: {
    hazard: 'heatwave',
    level: 'LOW',
    telemetry: { value: 'Offline', unit: '', source: 'Local Cache', fetched_at: new Date().toISOString(), confidence: 0 }
  },
  unseasonal: {
    hazard: 'unseasonal',
    level: 'LOW',
    telemetry: { value: 'Offline', unit: '', source: 'Local Cache', fetched_at: new Date().toISOString(), confidence: 0 }
  },
};

export const offlineContacts: EmergencyContact[] = [
  { role: 'Tehsildar Office', name: 'Kopargaon HQ', phone: '02423-222045' },
  { role: 'Disaster Management', name: 'Control Room', phone: '1077' },
  { role: 'Primary Health Centre', name: 'Sanjivani Med', phone: '108' },
];

export const offlineShelters: Shelter[] = [
  { id: 'offline-1', name: 'K. J. Somaiya College', location: { lat: 19.88, lng: 74.47 }, capacity: 500, current_occupancy: 0, status: 'standby' },
  { id: 'offline-2', name: 'SSGM College', location: { lat: 19.89, lng: 74.48 }, capacity: 350, current_occupancy: 0, status: 'standby' },
  { id: 'offline-3', name: 'Municipal Council Hall', location: { lat: 19.885, lng: 74.475 }, capacity: 200, current_occupancy: 0, status: 'standby' },
];
