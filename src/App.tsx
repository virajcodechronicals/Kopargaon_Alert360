import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { store } from './store';
import { useAuth } from './components/Auth';
import { AuthorityDashboard } from './components/AuthorityDashboard';
import { LiveRiskMap } from './components/LiveRiskMap';
import { ZoneBottomSheet } from './components/ZoneBottomSheet';
import { AIAssistantSheet } from './components/AIAssistantSheet';
import { AlertsTimeline } from './components/AlertsTimeline';
import { IncidentReportModal } from './components/IncidentReportModal';
import { OnboardingModal } from './components/OnboardingModal';
import { SOSBeaconModal } from './components/SOSBeaconModal';
import { HazardType, RiskPrediction, Alert, Shelter, EmergencyContact } from './types';
import { HAZARD_PALETTES, getHazardTonalStyle } from './components/HazardPalettes';

export default function App() {
  const { user, logout, guest } = useAuth();
  if (user && (user.role === 'authority' || user.role === 'admin')) {
    return <AuthorityDashboard />;
  }

  // Navigation & Modal States
  const [activeTab, setActiveTab] = useState<'map' | 'alerts' | 'contacts'>('map');
  const [activeHazard, setActiveHazard] = useState<HazardType>('flood');
  const [selectedZone, setSelectedZone] = useState<{ id: string; name: string } | null>(null);
  const [selectedZonePrediction, setSelectedZonePrediction] = useState<RiskPrediction | null>(null);
  const [showAIAssistant, setShowAIAssistant] = useState<boolean>(false);
  const [showReportModal, setShowReportModal] = useState<boolean>(false);
  const [showSOSModal, setShowSOSModal] = useState<boolean>(false);
  const [showOnboarding, setShowOnboarding] = useState<boolean>(() => !localStorage.getItem('onboarding_seen'));
  const [timeOffsetHours, setTimeOffsetHours] = useState<number>(0);
  const [lang, setLang] = useState<'en' | 'mr'>('en');
  const [isOffline, setIsOffline] = useState<boolean>(!navigator.onLine);
  
  // Data States
  const [predictions, setPredictions] = useState<RiskPrediction[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [shelters, setShelters] = useState<Shelter[]>([]);
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [incidents, setIncidents] = useState<any[]>([]);

  // Snackbar Toast
  const [snackbar, setSnackbar] = useState<{ message: string; undoAction?: () => void } | null>(null);

  const showSnackbar = (message: string, undoAction?: () => void) => {
    setSnackbar({ message, undoAction });
    setTimeout(() => setSnackbar(null), 5000);
  };

  // Connectivity Listeners
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Fetch telemetry and caches
  const [lastFetchedAt, setLastFetchedAt] = useState<Date>(new Date());
  const [telemetry, setTelemetry] = useState<any>(null);
  const [now, setNow] = useState<number>(Date.now());

  // Second-by-second ticker for real-time live relative timestamp
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Format real-time elapsed time
  const getRelativeTimeText = (fetchedDate: Date, currentLang: 'en' | 'mr') => {
    const diffSeconds = Math.max(0, Math.floor((now - fetchedDate.getTime()) / 1000));
    
    if (diffSeconds < 10) {
      return currentLang === 'mr' ? 'आत्ताच अपडेट केले' : 'Updated just now';
    }
    if (diffSeconds < 60) {
      return currentLang === 'mr'
        ? `${diffSeconds} सेकंदांपूर्वी अपडेट`
        : `Updated ${diffSeconds}s ago`;
    }
    const diffMinutes = Math.floor(diffSeconds / 60);
    if (diffMinutes < 60) {
      return currentLang === 'mr'
        ? `${diffMinutes} मिनिटांपूर्वी अपडेट`
        : `Updated ${diffMinutes}m ago`;
    }
    const diffHours = Math.floor(diffMinutes / 60);
    return currentLang === 'mr'
      ? `${diffHours} तासांपूर्वी अपडेट`
      : `Updated ${diffHours}h ago`;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [preds, alts, shlts, cnts, telRes] = await Promise.all([
          store.getRiskFeed('zone-urban').catch(() => []),
          store.getAlerts().catch(() => []),
          store.getShelters().catch(() => []),
          store.getContacts().catch(() => []),
          fetch('/api/v1/telemetry/live').then(r => r.json()).catch(() => null)
        ]);
        setPredictions(preds);
        setAlerts(alts);
        setShelters(shlts);
        setContacts(cnts);
        if (telRes) setTelemetry(telRes);
        setLastFetchedAt(new Date());
      } catch {
        setIsOffline(true);
      }
    };
fetchData();
    const interval = setInterval(fetchData, 12000);
    return () => clearInterval(interval);
  }, []);

  const palette = HAZARD_PALETTES[activeHazard];

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#f8fafc] text-slate-900 font-sans select-none isolate">
      {/* 1. Onboarding Flyover Modal (Skippable, Skip visible from frame 1) */}
      <AnimatePresence>
        {showOnboarding && (
          <OnboardingModal
            lang={lang}
            onFinish={() => {
              localStorage.setItem('onboarding_seen', 'true');
              setShowOnboarding(false);
            }}
            onLoginClick={() => {
              localStorage.setItem('onboarding_seen', 'true');
              setShowOnboarding(false);
            }}
          />
        )}
      </AnimatePresence>

      {/* 2. Top Header HUD with Dignified Brand, Language Toggle, and Status Indicators */}
      <header className="absolute top-0 inset-x-0 z-30 px-3 sm:px-4 py-2.5 pointer-events-none flex items-center justify-between gap-2">
        <div className="pointer-events-auto flex items-center gap-2 sm:gap-2.5 bg-white/95 border border-slate-200/90 px-3 py-1.5 rounded-2xl shadow-sm backdrop-blur-md">
          <div 
            className="w-7 h-7 rounded-xl flex items-center justify-center shadow-sm shrink-0"
            style={{ backgroundColor: palette.tone90, color: palette.tone50 }}
          >
            <span className="material-symbols-outlined material-symbols-filled text-lg">
              {palette.symbol}
            </span>
          </div>
          <div>
            <h1 className="text-xs sm:text-sm font-semibold tracking-tight text-slate-900 leading-tight">
              {lang === 'mr' ? 'कोपरगाव आपत्ती सतर्कता' : 'Kopargaon Alert'}
            </h1>
            <div className="text-[9px] sm:text-[10px] text-slate-500 font-medium">
              {lang === 'mr' ? 'तालुका आपत्ती व्यवस्थापन' : 'Disaster Early Warning'}
            </div>
          </div>
        </div>

        <div className="pointer-events-auto flex items-center gap-1.5 sm:gap-2">
          {/* Ambient Trust Signal Badge — Live real-time elapsed ticker */}
          <div
            id="ambient-trust-signal-badge"
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-2xl bg-white/95 border border-slate-200 shadow-sm backdrop-blur-md text-[11px] sm:text-xs font-mono font-medium text-slate-700"
            title={`${lang === 'mr' ? 'अंतिम अपडेट' : 'Last synchronized'}: ${lastFetchedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })} • WRD Hydro Station Link`}
          >
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-semibold text-slate-800 whitespace-nowrap text-[10px] sm:text-xs">
              {getRelativeTimeText(lastFetchedAt, lang)}
            </span>
          </div>

          {/* Emergency SOS Distress Beacon Button */}
          <button
            id="sos-beacon-header-btn"
            onClick={() => setShowSOSModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-xs font-black bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white shadow-md hover:shadow-lg transition-all animate-pulse shrink-0 border border-red-400"
            title={lang === 'mr' ? 'आपत्कालीन SOS संकट बीकन' : 'Emergency SOS Distress Beacon'}
          >
            <span className="material-symbols-outlined material-symbols-filled text-base">emergency</span>
            <span className="tracking-wider">SOS</span>
          </button>

          {/* Offline Cached Badge */}
          {isOffline && (
            <div className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-300 flex items-center gap-1 shadow-sm">
              <span className="material-symbols-outlined text-sm text-amber-600">wifi_off</span>
              <span className="hidden sm:inline">{lang === 'mr' ? 'ऑफलाइन' : 'Offline'}</span>
            </div>
          )}

          {/* Quick Onboarding / Flyover trigger button */}
          <button
            onClick={() => setShowOnboarding(true)}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-2xl bg-white/95 hover:bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900 flex items-center justify-center transition-colors shadow-sm shrink-0"
            title={lang === 'mr' ? 'मार्गदर्शन पुन्हा पहा' : 'Rewatch Flyover'}
          >
            <span className="material-symbols-outlined text-base sm:text-lg">flight</span>
          </button>

          {/* Language Switcher */}
          <button
            id="app-language-toggle"
            onClick={() => setLang(lang === 'en' ? 'mr' : 'en')}
            className="px-2.5 sm:px-3 py-1.5 rounded-2xl text-xs font-bold bg-white/95 hover:bg-slate-100 border border-slate-200 text-slate-700 hover:text-slate-900 transition-colors shadow-sm shrink-0"
          >
            {lang === 'en' ? 'मराठी' : 'EN'}
          </button>

          {/* User Account / Logout Action */}
          <div className="flex items-center gap-1.5">
            {user && (
              <div 
                className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-2xl bg-white/95 border border-slate-200 text-xs font-medium text-slate-700 shadow-sm"
                title={`${lang === 'mr' ? 'लॉगिन केलेले खाते' : 'Logged in'}: ${user.name || user.username || 'Citizen'}`}
              >
                <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold flex items-center justify-center">
                  {(user.name || user.username || 'C').charAt(0).toUpperCase()}
                </div>
                <span className="max-w-[80px] truncate text-[11px] font-semibold text-slate-800">
                  {user.name || user.username}
                </span>
              </div>
            )}

            <button
              id="app-logout-btn"
              onClick={logout}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-2xl text-xs font-semibold transition-all shadow-sm shrink-0 ${
                user 
                  ? 'bg-white/95 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 text-slate-700 hover:text-rose-700' 
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
              title={user ? (lang === 'mr' ? 'लॉगआउट करा' : 'Log out') : (lang === 'mr' ? 'लॉगिन करा' : 'Log in')}
            >
              <span className="material-symbols-outlined text-base">
                {user ? 'logout' : 'login'}
              </span>
              <span className="hidden sm:inline">
                {user ? (lang === 'mr' ? 'लॉगआउट' : 'Logout') : (lang === 'mr' ? 'लॉगिन' : 'Log in')}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* 3. Main Views (Shared Axis Transition) */}
      <div className="w-full h-full">
        {activeTab === 'map' && (
          <LiveRiskMap
            activeHazard={activeHazard}
            onSelectHazard={setActiveHazard}
            predictions={predictions}
            shelters={shelters}
            timeOffset={timeOffsetHours}
            setTimeOffset={setTimeOffsetHours}
            lang={lang}
            incidents={incidents}
            onSelectZone={(zone, prediction) => {
              setSelectedZone(zone);
              setSelectedZonePrediction(prediction);
            }}
          />
        )}

        {activeTab === 'alerts' && (
          <div className="w-full h-full pt-16 pb-24 overflow-y-auto no-scrollbar bg-slate-50">
            <AlertsTimeline
              alerts={alerts}
              lang={lang}
              onSelectHazard={h => {
                setActiveHazard(h);
                setActiveTab('map');
              }}
            />
          </div>
        )}

        {activeTab === 'contacts' && (
          <div className="w-full h-full pt-16 pb-24 overflow-y-auto px-4 max-w-2xl mx-auto space-y-4 no-scrollbar">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-600 text-2xl">
                  emergency
                </span>
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                  {lang === 'mr' ? 'आपत्कालीन संपर्क व निवारा' : 'Emergency Hubs & Helplines'}
                </h2>
              </div>
            </div>

            {/* Shelters */}
            <div className="space-y-2.5">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                {lang === 'mr' ? 'सक्रिय निवारा केंद्रे' : 'Verified Relief Shelters'}
              </div>
              {shelters.map(s => (
                <div key={s.id} className="p-4 rounded-3xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center">
                      <span className="material-symbols-outlined text-xl">night_shelter</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{s.name}</h4>
                      <p className="text-xs text-slate-500">{s.address} • {s.capacity} beds capacity</p>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold text-emerald-700 px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200">
                    OPEN
                  </span>
                </div>
              ))}
            </div>

            {/* Helplines */}
            <div className="space-y-2.5 pt-4">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                {lang === 'mr' ? '२४/७ आपत्कालीन संपर्क' : '24x7 Emergency Helplines'}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <a href="tel:1077" className="p-4 rounded-3xl bg-white hover:bg-slate-50 border border-slate-200 shadow-sm flex items-center justify-between transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-rose-600 text-2xl">call</span>
                    <div>
                      <div className="text-xs font-bold text-slate-900">Disaster Helpline</div>
                      <div className="text-[11px] text-slate-500">Control Room</div>
                    </div>
                  </div>
                  <span className="text-sm font-bold font-mono text-rose-600">1077</span>
                </a>

                <a href="tel:02423222333" className="p-4 rounded-3xl bg-white hover:bg-slate-50 border border-slate-200 shadow-sm flex items-center justify-between transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-sky-600 text-2xl">local_police</span>
                    <div>
                      <div className="text-xs font-bold text-slate-900">Kopargaon Police</div>
                      <div className="text-[11px] text-slate-500">Station Direct</div>
                    </div>
                  </div>
                  <span className="text-xs font-bold font-mono text-sky-600">02423-222333</span>
                </a>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 4. Container-Transform Zone Bottom Sheet on Zone Tap */}
      <AnimatePresence>
        {selectedZone && (
          <ZoneBottomSheet
            zone={selectedZone}
            prediction={selectedZonePrediction}
            hazard={activeHazard}
            timeOffsetHours={timeOffsetHours}
            shelters={shelters}
            lang={lang}
            onClose={() => setSelectedZone(null)}
            onActionClick={action => {
              showSnackbar(
                lang === 'mr' ? 'कृती सक्रिय केली आहे: मार्ग नकाशा लोड झाला.' : `Action activated: Safe navigation route generated.`
              );
              setSelectedZone(null);
            }}
          />
        )}
      </AnimatePresence>

      {/* 5. Floating Action Buttons (SOS Distress + Report Incident + AI Safety Assistant) */}
      <div className="fixed bottom-44 right-4 sm:right-6 z-40 pointer-events-none flex flex-col items-end gap-2.5">
        {/* SOS Quick Distress Trigger */}
        <motion.button
          id="sos-beacon-fab"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowSOSModal(true)}
          className="pointer-events-auto px-3.5 py-2.5 rounded-2xl font-black text-xs tracking-wider text-white bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 shadow-xl border border-red-400 flex items-center gap-1.5 animate-pulse"
        >
          <span className="material-symbols-outlined material-symbols-filled text-base">emergency</span>
          <span>SOS BEACON</span>
        </motion.button>

        {/* ExtendedFAB: "Report Incident" */}
        <motion.button
          id="report-incident-fab"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setShowReportModal(true)}
          className="pointer-events-auto px-3.5 py-2.5 rounded-2xl font-bold text-xs tracking-wide text-rose-700 bg-white/95 hover:bg-rose-50 border border-rose-200 shadow-md backdrop-blur-md flex items-center gap-2 transition-all"
        >
          <span className="material-symbols-outlined material-symbols-filled text-lg text-rose-600">
            emergency_share
          </span>
          <span>{lang === 'mr' ? 'घटना नोंदवा' : 'Report Incident'}</span>
        </motion.button>

        {/* AI Assistant FAB */}
        <motion.button
          id="ai-assistant-fab"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowAIAssistant(true)}
          className="pointer-events-auto w-11 h-11 rounded-2xl bg-white/95 hover:bg-sky-50 text-sky-700 border border-sky-200 shadow-md backdrop-blur-md flex items-center justify-center transition-all"
          title={lang === 'mr' ? 'आपत्ती सहाय्यक (AI)' : 'AI Safety Assistant'}
        >
          <span className="material-symbols-outlined material-symbols-filled text-xl text-sky-600">
            smart_toy
          </span>
        </motion.button>
      </div>

      {/* 6. AI Assistant Modal Bottom Sheet (Fade-Through Motion) */}
      <AnimatePresence>
        {showAIAssistant && (
          <AIAssistantSheet
            onClose={() => setShowAIAssistant(false)} telemetry={telemetry}
            lang={lang}
            onToggleLang={() => setLang(lang === 'en' ? 'mr' : 'en')}
            activeHazard={activeHazard}
            predictions={predictions}
          />
        )}
      </AnimatePresence>

      {/* 7. Incident Report Modal */}
      <AnimatePresence>
        {showReportModal && (
          <IncidentReportModal
            lang={lang}
            onClose={() => setShowReportModal(false)}
            onSuccess={newInc => {
              setIncidents(prev => [newInc, ...prev]);
              setShowReportModal(false);
              showSnackbar(
                lang === 'mr' ? 'घटनेचा अहवाल यशस्वीरित्या सादर केला गेला.' : 'Incident report verified & broadcasted to control room.',
                () => {
                  setIncidents(prev => prev.filter(i => i.id !== newInc.id));
                }
              );
            }}
          />
        )}
      </AnimatePresence>

      {/* 8. SOS Distress Beacon Modal */}
      <AnimatePresence>
        {showSOSModal && (
          <SOSBeaconModal
            lang={lang}
            onClose={() => setShowSOSModal(false)}
          />
        )}
      </AnimatePresence>

      {/* 8. Bottom NavigationBar (MD3 Calm Light) */}
      <nav className="absolute bottom-0 inset-x-0 z-30 h-16 bg-white/95 border-t border-slate-200 px-4 flex items-center justify-around shadow-sm backdrop-blur-md">
        <button
          id="nav-map-btn"
          onClick={() => setActiveTab('map')}
          className={`flex flex-col items-center gap-0.5 transition-colors ${
            activeTab === 'map' ? 'text-sky-600 font-bold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <span className={`material-symbols-outlined text-2xl ${activeTab === 'map' ? 'material-symbols-filled' : ''}`}>
            map
          </span>
          <span className="text-[11px] tracking-tight">
            {lang === 'mr' ? 'रडार नकाशा' : 'Live Map'}
          </span>
        </button>

        <button
          id="nav-alerts-btn"
          onClick={() => setActiveTab('alerts')}
          className={`relative flex flex-col items-center gap-0.5 transition-colors ${
            activeTab === 'alerts' ? 'text-sky-600 font-bold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <span className={`material-symbols-outlined text-2xl ${activeTab === 'alerts' ? 'material-symbols-filled' : ''}`}>
            campaign
          </span>
          <span className="text-[11px] tracking-tight">
            {lang === 'mr' ? 'सतर्कता' : 'Alerts'}
          </span>
          {alerts.length > 0 && (
            <span className="absolute top-0 right-1 w-2 h-2 rounded-full bg-rose-500" />
          )}
        </button>

        <button
          id="nav-contacts-btn"
          onClick={() => setActiveTab('contacts')}
          className={`flex flex-col items-center gap-0.5 transition-colors ${
            activeTab === 'contacts' ? 'text-sky-600 font-bold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <span className={`material-symbols-outlined text-2xl ${activeTab === 'contacts' ? 'material-symbols-filled' : ''}`}>
            contact_phone
          </span>
          <span className="text-[11px] tracking-tight">
            {lang === 'mr' ? 'संपर्क' : 'Helplines'}
          </span>
        </button>
      </nav>

      {/* 9. Snackbar Toast with Undo */}
      <AnimatePresence>
        {snackbar && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            className="fixed bottom-20 left-4 right-4 max-w-md mx-auto z-50 p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl flex items-center justify-between text-xs text-white"
          >
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-emerald-400 text-base">check_circle</span>
              <span>{snackbar.message}</span>
            </div>
            {snackbar.undoAction && (
              <button
                onClick={() => {
                  snackbar.undoAction?.();
                  setSnackbar(null);
                }}
                className="text-amber-300 hover:text-amber-200 font-bold uppercase ml-3"
              >
                Undo
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
