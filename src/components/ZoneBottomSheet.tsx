import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { HazardType, RiskLevel, RiskPrediction, Shelter } from '../types';
import { HAZARD_PALETTES, getHazardTonalStyle } from './HazardPalettes';
import { SpeechEngine } from '../utils/speech';

interface ZoneBottomSheetProps {
  zone: { id: string; name: string } | null;
  prediction: RiskPrediction | null;
  hazard: HazardType;
  timeOffsetHours: number;
  shelters: Shelter[];
  onClose: () => void;
  onActionClick: (actionType: string) => void;
  lang: 'en' | 'mr';
}

export const ZoneBottomSheet: React.FC<ZoneBottomSheetProps> = ({
  zone,
  prediction,
  hazard,
  timeOffsetHours,
  shelters,
  onClose,
  onActionClick,
  lang,
}) => {
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    const unsub = SpeechEngine.subscribe(setIsSpeaking);
    return () => unsub();
  }, []);

  if (!zone) return null;

  const palette = HAZARD_PALETTES[hazard];
  const level: RiskLevel = prediction?.risk_level || 'LOW';
  const score = prediction?.risk_score !== undefined ? Math.round(prediction.risk_score * 100) : 24;
  const tonalStyle = getHazardTonalStyle(hazard, level);

  // Sector Landmark Anchor mapping (Rule 3)
  const getLandmarkAnchor = () => {
    switch (zone.id) {
      case 'zone-bet':
        return {
          en: 'Near Godavari Ghat, Old Bridge & Kedareshwar Temple',
          mr: 'गोदावरी घाट, जुना पूल आणि केदारेश्वर मंदिरालगत'
        };
      case 'zone-urban':
        return {
          en: 'Near Kopargaon Bus Stand, Gandhi Chowk & Rural Hospital',
          mr: 'कोपरगाव बस स्थानक, गांधी चौक आणि ग्रामीण रुग्णालयालगत'
        };
      case 'zone-sanjivani':
        return {
          en: 'Sanjivani Engineering Campus & Higher Elevation Belt',
          mr: 'संजीवनी अभियांत्रिकी परिसर व उंच पट्टा'
        };
      case 'zone-sanvatsar':
        return {
          en: 'Sanvatsar Phata, Godavari Downstream Agricultural Farms',
          mr: 'संवत्सर फाटा, गोदावरी खालील बाजूची शेतजमीन'
        };
      case 'zone-dhamori':
        return {
          en: 'Dhamori Shirdi-Kopargaon Highway Road & Onion Fields',
          mr: 'धामोरी शिर्डी-कोपरगाव महामार्ग व कांदा उत्पादक क्षेत्र'
        };
      case 'zone-kolpewadi':
        return {
          en: 'Kolpewadi Sugar Mill Belt & Agricultural Farms',
          mr: 'कोळपेवाडी साखर कारखाना परिसर व शेती पट्टा'
        };
      default:
        return {
          en: 'Kopargaon Taluka Sector',
          mr: 'कोपरगाव तालुका विभाग'
        };
    }
  };

  // Plain-Language Citizen Directives (Rule 2, 4, 5)
  const getCitizenDirective = () => {
    switch (hazard) {
      case 'flood':
        return {
          plain_en: level === 'CRITICAL' || level === 'HIGH'
            ? 'Water is rising rapidly along the riverbank — expected to inundate low-lying houses within 3 hours.'
            : 'Water levels are elevated but currently contained within the main river banks.',
          plain_mr: level === 'CRITICAL' || level === 'HIGH'
            ? 'नदीकाठच्या भागात पाणी वेगाने वाढत असून पुढील ३ तासांत सखल भागातील घरांमध्ये पाणी शिरण्याची शक्यता.'
            : 'पाण्याची पातळी वाढली आहे परंतु सद्यस्थितीत नदी पात्रातच आहे.',
          normal_comp_en: '2.4 meters higher than normal seasonal flow.',
          normal_comp_mr: 'नेहमीच्या सरासरीपेक्षा २.४ मीटर जास्त पाणी पातळी.',
          instruction_en: 'Move family, cattle & vehicles to high ground or Somaiya College shelter immediately.',
          instruction_mr: 'कुटुंब, जनावरे व वाहने तातडीने उंच जागी किंवा सोमय्या कॉलेज निवारा केंद्रात हलवा.'
        };
      case 'heatwave': {
        const currentTemp = prediction?.hazard_type === 'heatwave' ? prediction.risk_score : 28;
        return {
          plain_en: currentTemp >= 40 
            ? `Feels like ${currentTemp}°C outside. High risk of dehydration and heat exhaustion.`
            : `Feels like ${currentTemp}°C outside. Normal to moderate conditions.`,
          plain_mr: currentTemp >= 40 
            ? `बाहेर ${currentTemp}°C सारखी तीव्र उष्णता जाणवत आहे. उष्माघात व निर्जलीकरणाचा मोठा धोका.`
            : `बाहेर ${currentTemp}°C सारखी उष्णता जाणवत आहे. हवामान सामान्य आहे.`,
          normal_comp_en: currentTemp > 35 ? 'Hotter than typical seasonal average.' : 'Typical seasonal average.',
          normal_comp_mr: currentTemp > 35 ? 'नेहमीच्या सरासरीपेक्षा जास्त उष्णता.' : 'सामान्य हवामान.',
          instruction_en: currentTemp > 35 ? 'Avoid all outdoor work between 11 AM and 4 PM; drink ORS or lemon water.' : 'Stay hydrated.',
          instruction_mr: currentTemp > 35 ? 'सकाळी ११ ते दुपारी ४ दरम्यान उन्हात काम टाळा; ओआरएस किंवा लिंबू पाणी प्या.' : 'पाणी पीत राहा.'
        };
      }
      case 'drought':
        return {
          plain_en: 'Much less rain than usual for 6 weeks — plan for limited irrigation and household water.',
          plain_mr: 'गेल्या ६ आठवड्यांत नेहमीपेक्षा खूपच कमी पाऊस — मर्यादित सिंचन व घरगुती पाण्याचे नियोजन करा.',
          normal_comp_en: '68% rainfall deficit over past 6 weeks.',
          normal_comp_mr: 'गेल्या ६ आठवड्यांत पर्जन्यमान ६८% कमी.',
          instruction_en: 'Prioritize drinking water; apply mulching on crops to reduce soil moisture evaporation.',
          instruction_mr: 'पिण्याच्या पाण्याला प्राधान्य द्या; पिकांना आच्छादन (मल्चिंग) करा.'
        };
      case 'unseasonal':
        return {
          plain_en: 'Hailstorm and violent winds expected within 45–60 minutes.',
          plain_mr: 'पुढील ४५ ते ६० मिनिटांत वादळी वाऱ्यासह गारपीट होण्याची शक्यता.',
          normal_comp_en: 'Severe convective storm cell with gust speeds 45 km/h above normal.',
          normal_comp_mr: 'सोसाट्याचा वादळी वारा नेहमीपेक्षा ४५ किमी/तास जास्त.',
          instruction_en: 'Cover harvested onion and pomegranate stacks with tarpaulins immediately; take concrete shelter.',
          instruction_mr: 'कांदा व डाळिंब पिकांवर तातडीने ताडपत्री झाका; पक्क्या छताखाली आसरा घ्या.'
        };
    }
  };

  const anchor = getLandmarkAnchor();
  const directive = getCitizenDirective();

  // Technical Telemetry Data (Tap-to-reveal only)
  const getTechnicalMetrics = () => {
    const mult = 1 + (timeOffsetHours / 72) * 0.4;
    switch (hazard) {
      case 'flood':
        return [
          { label_en: 'Gangapur Dam Outflow', label_mr: 'गंगापूर धरण विसर्ग', val: `${Math.round(42500 * mult).toLocaleString()} cusecs`, status: mult > 1.2 ? 'Critical' : 'Elevated' },
          { label_en: 'Godavari River Gauge', label_mr: 'गोदावरी पाणी पातळी', val: `${(491.2 + (score / 100) * 2.8).toFixed(2)} m`, status: 'Danger Mark: 493.0m' },
          { label_en: 'Soil Saturation', label_mr: 'मातीची जलधारण क्षमता', val: `${Math.min(98, Math.round(72 + (score / 100) * 24))}%`, status: 'Runoff Risk High' }
        ];
      case 'drought':
        return [
          { label_en: '3-Month Standardized Precip', label_mr: '३-महिने पर्जन्य निर्देशांक', val: '-2.14 SPI', status: 'Severe Deficit' },
          { label_en: 'Groundwater Table Depletion', label_mr: 'भूजल पातळी घट', val: '-8.6 m', status: 'Below normal' },
          { label_en: 'Soil Moisture Index', label_mr: 'मातीतील ओलावा निर्देशांक', val: '12.4%', status: 'Critical Wilting Point' }
        ];
      case 'heatwave': {
        const currentTemp = prediction?.hazard_type === 'heatwave' ? prediction.risk_score : 28;
        return [
          { label_en: 'Ambient Max Temperature', label_mr: 'कमाल तापमान', val: `${currentTemp.toFixed(1)} °C`, status: currentTemp > 40 ? 'Severe Heat' : 'Normal' },
          { label_en: 'Wet-Bulb Globe Temp (WBGT)', label_mr: 'आर्द्र तापमान (WBGT)', val: `${(currentTemp - 2.5).toFixed(1)} °C`, status: currentTemp > 40 ? 'Extreme Stress' : 'Moderate' },
          { label_en: 'Solar UV Index', label_mr: 'अतिनील किरण निर्देशांक', val: currentTemp > 35 ? '11+ Very High' : 'Moderate', status: 'Peak 11:30 - 15:30' }
        ];
      }
      case 'unseasonal':
        return [
          { label_en: 'Doppler Hail Probability', label_mr: 'गारपीट संभाव्यता', val: `${Math.round(65 + (score / 100) * 30)}%`, status: 'Severe Cell' },
          { label_en: 'Wind Gust Velocity', label_mr: 'वादळी वाऱ्याचा वेग', val: '62 km/h', status: 'Microburst alert' },
          { label_en: 'Precipitation Intensity', label_mr: 'पावसाची तीव्रता', val: '34 mm/hr', status: 'Heavy Downpour' }
        ];
    }
  };

  const metrics = getTechnicalMetrics();

  // Recommended single FilledButton action
  const getRecommendedAction = () => {
    switch (hazard) {
      case 'flood':
        return {
          id: 'evacuate',
          title_en: 'Navigate to Somaiya College Shelter (High Ground)',
          title_mr: 'सोमय्या कॉलेज सुरक्षित निवारा केंद्राकडे जा',
          icon: 'directions_run',
          color: '#0284c7'
        };
      case 'drought':
        return {
          id: 'irrigation_ration',
          title_en: 'Activate Emergency Water Rationing & Mulching',
          title_mr: 'पाणी वाटप नियोजन व आच्छादन लागू करा',
          icon: 'water_bottle',
          color: '#d97706'
        };
      case 'heatwave':
        return {
          id: 'cooling_center',
          title_en: 'Navigate to Sanjivani Hydration Hub',
          title_mr: 'संजीवनी थंडावा व हायड्रेशन केंद्राकडे जा',
          icon: 'ac_unit',
          color: '#dc2626'
        };
      case 'unseasonal':
        return {
          id: 'secure_crops',
          title_en: 'Deploy Hail Nets & Secure Harvested Onion Storage',
          title_mr: 'कांदा चाळ व पिकांवर ताडपत्री/जाळी लावा',
          icon: 'shield',
          color: '#7c3aed'
        };
    }
  };

  const recAction = getRecommendedAction();

  const handleVoiceReadout = () => {
    if (isSpeaking) {
      SpeechEngine.stop();
    } else {
      const textToSpeak = lang === 'mr'
        ? `${zone.name}. ${anchor.mr}. ${palette.marathiName} धोका: ${directive.plain_mr} ${directive.normal_comp_mr} महत्त्वाची सूचना: ${directive.instruction_mr}`
        : `${zone.name}. ${anchor.en}. ${palette.name} Risk: ${directive.plain_en} ${directive.normal_comp_en} Action: ${directive.instruction_en}`;
      SpeechEngine.speak(textToSpeak, lang);
    }
  };

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 p-3 sm:p-4 max-w-2xl mx-auto pointer-events-none">
      <motion.div
        id="zone-bottom-sheet"
        initial={{ y: '100%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 26, stiffness: 280 }}
        className="pointer-events-auto bg-white border border-slate-200 rounded-3xl p-4 sm:p-5 shadow-2xl flex flex-col gap-3.5 text-slate-900 max-h-[85vh] overflow-y-auto no-scrollbar"
        style={{
          boxShadow: `0 -10px 40px -10px ${palette.baseColor}22`
        }}
      >
        {/* Handle / Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: tonalStyle.bg, color: tonalStyle.text }}
            >
              <span className="material-symbols-outlined material-symbols-filled text-2xl">
                {palette.symbol}
              </span>
            </div>
            <div>
              <div className="text-[11px] font-bold text-slate-500">
                {lang === 'mr' ? anchor.mr : anchor.en}
              </div>
              <h3 className="text-lg font-bold tracking-tight text-slate-900">
                {zone.name}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Tap to hear voice audio readout */}
            <button
              onClick={handleVoiceReadout}
              className={`p-2 rounded-full border transition-all ${
                isSpeaking
                  ? 'bg-amber-100 text-amber-900 border-amber-300 animate-pulse'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
              }`}
              title={lang === 'mr' ? 'माहिती ऐका' : 'Listen'}
            >
              <span className="material-symbols-outlined material-symbols-filled text-lg">
                {isSpeaking ? 'volume_up' : 'campaign'}
              </span>
            </button>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-900 transition-colors"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          </div>
        </div>

        {/* 1. Rule 1, 2, 4: Plain-Language Summary + Normal Comparison (Above the fold) */}
        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col gap-2">
          <div className="text-sm font-bold text-slate-900 leading-snug">
            {lang === 'mr' ? directive.plain_mr : directive.plain_en}
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-600 pt-1 border-t border-slate-200">
            <span className="material-symbols-outlined text-base text-sky-600">
              analytics
            </span>
            <span>
              {lang === 'mr' ? directive.normal_comp_mr : directive.normal_comp_en}
            </span>
          </div>
        </div>

        {/* 2. Rule 5: Safety Action Instruction (Always visible above fold) */}
        <div 
          className="p-3.5 rounded-2xl border flex items-start gap-2.5"
          style={{
            backgroundColor: `${palette.tone50}15`,
            borderColor: `${palette.tone50}40`
          }}
        >
          <span className="material-symbols-outlined text-xl shrink-0" style={{ color: palette.baseColor }}>
            shield
          </span>
          <div className="text-xs font-bold text-slate-900 leading-relaxed">
            <span className="text-amber-800 uppercase tracking-wide mr-1 font-semibold">
              {lang === 'mr' ? 'तातडीची सूचना:' : 'Mandatory Action:'}
            </span>
            {lang === 'mr' ? directive.instruction_mr : directive.instruction_en}
          </div>
        </div>

        {/* 3. Nearby Shelter Snapshot if available */}
        {shelters && shelters.length > 0 && (
          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-emerald-600 text-lg">
                night_shelter
              </span>
              <div>
                <div className="text-xs font-semibold text-slate-900">
                  {shelters[0].name}
                </div>
                <div className="text-[11px] text-slate-500">
                  {shelters[0].capacity - shelters[0].current_occupancy} {lang === 'mr' ? 'जागा उपलब्ध • १.४ किमी' : 'beds available • 1.4 km'}
                </div>
              </div>
            </div>
            <span className="text-xs font-mono font-bold text-emerald-800 uppercase px-2 py-0.5 bg-emerald-50 rounded border border-emerald-200">
              OPEN
            </span>
          </div>
        )}

        {/* 4. Tap-to-Reveal Underlying Telemetry (Two layers of truth) */}
        <div className="border-t border-slate-200 pt-2">
          <button
            onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
            className="w-full flex items-center justify-between text-xs font-mono font-bold text-slate-500 hover:text-slate-800 py-1"
          >
            <span className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm">tune</span>
              <span>{showTechnicalDetails ? (lang === 'mr' ? 'तांत्रिक आकडे लपवा' : 'Hide Technical Telemetry') : (lang === 'mr' ? 'तांत्रिक आकडे पहा (Tap to Reveal)' : 'Tap to Reveal Underlying Telemetry')}</span>
            </span>
            <span className="material-symbols-outlined text-sm">
              {showTechnicalDetails ? 'expand_less' : 'expand_more'}
            </span>
          </button>

          {showTechnicalDetails && (
            <div className="space-y-2 mt-2">
              <div className="grid grid-cols-3 gap-2">
                {metrics.map((m, idx) => (
                  <div 
                    key={idx}
                    className="bg-slate-50 border border-slate-200 p-2.5 rounded-2xl flex flex-col justify-between"
                  >
                    <span className="text-[10px] text-slate-500 font-medium line-clamp-2 leading-tight">
                      {lang === 'mr' ? m.label_mr : m.label_en}
                    </span>
                    <span className="text-xs font-bold font-mono tracking-tight text-slate-900 mt-1">
                      {m.val}
                    </span>
                    <span className="text-[9px] text-slate-500 font-mono mt-0.5 truncate">
                      {m.status}
                    </span>
                  </div>
                ))}
              </div>

              {/* Data Timestamp & Automatic Stale-Data Warning Line */}
              {(() => {
                const telemetryTimestamp = prediction?.fetched_at || prediction?.created_at;
                let formattedTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
                let isStale = false;
                if (telemetryTimestamp) {
                  const date = new Date(telemetryTimestamp);
                  if (!isNaN(date.getTime())) {
                    formattedTime = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
                    const diffMs = Date.now() - date.getTime();
                    if (diffMs > 2 * 60 * 60 * 1000) {
                      isStale = true;
                    }
                  }
                }

                return (
                  <div className="flex flex-col gap-1.5 pt-1.5 pb-0.5 border-t border-slate-100">
                    <div className="flex items-center justify-between text-[11px] font-mono text-slate-500">
                      <span className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${isStale ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                        <span>
                          {lang === 'mr' ? `माहिती वेळ: ${formattedTime}` : `data as of ${formattedTime}`}
                        </span>
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {lang === 'mr' ? 'जलसंपदा विभाग कोपरगाव' : 'WRD Hydro Station'}
                      </span>
                    </div>

                    {/* Stale-data warning line that appears automatically if underlying telemetry hasn't refreshed in > 2 hours */}
                    {isStale && (
                      <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-medium flex items-start gap-2">
                        <span className="material-symbols-outlined text-base text-amber-600 shrink-0 mt-0.5">
                          warning
                        </span>
                        <span className="leading-tight">
                          {lang === 'mr'
                            ? 'माहिती जुनी असू शकते: गेल्या २ तासांत सेन्सर अपडेट मिळालेला नाही.'
                            : 'Stale-data warning: Underlying telemetry has not refreshed in over 2 hours.'}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          )}
        </div>

        {/* 5. Primary Action Button */}
        <button
          id="recommended-action-btn"
          onClick={() => onActionClick(recAction.id)}
          className="w-full min-h-[48px] py-3 px-6 rounded-2xl font-bold text-sm tracking-wide text-white flex items-center justify-center gap-2 shadow-sm transition-transform active:scale-[0.98]"
          style={{
            backgroundColor: palette.baseColor
          }}
        >
          <span className="material-symbols-outlined text-xl">
            {recAction.icon}
          </span>
          <span className="text-center font-sans font-bold">{lang === 'mr' ? recAction.title_mr : recAction.title_en}</span>
          <span className="material-symbols-outlined text-lg ml-auto">arrow_forward</span>
        </button>
      </motion.div>
    </div>
  );
};
