import React, { useState } from 'react';
import { motion } from 'motion/react';
import { HAZARD_PALETTES } from './HazardPalettes';
import { HazardType } from '../types';

interface OnboardingModalProps {
  onFinish: () => void;
  onLoginClick: () => void;
  lang: 'en' | 'mr';
}

const FLYOVER_STOPS = [
  {
    title_en: 'Godavari River Basin',
    title_mr: 'गोदावरी नदी खोरे',
    subtitle_en: 'Monitors upstream dam discharge and alerts if water levels approach local ghats or residential bridges.',
    subtitle_mr: 'गंगापूर व दारणा धरणातील विसर्ग आणि घाटाजवळील पाणी पातळीचे थेट निरीक्षण.',
    hazard: 'flood' as HazardType,
    location_en: 'Near Godavari Ghat & Old Bridge',
    location_mr: 'गोदावरी घाट व जुना पूल परिसर',
    headline_en: 'Water may reach ghat by evening',
    headline_mr: 'सायंकाळपर्यंत घाटावर पाणी पोहोचू शकते',
    metricLabel_en: 'River Status',
    metricLabel_mr: 'नदीची स्थिती',
    techDetail_en: 'Discharge: 42,500 cusecs • Gauge: 492.3m',
    techDetail_mr: 'विसर्ग: ४२,५०० क्युसेक • पातळी: ४९२.३ मी'
  },
  {
    title_en: 'Agricultural & Rainfall Watch',
    title_mr: 'कृषी व पर्जन्य निरीक्षण',
    subtitle_en: 'Tracks seasonal rainfall trends and root-zone soil moisture across Kopargaon farming taluka.',
    subtitle_mr: 'कोपरगाव तालुक्यातील पर्जन्यमान व पिकांमधील ओलावा स्थितीचे साधे, सोपे अपडेट्स.',
    hazard: 'drought' as HazardType,
    location_en: '84 Villages Agricultural Belt',
    location_mr: '८४ गावांमधील शेती पट्टा',
    headline_en: 'Much less rain than usual for 6 weeks',
    headline_mr: 'गेल्या ६ आठवड्यांत नेहमीपेक्षा कमी पाऊस',
    metricLabel_en: 'Rainfall Status',
    metricLabel_mr: 'पाऊस स्थिती',
    techDetail_en: 'Deficit: 68% below normal (-2.14 SPI)',
    techDetail_mr: 'तुटवडा: सरासरीपेक्षा ६८% कमी (-२.१४ SPI)'
  },
  {
    title_en: 'Heatwave & Hydration Guide',
    title_mr: 'उष्णतेची लाट व आरोग्य',
    subtitle_en: 'Real-time guidance on outdoor temperature stress, cool hydration points, and safe labor hours.',
    subtitle_mr: 'दुपारच्या वेळेतील तीव्र उष्णता, थंडावा केंद्र व नागरिकांसाठी आरोग्य मार्गदर्शन.',
    hazard: 'heatwave' as HazardType,
    location_en: 'Kopargaon Town & Market Areas',
    location_mr: 'कोपरगाव शहर व बाजारपेठ परिसर',
    headline_en: 'Live Outdoor Temperature',
    headline_mr: 'बाहेरील थेट तापमान',
    metricLabel_en: 'Outdoor Heat',
    metricLabel_mr: 'उष्णता पातळी',
    techDetail_en: 'Real-time Ambient Max & UV Index',
    techDetail_mr: 'थेट तापमान व अतिनील किरणे'
  },
  {
    title_en: 'Storm & Crop Hail Protection',
    title_mr: 'वादळ व पीक संरक्षण',
    subtitle_en: 'Early warnings to protect harvested onions, pomegranates, and farm roofs from sudden squalls.',
    subtitle_mr: 'कांदा पिके, डाळिंब व शेतीच्या संरक्षणासाठी वादळ आणि गारपीट पूर्वसूचना.',
    hazard: 'unseasonal' as HazardType,
    location_en: 'Dhamori & Sanvatsar Sector',
    location_mr: 'धामोरी व संवत्सर विभाग',
    headline_en: 'Hailstorm expected this evening',
    headline_mr: 'आज सायंकाळी गारपीट व वादळ शक्यता',
    metricLabel_en: 'Storm Advisory',
    metricLabel_mr: 'वादळ सतर्कता',
    techDetail_en: 'Doppler Cell: 54 dBZ • Gusts: 68 km/h',
    techDetail_mr: 'डॉपलर रडार: ५४ dBZ • वारा: ६८ किमी/तास'
  }
];

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ onFinish, onLoginClick, lang }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [showTech, setShowTech] = useState(false);

  const step = FLYOVER_STOPS[currentStep];
  const palette = HAZARD_PALETTES[step.hazard];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.22, ease: [0.2, 0, 0, 1] }}
        className="w-full max-w-lg bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-2xl flex flex-col text-slate-900"
      >
        {/* Top bar with Skip visible from frame 1 */}
        <div className="flex items-center justify-between px-6 pt-5 pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span 
              className="material-symbols-outlined material-symbols-filled text-2xl" 
              style={{ color: palette.baseColor }}
            >
              {palette.symbol}
            </span>
            <span className="text-xs font-bold tracking-tight text-slate-800">
              {lang === 'mr' ? 'कोपरगाव आपत्ती सतर्कता' : 'Kopargaon Disaster Watch'}
            </span>
          </div>
          
          <button
            id="onboarding-skip-btn"
            onClick={onFinish}
            className="text-xs font-semibold px-3 py-1.5 rounded-full text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition-colors"
          >
            {lang === 'mr' ? 'सोडून द्या (Skip)' : 'Skip Flyover'}
          </button>
        </div>

        {/* Calm Graphic Preview Canvas */}
        <div className="relative h-48 mx-6 mt-4 rounded-2xl overflow-hidden bg-slate-50 border border-slate-200 flex flex-col justify-between p-4">
          {/* Subtle Grid Radar Graphic */}
          <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#0284c7_1px,transparent_1px)] [background-size:16px_16px]" />
          
          {/* River / Elevation Line Animation */}
          <svg className="absolute inset-0 w-full h-full opacity-60 pointer-events-none" viewBox="0 0 400 180">
            <path 
              d="M 10,90 Q 100,50 200,105 T 390,70" 
              fill="none" 
              stroke={palette.baseColor} 
              strokeWidth="3.5" 
              strokeDasharray="6 4"
            />
            <circle cx="200" cy="105" r="7" fill={palette.baseColor} className="animate-ping opacity-60" />
            <circle cx="200" cy="105" r="4.5" fill="#ffffff" stroke={palette.baseColor} strokeWidth="2" />
          </svg>

          {/* Top Info inside flyover */}
          <div className="relative z-10 flex justify-between items-start">
            <div className="bg-white/95 px-3 py-1 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-[11px] font-medium text-slate-700">
                {lang === 'mr' ? step.location_mr : step.location_en}
              </span>
            </div>
            <div 
              className="px-2.5 py-1 rounded-xl text-[11px] font-bold tracking-wide shadow-sm"
              style={{ backgroundColor: palette.tone90, color: palette.tone30, border: `1px solid ${palette.tone70}` }}
            >
              {lang === 'mr' ? palette.marathiName : palette.name}
            </div>
          </div>

          {/* Plain-Language Citizen Lead Card */}
          <div className="relative z-10 bg-white/95 p-3 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
                {lang === 'mr' ? step.metricLabel_mr : step.metricLabel_en}
              </div>
              <div className="text-sm sm:text-base font-bold text-slate-900 mt-0.5">
                {lang === 'mr' ? step.headline_mr : step.headline_en}
              </div>
            </div>
            <div 
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm ml-2" 
              style={{ backgroundColor: palette.tone90, color: palette.tone50 }}
            >
              <span className="material-symbols-outlined material-symbols-filled text-xl">
                {palette.symbol}
              </span>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="px-6 py-4 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span 
                className="text-xs font-bold px-2 py-0.5 rounded uppercase" 
                style={{ backgroundColor: palette.tone90, color: palette.tone30 }}
              >
                {lang === 'mr' ? palette.marathiName : palette.name}
              </span>
              <span className="text-xs text-slate-500 font-medium">
                Step {currentStep + 1} of {FLYOVER_STOPS.length}
              </span>
            </div>

            {/* Tap-to-reveal underlying telemetry toggle */}
            <button
              onClick={() => setShowTech(!showTech)}
              className="text-[11px] font-medium text-slate-500 hover:text-slate-800 flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-xs">tune</span>
              <span>{showTech ? (lang === 'mr' ? 'माहिती लपवा' : 'Hide data') : (lang === 'mr' ? 'तांत्रिक माहिती' : 'Tap to reveal data')}</span>
            </button>
          </div>

          <h2 className="text-lg font-bold text-slate-900 tracking-tight">
            {lang === 'mr' ? step.title_mr : step.title_en}
          </h2>

          <p className="text-sm text-slate-600 leading-relaxed min-h-[40px]">
            {lang === 'mr' ? step.subtitle_mr : step.subtitle_en}
          </p>

          {/* Collapsible Underneath Telemetry */}
          {showTech && (
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-700 flex items-center gap-2">
              <span className="material-symbols-outlined text-sm text-sky-600">sensors</span>
              <span>{lang === 'mr' ? step.techDetail_mr : step.techDetail_en}</span>
            </div>
          )}

          {/* Stepper Dots */}
          <div className="flex gap-1.5 my-1">
            {FLYOVER_STOPS.map((_, i) => (
              <button
                key={i}
                onClick={() => {
                  setCurrentStep(i);
                  setShowTech(false);
                }}
                className={`h-1.5 rounded-full transition-all duration-200 ${i === currentStep ? 'w-8 bg-sky-600' : 'w-2 bg-slate-200'}`}
              />
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-6 pt-3 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row gap-3">
          <button
            id="onboarding-check-risk-btn"
            onClick={onFinish}
            className="flex-1 py-3 px-5 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2 bg-sky-600 hover:bg-sky-700 text-white shadow-md"
          >
            <span className="material-symbols-outlined text-lg">radar</span>
            {lang === 'mr' ? 'माझा धोका तपासा' : 'Check My Risk'}
          </button>

          <button
            id="onboarding-login-btn"
            onClick={() => {
              onFinish();
              onLoginClick();
            }}
            className="py-3 px-5 rounded-2xl font-semibold text-sm transition-all border border-slate-300 hover:border-slate-400 text-slate-700 hover:text-slate-900 bg-white shadow-sm flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-lg">login</span>
            {lang === 'mr' ? 'लॉगिन करा' : 'Login'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
