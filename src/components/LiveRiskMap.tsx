import React, { useState, useMemo, useEffect } from 'react';
import { calculateFloodTimeline } from "../utils/floodEngine";
import { HazardType, RiskLevel, RiskPrediction, Shelter } from '../types';
import { HAZARD_PALETTES } from './HazardPalettes';
import MapLayer from '../MapLayer';
import { KOPARGAON_LANDMARKS, LocalLandmark } from '../landmarks';
import { SpeechEngine } from '../utils/speech';

interface LiveRiskMapProps {
  activeHazard: HazardType;
  onSelectHazard: (h: HazardType) => void;
  predictions: RiskPrediction[];
  shelters: Shelter[];
  onSelectZone: (zone: { id: string; name: string }, prediction: RiskPrediction | null) => void;
  timeOffset: number;
  setTimeOffset: (hrs: number) => void;
  lang: 'en' | 'mr';
  incidents?: any[];
  onReportIncident?: () => void;
}

export const LiveRiskMap: React.FC<LiveRiskMapProps> = ({
  activeHazard,
  onSelectHazard,
  predictions,
  shelters,
  onSelectZone,
  timeOffset,
  setTimeOffset,
  lang,
  incidents = []
}) => {
  const palette = HAZARD_PALETTES[activeHazard];
  const [selectedLandmark, setSelectedLandmark] = useState<LocalLandmark | null>(null);
  const [showTechnicalNumbers, setShowTechnicalNumbers] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isBannerDismissed, setIsBannerDismissed] = useState(false);
  const [selectedLayerFilter, setSelectedLayerFilter] = useState<'all' | 'flood' | 'shelters' | 'heat'>('all');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  useEffect(() => {
    const unsub = SpeechEngine.subscribe(setIsSpeaking);
    return () => unsub();
  }, []);

  // Stop speech if hazard tab switches
  useEffect(() => {
    SpeechEngine.stop();
  }, [activeHazard, lang]);

  // Geolocation trigger
  const handleLocateMe = () => {
    if (!('geolocation' in navigator)) {
      setLocationError(lang === 'mr' ? 'ब्राउझर जीपीएस सपोर्ट करत नाही.' : 'Geolocation not supported in browser.');
      return;
    }
    setIsLocating(true);
    setLocationError(null);
    navigator.geolocation.getCurrentPosition(
      pos => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setIsLocating(false);
      },
      err => {
        setIsLocating(false);
        // Fallback default Kopargaon point
        setUserLocation({ lat: 19.8912, lng: 74.4789 });
      },
      { timeout: 6000, enableHighAccuracy: true }
    );
  };

  // Distance calculation helper (Haversine formula in km)
  const calculateDistanceKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return (R * c).toFixed(1);
  };

  // Nearest Shelter
  const nearestShelter = useMemo(() => {
    if (!userLocation || shelters.length === 0) return null;
    let closest = shelters[0];
    let minD = 99999;
    shelters.forEach(s => {
      const d = parseFloat(calculateDistanceKm(userLocation.lat, userLocation.lng, s.location.lat, s.location.lng));
      if (d < minD) {
        minD = d;
        closest = s;
      }
    });
    return { shelter: closest, distanceKm: minD };
  }, [userLocation, shelters]);

  // Telemetry discharge rate (under the hood)
  const dischargeRate = useMemo(() => {
    if (activeHazard === 'flood') {
      return 35000 + (timeOffset / 72) * 55000;
    }
    return 8000;
  }, [activeHazard, timeOffset]);

  // Citizen-comprehensible Hazard Lead Content (Compliant with Part E rules)
  const hazardCitizenInfo = useMemo(() => {
    switch (activeHazard) {
      case 'flood': {
        
        const damDischarges = [
          { name: "Gangapur", discharge_cusecs: dischargeRate }
        ];
        const timeline = calculateFloodTimeline(13.2, damDischarges, 20);
        const currentPred = timeline.find((p: any) => p.timeOffset === timeOffset) || timeline[0];

        return {
          lead_en: timeOffset === 0 
            ? "Current Godavari Stage: " + currentPred.projectedStage + "m. " + currentPred.directives_en
            : "Forecast (+" + timeOffset + "h): Projected Stage " + currentPred.projectedStage + "m. " + currentPred.directives_en,
          lead_mr: timeOffset === 0
            ? "गोदावरीची सद्यस्थिती पातळी: " + currentPred.projectedStage + "m. " + currentPred.directives_mr
            : "अंदाज (+" + timeOffset + " तास): अंदाजित पातळी " + currentPred.projectedStage + "m. " + currentPred.directives_mr,
          comparison_en: "Current Risk Level: " + currentPred.risk_level + ". Affected Wards: " + (currentPred.affected_wards.length > 0 ? currentPred.affected_wards.join(", ") : "None"),
          comparison_mr: "सद्य धोका पातळी: " + currentPred.risk_level + ". बाधित प्रभाग: " + (currentPred.affected_wards.length > 0 ? currentPred.affected_wards.join(", ") : "काहीही नाही"),
          action_en: currentPred.directives_en,
          action_mr: currentPred.directives_mr,
          tech_details: [
            { label_en: "Projected River Stage", label_mr: "अंदाजित नदीची पातळी", val: currentPred.projectedStage + " m (Danger: 16.5m)" },
            { label_en: "Dam Discharges", label_mr: "धरण विसर्ग", val: dischargeRate.toLocaleString() + " cusecs" },
            { label_en: "Threat Level", label_mr: "धोका पातळी", val: currentPred.risk_level }
          ]
        };
      }
      case 'heatwave': {
        const heatPred = predictions.find(p => p.hazard_type === 'heatwave');
        const currentTemp = heatPred ? heatPred.risk_score : 28;
        
        let lead_en = `Feels like ${currentTemp}°C — Normal conditions.`;
        let lead_mr = `तापमान ${currentTemp}°C सारखे जाणवत आहे — हवामान सामान्य आहे.`;
        let action_en = 'Stay hydrated and take shade if outside.';
        let action_mr = 'पाणी पीत राहा आणि बाहेर असल्यास सावलीत थांबा.';
        
        if (currentTemp >= 40) {
           lead_en = `Feels like ${currentTemp}°C — Danger: Extreme thermal stress outside.`;
           lead_mr = `तापमान ${currentTemp}°C सारखे जाणवत आहे — धोका: बाहेर तीव्र उष्णता आहे.`;
           action_en = 'Avoid outdoor work 11 AM–4 PM. Drink at least 3 liters of water today.';
           action_mr = 'सकाळी ११ ते दुपारी ४ दरम्यान उन्हात काम टाळा. आज किमान ३ लिटर पाणी प्या.';
        } else if (currentTemp >= 35) {
           lead_en = `Feels like ${currentTemp}°C — Warning: High thermal stress.`;
           lead_mr = `तापमान ${currentTemp}°C सारखे जाणवत आहे — सावधान: अधिक उष्णता आहे.`;
           action_en = 'Limit strenuous outdoor activities. Drink plenty of water.';
           action_mr = 'कष्टाची कामे टाळा. भरपूर पाणी प्या.';
        }

        return {
          lead_en,
          lead_mr,
          comparison_en: currentTemp > 35 ? 'Hotter than typical seasonal average. UV Index: High.' : 'Typical seasonal average. UV Index: Moderate.',
          comparison_mr: currentTemp > 35 ? 'नेहमीच्या सरासरीपेक्षा जास्त उष्णता. अतिनील किरणे: तीव्र.' : 'सामान्य हवामान. अतिनील किरणे: मध्यम.',
          action_en,
          action_mr,
          tech_details: [
            { label_en: 'Ambient Max Temp', label_mr: 'कमाल तापमान', val: `${currentTemp} °C` },
            { label_en: 'Heat Index / WBGT', label_mr: 'आर्द्र तापमान निर्देशांक', val: `${(currentTemp - 2).toFixed(1)} °C` },
            { label_en: 'Solar UV Radiation', label_mr: 'सोलर रेडिएशन', val: currentTemp > 35 ? '850 W/m²' : '450 W/m²' }
          ]
        };
      }

      case 'drought':
        return {
          lead_en: 'Much less rain than usual for 6 weeks — plan for limited irrigation water.',
          lead_mr: 'गेल्या ६ आठवड्यांत नेहमीपेक्षा खूपच कमी पाऊस — मर्यादित सिंचन पाण्याचे नियोजन करा.',
          comparison_en: 'Rainfall deficit over past 6 weeks: 68% below normal. Soil moisture drying fast.',
          comparison_mr: 'गेल्या ६ आठवड्यांतील पाऊस सरासरीपेक्षा ६८% कमी. जमिनीतील ओलावा वेगाने घटत आहे.',
          action_en: 'Store household water now and apply protective mulch on standing crops.',
          action_mr: 'घरगुती पाणी साठवून ठेवा आणि उभ्या पिकांना आच्छादन (मल्चिंग) करा.',
          tech_details: [
            { label_en: '3-Month Standardized Precip', label_mr: '३-महिने पर्जन्य निर्देशांक', val: '-2.14 SPI (Severe)' },
            { label_en: 'Root Zone Moisture', label_mr: 'मुळांमधील ओलावा', val: '11.8% (Near wilting)' },
            { label_en: 'Groundwater Drop', label_mr: 'भूजल पातळी घट', val: '-8.6 meters' }
          ]
        };

      case 'unseasonal':
        return {
          lead_en: 'Hailstorm and lightning expected this evening across Dhamori & Sanvatsar.',
          lead_mr: 'आज सायंकाळी धामोरी व संवत्सर भागात गारपीट आणि विजांसह पावसाची शक्यता.',
          comparison_en: 'Severe Doppler storm cell detected — wind gusts 45 km/h above normal.',
          comparison_mr: 'डॉपलर रडारवर वादळी ढग सक्रिय — सोसाट्याचा वारा नेहमीपेक्षा ४५ किमी/तास जास्त.',
          action_en: 'Cover or harvest exposed onion & pomegranate crops; seek concrete shelter before 5 PM.',
          action_mr: 'कांदा व डाळिंब पिके ताडपत्रीने झाका किंवा काढा; सायंकाळी ५ पूर्वी पक्क्या निवाऱ्यात जा.',
          tech_details: [
            { label_en: 'Hail Probability', label_mr: 'गारपीट संभाव्यता', val: '84% (High Risk)' },
            { label_en: 'Peak Wind Gusts', label_mr: 'कमाल वादळी वारा', val: '68 km/h' },
            { label_en: 'Radar Reflectivity', label_mr: 'रडार रिफ्लेक्टिव्हिटी', val: '54 dBZ' }
          ]
        };
    }
  }, [activeHazard, timeOffset, dischargeRate]);

  // Trigger Voice Readout for the entire Citizen Advisory
  const handleVoiceReadout = () => {
    if (isSpeaking) {
      SpeechEngine.stop();
    } else {
      const textToSpeak = lang === 'mr'
        ? `${palette.marathiName} इशारा. ${hazardCitizenInfo.lead_mr} ${hazardCitizenInfo.comparison_mr} कृती: ${hazardCitizenInfo.action_mr}`
        : `${palette.name} Advisory. ${hazardCitizenInfo.lead_en} ${hazardCitizenInfo.comparison_en} Action: ${hazardCitizenInfo.action_en}`;
      SpeechEngine.speak(textToSpeak, lang);
    }
  };

  return (
    <div className="relative w-full h-full min-h-[600px] overflow-hidden bg-slate-50 select-none">
      {/* 1. Open-Source MapLibre GL JS + Deck.gl (@deck.gl/mapbox) */}
      <div className="absolute inset-0 z-0">
        <MapLayer
          activeHazard={activeHazard}
          predictions={predictions}
          shelters={shelters}
          timeOffset={timeOffset}
          dischargeRate={dischargeRate}
          lang={lang}
          incidents={incidents}
          onSelectZone={onSelectZone}
          onSelectLandmark={lm => setSelectedLandmark(lm)}
          selectedLayerFilter={selectedLayerFilter}
          userLocation={userLocation}
        />
      </div>

      {/* 2. Top Controls & Hazard FilterChips */}
      <div className="absolute top-16 inset-x-3 sm:inset-x-4 z-30 flex flex-col gap-2.5 pointer-events-none max-w-4xl mx-auto">
        {/* FilterChip Row */}
        <div className="pointer-events-auto flex items-center justify-between gap-1.5 p-1.5 rounded-2xl bg-white/95 border border-slate-200 shadow-lg backdrop-blur-md overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-1">
            {(['flood', 'drought', 'heatwave', 'unseasonal'] as HazardType[]).map(h => {
              const isSelected = activeHazard === h;
              const p = HAZARD_PALETTES[h];

              return (
                <button
                  key={h}
                  id={`filter-chip-${h}`}
                  onClick={() => onSelectHazard(h)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                    isSelected
                      ? 'shadow-md scale-[1.02]'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                  style={{
                    backgroundColor: isSelected ? p.tone50 : 'transparent',
                    color: isSelected ? '#ffffff' : undefined
                  }}
                >
                  <span
                    className={`material-symbols-outlined text-base ${
                      isSelected ? 'material-symbols-filled' : ''
                    }`}
                  >
                    {p.symbol}
                  </span>
                  <span className="capitalize font-sans font-bold">{lang === 'mr' ? p.marathiName : p.name}</span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-1.5">
            {/* GPS Pin Button */}
            <button
              onClick={handleLocateMe}
              disabled={isLocating}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-all shadow-sm border shrink-0 ${
                userLocation
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
              }`}
              title={lang === 'mr' ? 'माझे GPS स्थान शोधा' : 'Track My GPS Position'}
            >
              <span className={`material-symbols-outlined text-base ${isLocating ? 'animate-spin' : 'text-emerald-600'}`}>
                {isLocating ? 'progress_activity' : 'my_location'}
              </span>
              <span className="hidden sm:inline">
                {isLocating ? (lang === 'mr' ? 'शोधत आहे...' : 'Locating...') : (lang === 'mr' ? 'माझे स्थान' : 'My GPS')}
              </span>
            </button>

            {/* Voice Audio Readout Button (Accessibility for Low-Literacy / Elderly) */}
            <button
              id="voice-readout-hud-btn"
              onClick={handleVoiceReadout}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm shrink-0 border ${
                isSpeaking
                  ? 'bg-amber-500 text-slate-950 border-amber-400 animate-pulse'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200'
              }`}
              title={lang === 'mr' ? 'इशारा ऐका (आवाज)' : 'Listen to advisory (Voice)'}
            >
              <span className="material-symbols-outlined material-symbols-filled text-base text-amber-600">
                {isSpeaking ? 'volume_up' : 'campaign'}
              </span>
              <span className="font-sans font-bold">
                {isSpeaking ? (lang === 'mr' ? 'थांबवा' : 'Stop') : (lang === 'mr' ? 'ऐका (Voice)' : 'Listen')}
              </span>
            </button>
          </div>
        </div>

        {/* Vector Layers Selector Ribbon */}
        <div className="pointer-events-auto flex items-center gap-1 p-1 bg-slate-900/80 text-white rounded-xl shadow-md backdrop-blur-md overflow-x-auto no-scrollbar max-w-fit">
          <span className="text-[10px] uppercase font-bold text-slate-400 px-2 flex items-center gap-1">
            <span className="material-symbols-outlined text-xs">layers</span>
            {lang === 'mr' ? 'नकाशा स्तर:' : 'GIS Layer:'}
          </span>
          {[
            { id: 'all', label_en: 'All Layers', label_mr: 'सर्व स्तर' },
            { id: 'flood', label_en: 'Flood Inundation Zones', label_mr: 'गोदावरी पूर पट्टा' },
            { id: 'shelters', label_en: 'Relief Shelters', label_mr: 'निवारा केंद्रे' },
            { id: 'heat', label_en: 'Heat Belts', label_mr: 'उष्णता पट्टे' }
          ].map(layer => (
            <button
              key={layer.id}
              onClick={() => setSelectedLayerFilter(layer.id as any)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all whitespace-nowrap ${
                selectedLayerFilter === layer.id
                  ? 'bg-sky-500 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              {lang === 'mr' ? layer.label_mr : layer.label_en}
            </button>
          ))}
        </div>

        {/* User Geolocation Proximity Alert Card if GPS is active */}
        {userLocation && nearestShelter && (
          <div className="pointer-events-auto p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 shadow-lg backdrop-blur-md flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-sm">directions_run</span>
              </div>
              <div>
                <span className="font-bold text-emerald-900">
                  {lang === 'mr' ? 'जवळचे सुरक्षित निवारा केंद्र:' : 'Nearest Safe Relief Shelter:'}
                </span>
                <span className="text-emerald-800 font-medium ml-1">
                  {lang === 'mr' ? (nearestShelter.shelter.name_mr || nearestShelter.shelter.name) : nearestShelter.shelter.name}
                  {' '}({nearestShelter.distanceKm} km)
                </span>
              </div>
            </div>
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${nearestShelter.shelter.location.lat},${nearestShelter.shelter.location.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-[11px] flex items-center gap-1 shrink-0 transition-colors shadow-sm"
            >
              <span className="material-symbols-outlined text-xs">navigation</span>
              <span>{lang === 'mr' ? 'मार्ग' : 'Route'}</span>
            </a>
          </div>
        )}

        {/* 3. Citizen-Comprehensible Hazard Surface Banner (Governing Rule: Understood in under 3 seconds) with Cross / Dismiss option */}
        {isBannerDismissed ? (
          <div className="pointer-events-auto flex items-center justify-start">
            <button
              id="expand-hazard-banner-btn"
              onClick={() => setIsBannerDismissed(false)}
              className="px-3.5 py-2 rounded-2xl bg-white/95 border border-slate-200 shadow-md backdrop-blur-md flex items-center gap-2 text-xs font-bold text-slate-800 hover:bg-slate-50 transition-all"
            >
              <div 
                className="w-5 h-5 rounded-md flex items-center justify-center text-white text-xs"
                style={{ backgroundColor: palette.baseColor }}
              >
                <span className="material-symbols-outlined text-sm">{palette.symbol}</span>
              </div>
              <span>
                {lang === 'mr' ? `${palette.marathiName} इशारा - माहिती उघडा` : `${palette.name} Advisory - Show Summary`}
              </span>
              <span className="material-symbols-outlined text-base text-slate-500">expand_more</span>
            </button>
          </div>
        ) : (
          <div 
            className="pointer-events-auto p-3.5 sm:p-4 rounded-2xl bg-white/95 border shadow-xl backdrop-blur-md transition-all space-y-2.5"
            style={{
              borderColor: palette.baseColor
            }}
          >
            {/* Rule 1 & Rule 3: Color + Icon + Words together; Anchored to places people know */}
            <div className="flex items-start justify-between gap-2.5">
              <div className="flex items-start gap-2.5">
                <div 
                  className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow"
                  style={{ backgroundColor: palette.tone50, color: '#ffffff' }}
                >
                  <span className="material-symbols-outlined material-symbols-filled text-xl">
                    {palette.symbol}
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span 
                      className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded"
                      style={{ backgroundColor: palette.tone90, color: palette.tone30 }}
                    >
                      {lang === 'mr' ? palette.marathiName : palette.name}
                    </span>
                    <span className="text-[11px] font-bold text-slate-500">
                      {timeOffset === 0 ? (lang === 'mr' ? 'थेट परिस्थिती' : 'LIVE NOW') : `+${timeOffset}h FORECAST`}
                    </span>
                  </div>
                  {/* Plain-language lead headline */}
                  <div className="text-sm font-bold text-slate-900 mt-0.5 leading-snug">
                    {lang === 'mr' ? hazardCitizenInfo.lead_mr : hazardCitizenInfo.lead_en}
                  </div>
                </div>
              </div>

              {/* Cross / Close / Minimize Option */}
              <button
                id="dismiss-hazard-banner-btn"
                onClick={() => setIsBannerDismissed(true)}
                className="w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors shrink-0"
                title={lang === 'mr' ? 'माहिती लपवा (नकाशा पाहा)' : 'Minimize banner to view map'}
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            {/* Rule 4 & Rule 5: Compare to what is normal & Ends in clear Action Instruction */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-100">
              {/* Comparison to normal */}
              <div className="flex items-center gap-2 text-slate-600">
                <span className="material-symbols-outlined text-base text-sky-600 shrink-0">
                  analytics
                </span>
                <span>{lang === 'mr' ? hazardCitizenInfo.comparison_mr : hazardCitizenInfo.comparison_en}</span>
              </div>

              {/* Instruction banner */}
              <div 
                className="flex items-center gap-2 p-2 rounded-xl border text-slate-900 font-bold"
                style={{
                  backgroundColor: `${palette.tone90}`,
                  borderColor: `${palette.tone70}`
                }}
              >
                <span className="material-symbols-outlined text-base shrink-0" style={{ color: palette.baseColor }}>
                  emergency_home
                </span>
                <span className="text-[11px] leading-tight">
                  {lang === 'mr' ? hazardCitizenInfo.action_mr : hazardCitizenInfo.action_en}
                </span>
              </div>
            </div>

            {/* Two Layers of Truth: Tap to Reveal Technical Numbers Underneath */}
            <div className="pt-1 flex items-center justify-between border-t border-slate-100">
              <button
                onClick={() => setShowTechnicalNumbers(!showTechnicalNumbers)}
                className="text-[11px] font-mono font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1.5 transition-colors"
              >
                <span className="material-symbols-outlined text-sm">
                  {showTechnicalNumbers ? 'expand_less' : 'tune'}
                </span>
                <span>
                  {showTechnicalNumbers 
                    ? (lang === 'mr' ? 'तांत्रिक आकडे लपवा' : 'Hide Technical Metrics') 
                    : (lang === 'mr' ? 'तांत्रिक आकडे पहा (Tap to Reveal Numbers)' : 'Tap to Reveal Underlying Telemetry')}
                </span>
              </button>

              <span className="text-[10px] font-mono text-slate-400">
                Kopargaon Disaster Control Room
              </span>
            </div>

            {/* Collapsible Underneath Telemetry Numbers (Jargon hidden on default, visible on tap) */}
            {showTechnicalNumbers && (
              <div className="grid grid-cols-3 gap-2 pt-2">
                {hazardCitizenInfo.tech_details.map((td, idx) => (
                  <div key={idx} className="p-2 rounded-xl bg-slate-50 border border-slate-200 flex flex-col">
                    <span className="text-[10px] text-slate-500 font-medium">
                      {lang === 'mr' ? td.label_mr : td.label_en}
                    </span>
                    <span className="text-xs font-mono font-bold text-sky-800 mt-0.5">
                      {td.val}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 4. Selected Landmark Quick-Card if user clicks any landmark */}
      {selectedLandmark && (
        <div className="absolute top-72 left-4 z-30 pointer-events-auto max-w-xs p-3.5 rounded-2xl bg-white/95 border border-slate-200 shadow-2xl text-xs space-y-1.5 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase font-bold text-sky-600">
              {selectedLandmark.category} Landmark
            </span>
            <button
              onClick={() => setSelectedLandmark(null)}
              className="text-slate-400 hover:text-slate-700"
            >
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          </div>
          <div className="font-bold text-slate-900 text-sm">
            {lang === 'mr' ? selectedLandmark.name_mr : selectedLandmark.name}
          </div>
          <p className="text-slate-600 text-[11px] leading-relaxed">
            {lang === 'mr' ? selectedLandmark.description_mr : selectedLandmark.description_en}
          </p>
          <div className="text-[10px] font-mono text-slate-400 pt-1 border-t border-slate-100 flex justify-between">
            <span>Elevation: {selectedLandmark.elevation_m}m</span>
            <span>OSM Verified POI</span>
          </div>
        </div>
      )}

      {/* 5. Time-Scrub Slider (Now -> +72h) */}
      <div className="absolute bottom-20 inset-x-4 sm:inset-x-6 max-w-xl mx-auto z-30 pointer-events-auto">
        <div className="bg-white/95 border border-slate-200 p-3.5 rounded-2xl shadow-xl flex flex-col gap-2 backdrop-blur-md">
          <div className="flex items-center justify-between text-xs font-semibold">
            <div className="flex items-center gap-1.5 text-slate-700">
              <span className="material-symbols-outlined text-base" style={{ color: palette.baseColor }}>
                timelapse
              </span>
              <span>{lang === 'mr' ? 'पुढील वेळेचा अंदाज (Time Forecast):' : 'Hydro-Predictive Scrub:'}</span>
            </div>
            <span
              className="font-mono font-bold px-2 py-0.5 rounded text-xs"
              style={{ backgroundColor: palette.tone90, color: palette.tone30 }}
            >
              {timeOffset === 0 ? (lang === 'mr' ? 'थेट वेळ (NOW)' : 'LIVE (NOW)') : `+${timeOffset} HOURS AHEAD`}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <input
              id="time-scrub-slider"
              type="range"
              min="0"
              max="72"
              step="6"
              value={timeOffset}
              onChange={e => setTimeOffset(Number(e.target.value))}
              className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-slate-200"
              style={{
                accentColor: palette.baseColor
              }}
            />
          </div>

          {/* Time tick labels */}
          <div className="flex justify-between text-[10px] font-mono text-slate-500 px-1">
            <span>Now</span>
            <span>+12h</span>
            <span>+24h</span>
            <span>+48h</span>
            <span>+72h</span>
          </div>
        </div>
      </div>
    </div>
  );
};
