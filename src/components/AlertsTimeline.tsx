import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Alert, HazardType } from '../types';
import { HAZARD_PALETTES, getHazardTonalStyle } from './HazardPalettes';
import { SpeechEngine } from '../utils/speech';

interface AlertsTimelineProps {
  alerts: Alert[];
  lang: 'en' | 'mr';
  onSelectHazard?: (h: HazardType) => void;
}

export const AlertsTimeline: React.FC<AlertsTimelineProps> = ({ alerts, lang, onSelectHazard }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speakingAlertId, setSpeakingAlertId] = useState<string | null>(null);

  useEffect(() => {
    const unsub = SpeechEngine.subscribe(speaking => {
      setIsSpeaking(speaking);
      if (!speaking) setSpeakingAlertId(null);
    });
    return () => unsub();
  }, []);

  const handleSpeakAlert = (e: React.MouseEvent, alert: Alert) => {
    e.stopPropagation();
    if (isSpeaking && speakingAlertId === alert.id) {
      SpeechEngine.stop();
      setSpeakingAlertId(null);
    } else {
      setSpeakingAlertId(alert.id);
      const textToSpeak = lang === 'mr' ? alert.message_mr : alert.message_en;
      SpeechEngine.speak(textToSpeak, lang, () => setSpeakingAlertId(null));
    }
  };

  // Default fallback realistic alerts if list is empty
  const displayAlerts: Alert[] = alerts.length > 0 ? alerts : [
    {
      id: 'alt-1',
      zone_id: 'zone-bet',
      hazard: 'flood',
      severity: 'CRITICAL',
      message_en: 'CRITICAL FLOOD BULLETIN: Water is rising near Godavari Old Bridge and Godavari Ghat. Riverbank residents must move to Somaiya College Shelter immediately.',
      message_mr: 'अतिदक्षतेचा इशारा: गोदावरी जुन्या पुलाजवळ व घाटावर पाण्याची पातळी झपाट्याने वाढत आहे. नदीकाठच्या नागरिकांनी तातडीने सोमय्या कॉलेज आश्रयस्थानात स्थलांतर करावे.',
      created_at: new Date(Date.now() - 15 * 60 * 1000).toISOString()
    },
    {
      id: 'alt-2',
      zone_id: 'zone-dhamori',
      hazard: 'unseasonal',
      severity: 'HIGH',
      message_en: 'SEVERE HAILSTORM ALERT: Violent winds and hail expected in Dhamori and Sanvatsar within 45 minutes. Cover harvested onion crops with tarpaulins immediately.',
      message_mr: 'गारपीट व वादळ सतर्कता: धामोरी व संवत्सर भागात पुढील ४५ मिनिटांत सोसाट्याचा वारा व गारपीट होण्याची दाट शक्यता. कांदा चाळींवर तातडीने ताडपत्री टाका.',
      created_at: new Date(Date.now() - 45 * 60 * 1000).toISOString()
    },
    {
      id: 'alt-3',
      zone_id: 'zone-urban',
      hazard: 'heatwave',
      severity: 'MODERATE',
      message_en: 'EXTREME HEAT WARNING: Feels like 43°C between 12:00 PM and 4:00 PM. Avoid outdoor labor; municipal drinking water kiosks are open at Kopargaon Bus Stand.',
      message_mr: 'उष्णतेची लाट इशारा: दुपारी १२ ते ४ दरम्यान तापमान ४३°C सारखे जाणवेल. उन्हात काम टाळा; कोपरगाव बस स्थानक व रुग्णालयात मोफत पिण्याचे पाणी उपलब्ध आहे.',
      created_at: new Date(Date.now() - 120 * 60 * 1000).toISOString()
    },
    {
      id: 'alt-4',
      zone_id: 'zone-kolpewadi',
      hazard: 'drought',
      severity: 'LOW',
      message_en: 'AGRICULTURAL ADVISORY: 6 weeks of severe rain deficit. Farmers advised to mulch standing crops and ration irrigation water.',
      message_mr: 'कृषी सल्ला: गेल्या ६ आठवड्यांत पर्जन्यमान खूपच कमी. शेतकऱ्यांनी पिकांना आच्छादन (मल्चिंग) करावे व पाण्याचे नियोजन करावे.',
      created_at: new Date(Date.now() - 360 * 60 * 1000).toISOString()
    }
  ];

  return (
    <div className="w-full max-w-3xl mx-auto p-4 sm:p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-rose-600 text-2xl">
            campaign
          </span>
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              {lang === 'mr' ? 'आपत्कालीन सतर्कता व आदेश' : 'Active Alerts & Bulletins'}
            </h2>
            <p className="text-xs text-slate-500">
              {lang === 'mr' ? 'तालुका आपत्ती निवारण कक्षाचे थेट संदेश' : 'Common Alerting Protocol (CAP) synchronized stream'}
            </p>
          </div>
        </div>

        <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-rose-50 text-rose-800 border border-rose-200">
          {displayAlerts.length} ACTIVE
        </span>
      </div>

      {/* Staggered Alert Cards */}
      <div className="space-y-3">
        {displayAlerts.map((alert, index) => {
          const palette = HAZARD_PALETTES[alert.hazard];
          const isExpanded = expandedId === alert.id;
          const tonal = getHazardTonalStyle(alert.hazard, alert.severity);
          const isThisSpeaking = isSpeaking && speakingAlertId === alert.id;

          return (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.25,
                delay: index * 0.03,
                ease: [0.2, 0, 0, 1]
              }}
              className="rounded-3xl border transition-all overflow-hidden shadow-lg"
              style={{
                backgroundColor: tonal.bg,
                borderColor: tonal.border,
                color: tonal.text
              }}
            >
              {/* Top Banner inside card */}
              <div 
                className="p-4 sm:p-5 cursor-pointer flex items-start justify-between gap-3"
                onClick={() => setExpandedId(isExpanded ? null : alert.id)}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-sm"
                    style={{
                      backgroundColor: tonal.badgeBg,
                      color: tonal.badgeText
                    }}
                  >
                    <span className="material-symbols-outlined material-symbols-filled text-2xl">
                      {palette.symbol}
                    </span>
                  </div>

                  <div className="flex flex-col">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span
                        className="text-[11px] font-mono font-bold uppercase px-2 py-0.5 rounded"
                        style={{
                          backgroundColor: tonal.badgeBg,
                          color: tonal.badgeText
                        }}
                      >
                        {alert.severity} • {lang === 'mr' ? palette.marathiName : palette.name}
                      </span>
                      <span className="text-[11px] opacity-80 font-mono">
                        {new Date(alert.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} IST
                      </span>
                    </div>

                    <h3 className="font-bold text-base leading-snug tracking-tight">
                      {lang === 'mr' ? alert.message_mr : alert.message_en}
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {/* Voice Button */}
                  <button
                    onClick={(e) => handleSpeakAlert(e, alert)}
                    className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                      isThisSpeaking
                        ? 'bg-amber-400 text-black animate-pulse shadow-md'
                        : 'bg-black/20 hover:bg-black/30'
                    }`}
                    title={lang === 'mr' ? 'इशारा ऐका' : 'Listen'}
                  >
                    <span className="material-symbols-outlined material-symbols-filled text-lg">
                      {isThisSpeaking ? 'volume_up' : 'campaign'}
                    </span>
                  </button>

                  <button
                    className="w-8 h-8 rounded-full flex items-center justify-center opacity-80 hover:opacity-100 transition-opacity"
                  >
                    <span className="material-symbols-outlined text-xl">
                      {isExpanded ? 'expand_less' : 'expand_more'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Expanded details */}
              {isExpanded && (
                <div className="px-5 pb-5 pt-1 border-t border-black/10 flex flex-col gap-3">
                  <div className="text-sm leading-relaxed whitespace-pre-wrap font-medium">
                    {lang === 'mr' ? alert.message_mr : alert.message_en}
                  </div>

                  {/* Secondary language view */}
                  <div className="p-3 rounded-2xl bg-black/15 text-xs opacity-90 leading-relaxed font-sans">
                    <div className="text-[10px] uppercase font-bold tracking-wider mb-1 opacity-70">
                      {lang === 'mr' ? 'English Translation' : 'मराठी भाषांतर'}
                    </div>
                    {lang === 'mr' ? alert.message_en : alert.message_mr}
                  </div>

                  {/* Directive Actions */}
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-[11px] font-mono opacity-80">
                      Source: Sub-Divisional Magistrate Kopargaon
                    </span>

                    {onSelectHazard && (
                      <button
                        onClick={() => onSelectHazard(alert.hazard)}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white/20 hover:bg-white/30 transition-colors flex items-center gap-1"
                      >
                        <span>{lang === 'mr' ? 'नकाशावर पहा' : 'View on Radar'}</span>
                        <span className="material-symbols-outlined text-sm">arrow_forward</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
