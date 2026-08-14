import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from './Auth';
import { HazardType, RiskLevel, Shelter } from '../types';
import { HAZARD_PALETTES, getHazardTonalStyle } from './HazardPalettes';
import { store } from '../store';

type AuthorityTab = 'overview' | 'flood' | 'drought' | 'heatwave' | 'unseasonal' | 'incidents' | 'alerts' | 'analytics';

const TABS: { id: AuthorityTab; label: string; icon: string }[] = [
  { id: 'overview', label: 'Overview', icon: 'dashboard' },
  { id: 'flood', label: 'Flood', icon: 'water_drop' },
  { id: 'drought', label: 'Drought', icon: 'grass' },
  { id: 'heatwave', label: 'Heatwave', icon: 'thermostat' },
  { id: 'unseasonal', label: 'Unseasonal', icon: 'thunderstorm' },
  { id: 'incidents', label: 'Incidents', icon: 'report' },
  { id: 'alerts', label: 'Alerts', icon: 'campaign' },
  { id: 'analytics', label: 'Analytics', icon: 'analytics' },
];

export const AuthorityDashboard = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<AuthorityTab>('overview');
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [incidents, setIncidents] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Broadcast form state
  const [broadcastHazard, setBroadcastHazard] = useState<HazardType>('flood');
  const [broadcastSeverity, setBroadcastSeverity] = useState<RiskLevel>('CRITICAL');
  const [broadcastZone, setBroadcastZone] = useState('zone-bet');
  const [broadcastEn, setBroadcastEn] = useState('CRITICAL ADVISORY: Godavari river stage exceeds 492.5m. Low-lying areas in Kopargaon must evacuate immediately to Somaiya Hall shelter.');
  const [broadcastMr, setBroadcastMr] = useState('अतिदक्षतेचा इशारा: गोदावरी पाणी पातळी ४९२.५ मीटर ओलांडली आहे. कोपरगाव नदीकाठच्या रहिवाशांनी तातडीने सोमय्या हॉलमध्ये स्थलांतर करावे.');
  const [channels, setChannels] = useState({ fcm: true, sms: true, sirens: true });

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  // Fetch initial telemetry & alerts
  useEffect(() => {
    store.getAlerts().then(setAlerts).catch(() => {});
  }, []);

  const handleBroadcastSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = await store.getToken();
      const res = await fetch('/api/v1/alerts/broadcast', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          hazard: broadcastHazard,
          severity: broadcastSeverity,
          zone_id: broadcastZone,
          message_en: broadcastEn,
          message_mr: broadcastMr
        })
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Broadcast failed');
      }

      showToast('CAP Alert broadcast dispatched across SMS, FCM & Sirens!');
      setShowBroadcastModal(false);
      store.getAlerts().then(setAlerts);
    } catch (err: any) {
      showToast('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleReadOnly = async () => {
    try {
      const token = await store.getToken();
      const res = await fetch('/api/v1/admin/toggle-read-only', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });
      const data = await res.json();
      setIsReadOnly(data.read_only);
      showToast(`Emergency Read-Only Mode: ${data.read_only ? 'ACTIVE' : 'DISABLED'}`);
    } catch (e: any) {
      showToast('Toggle failed: ' + e.message);
    }
  };

  const exportTableCSV = (data: any[], filename: string) => {
    if (!data.length) return;
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(obj => Object.values(obj).map(v => `"${v}"`).join(','));
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Exported ${filename}.csv`);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col md:flex-row isolate">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-5 right-5 z-50 px-5 py-3 rounded-2xl bg-slate-900 border border-slate-700 text-white text-sm font-semibold shadow-2xl flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-lg text-emerald-400">verified</span>
            <span>{toastMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Adaptive NavigationRail (MD/LG screens) */}
      <aside className="hidden md:flex w-64 bg-white border-r border-slate-200 flex-col justify-between p-4 shrink-0 shadow-sm">
        <div className="space-y-6">
          {/* Brand Header */}
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="w-10 h-10 rounded-2xl bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-700">
              <span className="material-symbols-outlined material-symbols-filled text-2xl">shield</span>
            </div>
            <div>
              <h1 className="font-bold text-sm text-slate-900 tracking-tight">KoparAlert Control</h1>
              <div className="text-[11px] font-mono text-emerald-700 font-semibold">SDM KOPARGAON HQ</div>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="space-y-1">
            {TABS.map(t => {
              const isSelected = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all ${
                    isSelected
                      ? 'bg-sky-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <span className={`material-symbols-outlined text-xl ${isSelected ? 'material-symbols-filled' : ''}`}>
                    {t.icon}
                  </span>
                  <span>{t.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom System Controls */}
        <div className="space-y-3 pt-4 border-t border-slate-200">
          <button
            onClick={handleToggleReadOnly}
            className={`w-full py-2.5 px-3 rounded-xl text-xs font-mono font-bold flex items-center justify-between border ${
              isReadOnly
                ? 'bg-rose-50 border-rose-300 text-rose-800'
                : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <span>EMERGENCY LOCKDOWN</span>
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: isReadOnly ? '#ef4444' : '#10b981' }} />
          </button>

          <div className="flex items-center justify-between px-2 pt-1 text-xs text-slate-500">
            <span className="truncate">{user?.name || 'Administrator'}</span>
            <button onClick={logout} className="text-rose-600 hover:text-rose-700 font-semibold">
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-y-auto pb-20 md:pb-0">
        {/* Top Control Bar */}
        <header className="px-6 py-4 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-30 shadow-sm">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold tracking-tight text-slate-900 capitalize">
              {activeTab} Management
            </h2>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
              PGCRYPTO ENCRYPTED
            </span>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3">
            <button
              id="broadcast-alert-main-btn"
              onClick={() => setShowBroadcastModal(true)}
              className="py-3 px-5 sm:px-6 rounded-2xl font-bold text-xs sm:text-sm text-white bg-rose-600 hover:bg-rose-700 active:scale-95 shadow-md flex items-center gap-2"
            >
              <span className="material-symbols-outlined material-symbols-filled text-lg sm:text-xl">
                campaign
              </span>
              <span>BROADCAST EMERGENCY ALERT</span>
            </button>

            <button
              id="authority-header-logout-btn"
              onClick={logout}
              className="py-2.5 px-3.5 rounded-xl text-xs font-bold text-slate-700 hover:text-rose-700 bg-slate-100 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 flex items-center gap-1.5 transition-colors shadow-sm"
              title="Logout from Authority Session"
            >
              <span className="material-symbols-outlined text-base text-rose-600">logout</span>
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </header>

        {/* Tab Body */}
        <div className="p-6 space-y-6 max-w-7xl mx-auto w-full">
          {/* 1. Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* KPI Cards with Display-Scale Numbers */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white border border-slate-200 p-5 rounded-3xl flex flex-col justify-between shadow-sm">
                  <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase">
                    <span>Active Bulletins</span>
                    <span className="material-symbols-outlined text-rose-600">warning</span>
                  </div>
                  <div className="text-display-lg text-slate-900 font-mono my-2 font-bold">4</div>
                  <div className="text-xs text-rose-700 font-mono font-medium">1 Critical • 2 High</div>
                </div>

                <div className="bg-white border border-slate-200 p-5 rounded-3xl flex flex-col justify-between shadow-sm">
                  <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase">
                    <span>Population at Risk</span>
                    <span className="material-symbols-outlined text-sky-600">groups</span>
                  </div>
                  <div className="text-display-lg text-slate-900 font-mono my-2 font-bold">28.4k</div>
                  <div className="text-xs text-sky-700 font-mono font-medium">Riverbank & Low-lying</div>
                </div>

                <div className="bg-white border border-slate-200 p-5 rounded-3xl flex flex-col justify-between shadow-sm">
                  <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase">
                    <span>Shelter Occupancy</span>
                    <span className="material-symbols-outlined text-emerald-600">night_shelter</span>
                  </div>
                  <div className="text-display-lg text-slate-900 font-mono my-2 font-bold">38%</div>
                  <div className="text-xs text-emerald-700 font-mono font-medium">650 / 1,050 Beds Free</div>
                </div>

                <div className="bg-white border border-slate-200 p-5 rounded-3xl flex flex-col justify-between shadow-sm">
                  <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase">
                    <span>Gangapur Inflow</span>
                    <span className="material-symbols-outlined text-blue-600">waves</span>
                  </div>
                  <div className="text-display-lg text-slate-900 font-mono my-2 font-bold">42.5k</div>
                  <div className="text-xs text-blue-700 font-mono font-medium">cfs Discharge Rate</div>
                </div>
              </div>

              {/* Multi-hazard Grid Status */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="bg-white border border-slate-200 p-6 rounded-3xl space-y-4 shadow-sm">
                  <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                    <span className="material-symbols-outlined text-sky-600">water_drop</span>
                    <span>Godavari River Basin Hydro-Status</span>
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs font-mono">
                      <span className="text-slate-600">Gauge Height (Kopargaon Bridge)</span>
                      <span className="text-sky-800 font-bold">492.30 m (Danger: 493.00 m)</span>
                    </div>
                    <div className="flex justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs font-mono">
                      <span className="text-slate-600">Dam Discharges (Upstream Combined)</span>
                      <span className="text-sky-800 font-bold">45,000 cfs (Increasing)</span>
                    </div>
                    <div className="flex justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs font-mono">
                      <span className="text-slate-600">Inundation Model Peak Projection</span>
                      <span className="text-amber-700 font-bold">ETA: +4.5 Hours [20:30 IST]</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 p-6 rounded-3xl space-y-4 shadow-sm">
                  <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                    <span className="material-symbols-outlined text-purple-600">thunderstorm</span>
                    <span>Doppler Radar & Storm Warning</span>
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs font-mono">
                      <span className="text-slate-600">Reflectivity Max (dBZ)</span>
                      <span className="text-purple-800 font-bold">54 dBZ (Hail Probable)</span>
                    </div>
                    <div className="flex justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs font-mono">
                      <span className="text-slate-600">Peak Gust Velocity</span>
                      <span className="text-purple-800 font-bold">64 km/h (Microburst Zone)</span>
                    </div>
                    <div className="flex justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs font-mono">
                      <span className="text-slate-600">Protected Agricultural Zone</span>
                      <span className="text-emerald-700 font-bold">Dhamori & Sanvatsar</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 2. Hazard Specific Tabs (Flood, Drought, Heatwave, Unseasonal) */}
          {(['flood', 'drought', 'heatwave', 'unseasonal'] as HazardType[]).includes(activeTab as HazardType) && (
            <div className="bg-white border border-slate-200 p-6 rounded-3xl space-y-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center" style={{ color: HAZARD_PALETTES[activeTab as HazardType].baseColor }}>
                  <span className="material-symbols-outlined material-symbols-filled text-3xl">
                    {HAZARD_PALETTES[activeTab as HazardType].symbol}
                  </span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 capitalize">
                    {activeTab} Tactical Vector
                  </h3>
                  <p className="text-xs text-slate-500">
                    Live sensor ingestion, predictive curves, and targeted mitigation protocols
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <div className="text-xs text-slate-500 uppercase font-mono">Telemetry Source</div>
                  <div className="text-lg font-bold text-slate-900 mt-1">Maharashtra WRD & CWC</div>
                  <div className="text-[11px] text-emerald-700 font-mono mt-1 font-semibold">Confidence 98.4%</div>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <div className="text-xs text-slate-500 uppercase font-mono">Active Model</div>
                  <div className="text-lg font-bold text-slate-900 mt-1">Gemini Hydro-Vision</div>
                  <div className="text-[11px] text-sky-700 font-mono mt-1 font-semibold">Auto-scoring ground reports</div>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <div className="text-xs text-slate-500 uppercase font-mono">Response Protocol</div>
                  <div className="text-lg font-bold text-slate-900 mt-1">Stage III Evacuation</div>
                  <div className="text-[11px] text-amber-700 font-mono mt-1 font-semibold">Sanjivani Medical PHC Alerted</div>
                </div>
              </div>
            </div>
          )}

          {/* 3. Incidents Tab */}
          {activeTab === 'incidents' && (
            <div className="bg-white border border-slate-200 p-6 rounded-3xl space-y-4 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-lg">Citizen Ground-Truth Reports</h3>
                <button
                  onClick={() => exportTableCSV([
                    { id: 'INC-101', hazard: 'flood', reporter: 'Citizen #402', lat: 19.887, lng: 74.476, score: 0.88, status: 'Verified' },
                    { id: 'INC-102', hazard: 'unseasonal', reporter: 'Citizen #108', lat: 19.892, lng: 74.481, score: 0.75, status: 'Pending Action' }
                  ], 'citizen_incidents')}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-mono text-slate-700 border border-slate-300 flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-sm">download</span>
                  <span>Export CSV</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                    <tr>
                      <th className="p-3">ID</th>
                      <th className="p-3">HAZARD</th>
                      <th className="p-3">SEVERITY</th>
                      <th className="p-3">COORDINATES</th>
                      <th className="p-3">AI SCORE</th>
                      <th className="p-3">STATUS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr className="hover:bg-slate-50">
                      <td className="p-3 text-sky-700 font-bold">#INC-883</td>
                      <td className="p-3 uppercase">Flood</td>
                      <td className="p-3 text-rose-600 font-bold">CRITICAL</td>
                      <td className="p-3 text-slate-600">19.8871° N, 74.4762° E</td>
                      <td className="p-3 text-emerald-700 font-bold">0.94 / 1.0</td>
                      <td className="p-3"><span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">Verified</span></td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="p-3 text-sky-700 font-bold">#INC-884</td>
                      <td className="p-3 uppercase">Unseasonal</td>
                      <td className="p-3 text-amber-700 font-bold">HIGH</td>
                      <td className="p-3 text-slate-600">19.8912° N, 74.4820° E</td>
                      <td className="p-3 text-emerald-700 font-bold">0.82 / 1.0</td>
                      <td className="p-3"><span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 font-bold">Reviewing</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 4. Analytics Tab with Exportable Tables and Tabular Figure Typography */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <div className="bg-white border border-slate-200 p-6 rounded-3xl space-y-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-slate-900 text-lg">Sensor Telemetry Log & Risk Vector Matrix</h3>
                    <p className="text-xs text-slate-500">Tabular figures for precision hydro-meteorological analysis</p>
                  </div>
                  <button
                    onClick={() => exportTableCSV([
                      { timestamp: '2026-08-13 16:00', gauge_m: 492.30, inflow_cfs: 42500, temp_c: 41.5, soil_moist_pct: 12.4, spi: -2.14 },
                      { timestamp: '2026-08-13 15:00', gauge_m: 491.80, inflow_cfs: 38000, temp_c: 42.1, soil_moist_pct: 13.0, spi: -2.12 },
                      { timestamp: '2026-08-13 14:00', gauge_m: 491.20, inflow_cfs: 32000, temp_c: 43.4, soil_moist_pct: 13.8, spi: -2.10 }
                    ], 'kopargaon_telemetry_matrix')}
                    className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-xs font-bold text-white flex items-center gap-1.5 shadow-sm"
                  >
                    <span className="material-symbols-outlined text-base">download</span>
                    <span>Download Full CSV Dataset</span>
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono tabular-nums">
                    <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                      <tr>
                        <th className="p-3">TIMESTAMP (IST)</th>
                        <th className="p-3">RIVER STAGE (M)</th>
                        <th className="p-3">DISCHARGE (CFS)</th>
                        <th className="p-3">TEMP (°C)</th>
                        <th className="p-3">SOIL MOISTURE (%)</th>
                        <th className="p-3">3-MO SPI</th>
                        <th className="p-3">RADAR CELL (dBZ)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      <tr className="hover:bg-slate-50">
                        <td className="p-3 text-slate-600">16:00 IST</td>
                        <td className="p-3 text-sky-800 font-bold">492.30</td>
                        <td className="p-3 text-sky-800 font-bold">42,500</td>
                        <td className="p-3 text-amber-700 font-bold">41.5</td>
                        <td className="p-3 text-orange-700 font-bold">12.4</td>
                        <td className="p-3 text-rose-700 font-bold">-2.14</td>
                        <td className="p-3 text-purple-700 font-bold">54.0</td>
                      </tr>
                      <tr className="hover:bg-slate-50">
                        <td className="p-3 text-slate-600">15:00 IST</td>
                        <td className="p-3 text-sky-800 font-bold">491.80</td>
                        <td className="p-3 text-sky-800 font-bold">38,000</td>
                        <td className="p-3 text-amber-700 font-bold">42.1</td>
                        <td className="p-3 text-orange-700 font-bold">13.0</td>
                        <td className="p-3 text-rose-700 font-bold">-2.12</td>
                        <td className="p-3 text-purple-700 font-bold">48.2</td>
                      </tr>
                      <tr className="hover:bg-slate-50">
                        <td className="p-3 text-slate-600">14:00 IST</td>
                        <td className="p-3 text-sky-800 font-bold">491.20</td>
                        <td className="p-3 text-sky-800 font-bold">32,000</td>
                        <td className="p-3 text-amber-700 font-bold">43.4</td>
                        <td className="p-3 text-orange-700 font-bold">13.8</td>
                        <td className="p-3 text-rose-700 font-bold">-2.10</td>
                        <td className="p-3 text-purple-700 font-bold">35.6</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* 5. Alerts History Tab */}
          {activeTab === 'alerts' && (
            <div className="bg-white border border-slate-200 p-6 rounded-3xl space-y-4 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-lg">Broadcast History & CAP Transmissions</h3>
                <button
                  onClick={() => setShowBroadcastModal(true)}
                  className="px-4 py-2 rounded-xl bg-rose-600 text-xs font-bold text-white flex items-center gap-1.5 shadow-sm"
                >
                  <span className="material-symbols-outlined text-base">add_alert</span>
                  <span>New Broadcast</span>
                </button>
              </div>

              <div className="space-y-3">
                {alerts.map((al, idx) => (
                  <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold font-mono px-2 py-0.5 rounded bg-rose-100 text-rose-800 uppercase">
                          {al.severity || 'CRITICAL'} • {al.hazard || 'flood'}
                        </span>
                        <span className="text-[11px] font-mono text-slate-500">
                          {new Date(al.created_at || Date.now()).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-xs text-slate-800 font-medium">
                        {al.message_en || al.message_mr}
                      </p>
                    </div>
                    <span className="text-xs font-mono text-emerald-700 font-bold">DELIVERED</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Adaptive NavigationBar for Mobile Screens */}
      <div className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-slate-200 px-2 py-1 flex justify-around shadow-lg">
        {TABS.slice(0, 5).map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`p-2 flex flex-col items-center gap-0.5 text-[10px] font-bold ${
              activeTab === t.id ? 'text-sky-600' : 'text-slate-500'
            }`}
          >
            <span className="material-symbols-outlined text-xl">{t.icon}</span>
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* Broadcast Alert Modal */}
      <AnimatePresence>
        {showBroadcastModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-xl bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-2xl flex flex-col"
            >
              <div className="px-6 py-4 bg-rose-50 border-b border-rose-200 flex items-center justify-between">
                <div className="flex items-center gap-2 text-rose-800">
                  <span className="material-symbols-outlined material-symbols-filled text-2xl text-rose-600">campaign</span>
                  <h3 className="font-bold text-lg text-slate-900">Broadcast Common Alerting Protocol (CAP)</h3>
                </div>
                <button
                  onClick={() => setShowBroadcastModal(false)}
                  className="w-8 h-8 rounded-full bg-rose-100 hover:bg-rose-200 text-rose-800 flex items-center justify-center"
                >
                  <span className="material-symbols-outlined text-lg">close</span>
                </button>
              </div>

              <form onSubmit={handleBroadcastSubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold uppercase text-slate-600 mb-1 block">Hazard</label>
                    <select
                      value={broadcastHazard}
                      onChange={e => setBroadcastHazard(e.target.value as HazardType)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 font-medium"
                    >
                      <option value="flood">Flood</option>
                      <option value="drought">Drought</option>
                      <option value="heatwave">Heatwave</option>
                      <option value="unseasonal">Unseasonal Storm</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase text-slate-600 mb-1 block">Severity</label>
                    <select
                      value={broadcastSeverity}
                      onChange={e => setBroadcastSeverity(e.target.value as RiskLevel)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-rose-700 font-bold"
                    >
                      <option value="CRITICAL">CRITICAL (Direct Evacuation)</option>
                      <option value="HIGH">HIGH (Preparedness Warning)</option>
                      <option value="MODERATE">MODERATE (Advisory)</option>
                      <option value="LOW">LOW (Informational)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold uppercase text-slate-600 mb-1 block">English Bulletin</label>
                  <textarea
                    rows={2}
                    value={broadcastEn}
                    onChange={e => setBroadcastEn(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 resize-none font-medium"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold uppercase text-slate-600 mb-1 block">मराठी संदेश (Marathi Bulletin)</label>
                  <textarea
                    rows={2}
                    value={broadcastMr}
                    onChange={e => setBroadcastMr(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 resize-none font-medium"
                  />
                </div>

                <div className="flex gap-4 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={channels.fcm}
                      onChange={e => setChannels({ ...channels, fcm: e.target.checked })}
                      className="accent-sky-600"
                    />
                    <span>Push Notifications (FCM)</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={channels.sms}
                      onChange={e => setChannels({ ...channels, sms: e.target.checked })}
                      className="accent-sky-600"
                    />
                    <span>Cell Broadcast / SMS</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={channels.sirens}
                      onChange={e => setChannels({ ...channels, sirens: e.target.checked })}
                      className="accent-sky-600"
                    />
                    <span>Municipal Sirens</span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 px-6 rounded-2xl font-bold text-sm text-white bg-rose-600 hover:bg-rose-700 active:scale-95 shadow-md flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined">send</span>
                  <span>{loading ? 'Dispatched to Gateways...' : 'TRANSMIT BROADCAST NOW'}</span>
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
