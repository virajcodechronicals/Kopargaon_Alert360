import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  AlertOctagon, 
  Phone, 
  Share2, 
  MapPin, 
  Volume2, 
  VolumeX, 
  X, 
  ShieldAlert, 
  Radio, 
  CheckCircle2, 
  Copy 
} from 'lucide-react';
import { SpeechEngine } from '../utils/speech';

interface SOSBeaconModalProps {
  onClose: () => void;
  lang: 'en' | 'mr';
  currentLocation?: { lat: number; lng: number };
}

export const SOSBeaconModal: React.FC<SOSBeaconModalProps> = ({
  onClose,
  lang,
  currentLocation = { lat: 19.8912, lng: 74.4789 }
}) => {
  const [coords, setCoords] = useState<{ lat: number; lng: number }>(currentLocation);
  const [gpsStatus, setGpsStatus] = useState<'fetching' | 'locked' | 'default'>('fetching');
  const [userName, setUserName] = useState('');
  const [userPhone, setUserPhone] = useState('');
  const [emergencyType, setEmergencyType] = useState<'trapped_water' | 'medical' | 'building_collapse' | 'cattle_rescue'>('trapped_water');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const unsub = SpeechEngine.subscribe(setIsSpeaking);
    return () => unsub();
  }, []);

  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setGpsStatus('locked');
        },
        () => {
          setGpsStatus('default');
        },
        { timeout: 8000, enableHighAccuracy: true }
      );
    } else {
      setGpsStatus('default');
    }
  }, []);

  const emergencyTypeLabels = {
    trapped_water: { en: 'Trapped by Floodwaters (गोदावरी पूर अडकले)', mr: 'गोदावरी पुराच्या पाण्यात अडकलो आहे' },
    medical: { en: 'Medical Emergency / Injury', mr: 'वैद्यकीय आणीबाणी / रुग्ण मदत' },
    building_collapse: { en: 'Structure Collapse / Danger', mr: 'इमारत / पत्रे कोसळण्याची भीती' },
    cattle_rescue: { en: 'Cattle / Livestock Stranded', mr: 'जनावरे / गोठा पुराच्या विळख्यात' }
  };

  const mapsLink = `https://maps.google.com/?q=${coords.lat.toFixed(5)},${coords.coords_lng ? coords.coords_lng : coords.lng.toFixed(5)}`;
  
  const generateSOSMessage = () => {
    const typeLabel = emergencyTypeLabels[emergencyType][lang];
    if (lang === 'mr') {
      return `🚨 *तातडीची आपत्कालीन मदत हवी आहे! (कोपरगाव SOS)*
प्रकार: ${typeLabel}
नाव: ${userName || 'नागरिक'} | फोन: ${userPhone || 'उपलब्ध नाही'}
📍 *माझे लाईव्ह स्थान:* ${mapsLink}
(अक्षांश: ${coords.lat.toFixed(5)}, रेखांश: ${coords.lng.toFixed(5)})
कृपया तातडीने बचाव पथक (SDRF/अग्निशामक) पाठवा.`;
    }
    return `🚨 *URGENT DISASTER SOS BEACON (KOPARGAON)*
Type: ${typeLabel}
Name: ${userName || 'Citizen'} | Phone: ${userPhone || 'N/A'}
📍 *Live GPS Pin:* ${mapsLink}
(Lat: ${coords.lat.toFixed(5)}, Lng: ${coords.lng.toFixed(5)})
Requesting immediate rescue dispatch to this location.`;
  };

  const handleWhatsAppShare = () => {
    const msg = encodeURIComponent(generateSOSMessage());
    window.open(`https://api.whatsapp.com/send?text=${msg}`, '_blank');
  };

  const handleCopyLocation = () => {
    navigator.clipboard.writeText(generateSOSMessage());
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const toggleSpeech = () => {
    if (isSpeaking) {
      SpeechEngine.stop();
    } else {
      const speechText = lang === 'mr'
        ? "आपत्कालीन सूचना: घाबरू नका. तात्काळ ११२ किंवा १०८ वर संपर्क करा. तुमचे स्थान नियंत्रण कक्षाला पाठवले जात आहे. उंच ठिकाणी थांबा."
        : "Emergency broadcast: Stay calm. Call 112 or 108 immediately. Your live GPS coordinates are being transmitted to Kopargaon Control Room. Move to high ground.";
      SpeechEngine.speak(speechText, lang);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white dark:bg-slate-900 border-2 border-red-500/40 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden my-auto"
      >
        {/* Header with Pulsing Beacon */}
        <div className="bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white p-5 relative overflow-hidden">
          <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none"></div>
          
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-xl bg-white text-red-600 flex items-center justify-center font-bold shadow-lg">
                  <AlertOctagon className="w-6 h-6 animate-pulse text-red-600" />
                </div>
                <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-300 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-yellow-400"></span>
                </span>
              </div>
              <div>
                <h2 className="text-xl font-bold tracking-tight">
                  {lang === 'mr' ? 'आपत्कालीन SOS संकट बीकन' : 'Emergency SOS Distress Beacon'}
                </h2>
                <p className="text-xs text-red-100 font-medium">
                  {lang === 'mr' ? 'कोपरगाव आपत्ती नियंत्रण कक्ष जलद संपर्क' : 'Kopargaon 24x7 Quick Response Dispatch'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button 
                onClick={toggleSpeech}
                className={`p-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                  isSpeaking ? 'bg-amber-400 text-slate-900' : 'bg-red-800/60 hover:bg-red-800 text-white'
                }`}
                title="Audio Guidance"
              >
                {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                <span className="hidden sm:inline">{lang === 'mr' ? 'ऑडिओ' : 'Audio'}</span>
              </button>
              <button 
                onClick={onClose}
                className="p-2 rounded-lg bg-red-800/40 hover:bg-red-800/80 text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* GPS Live Coordinates Pin */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center">
                <MapPin className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1.5">
                  <span>{lang === 'mr' ? 'लाईव्ह जीपीएस स्थान:' : 'Live GPS Pin:'}</span>
                  <span className={`inline-flex items-center px-1.5 py-0.2 text-[10px] rounded font-semibold ${
                    gpsStatus === 'locked' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                  }`}>
                    {gpsStatus === 'locked' ? (lang === 'mr' ? 'लॉक्ड (अचूक)' : 'Locked GPS') : (lang === 'mr' ? 'कोपरगाव केंद्र' : 'Kopargaon Center')}
                  </span>
                </div>
                <div className="text-sm font-bold text-slate-800 dark:text-slate-100">
                  {coords.lat.toFixed(4)}° N, {coords.lng.toFixed(4)}° E
                </div>
              </div>
            </div>

            <button
              onClick={handleCopyLocation}
              className="px-2.5 py-1.5 bg-white dark:bg-slate-700 hover:bg-slate-100 border border-slate-200 dark:border-slate-600 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1 shadow-sm transition-colors"
            >
              {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? (lang === 'mr' ? 'कॉपी झाले!' : 'Copied!') : (lang === 'mr' ? 'कॉपी करा' : 'Copy SOS')}</span>
            </button>
          </div>

          {/* Emergency Details Form */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {lang === 'mr' ? 'आपत्कालीन अडचण निवडा:' : 'Emergency Condition:'}
              </label>
              <select 
                value={emergencyType} 
                onChange={(e: any) => setEmergencyType(e.target.value)}
                className="w-full text-sm px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-medium text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-red-500 focus:outline-none"
              >
                <option value="trapped_water">{lang === 'mr' ? 'गोदावरी पुराच्या पाण्यात अडकलो आहे' : 'Trapped in Godavari Floodwaters'}</option>
                <option value="medical">{lang === 'mr' ? 'तातडीची वैद्यकीय मदत / रुग्णवाहिका' : 'Critical Medical Assistance / Ambulance'}</option>
                <option value="building_collapse">{lang === 'mr' ? 'इमारत किंवा पत्रे पडल्याने धोका' : 'Structure / Roof Collapse Threat'}</option>
                <option value="cattle_rescue">{lang === 'mr' ? 'गोठा / जनावरे पुराच्या वेढ्यात' : 'Livestock / Dairy Cattle Stranded'}</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  {lang === 'mr' ? 'आपले नाव (ऐच्छिक):' : 'Your Name (Optional):'}
                </label>
                <input 
                  type="text" 
                  value={userName} 
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder={lang === 'mr' ? 'उदा. सचिन वाघ' : 'e.g. Rahul Patil'}
                  className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  {lang === 'mr' ? 'मोबाईल क्रमांक:' : 'Contact Phone:'}
                </label>
                <input 
                  type="tel" 
                  value={userPhone} 
                  onChange={(e) => setUserPhone(e.target.value)}
                  placeholder="98XXXXXXXX"
                  className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100"
                />
              </div>
            </div>
          </div>

          {/* One-Tap Direct Call Hotlines */}
          <div>
            <div className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-red-600" />
              <span>{lang === 'mr' ? 'तातडीचे सरकारी आपत्कालीन फोन' : 'Instant Direct Helplines'}</span>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <a 
                href="tel:112"
                className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 border border-red-200 dark:border-red-800/60 rounded-xl text-red-700 dark:text-red-300 transition-colors shadow-sm"
              >
                <div>
                  <div className="text-xs font-bold">{lang === 'mr' ? 'राष्ट्रीय मदत कक्ष' : 'Police & SDRF'}</div>
                  <div className="text-lg font-black tracking-tight">112</div>
                </div>
                <div className="w-8 h-8 rounded-full bg-red-600 text-white flex items-center justify-center">
                  <Phone className="w-4 h-4" />
                </div>
              </a>

              <a 
                href="tel:108"
                className="flex items-center justify-between p-3 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 border border-emerald-200 dark:border-emerald-800/60 rounded-xl text-emerald-700 dark:text-emerald-300 transition-colors shadow-sm"
              >
                <div>
                  <div className="text-xs font-bold">{lang === 'mr' ? 'रुग्णवाहिका' : 'Ambulance'}</div>
                  <div className="text-lg font-black tracking-tight">108</div>
                </div>
                <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                  <Phone className="w-4 h-4" />
                </div>
              </a>

              <a 
                href="tel:1077"
                className="flex items-center justify-between p-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 transition-colors"
              >
                <div>
                  <div className="text-[11px] font-medium text-slate-600 dark:text-slate-400">{lang === 'mr' ? 'तहसील आपत्ती कक्ष' : 'Tehsil Control'}</div>
                  <div className="text-sm font-bold">1077</div>
                </div>
                <Phone className="w-4 h-4 text-slate-500" />
              </a>

              <a 
                href="tel:02423222333"
                className="flex items-center justify-between p-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 transition-colors"
              >
                <div>
                  <div className="text-[11px] font-medium text-slate-600 dark:text-slate-400">{lang === 'mr' ? 'कोपरगाव पोलीस ठाणे' : 'Kopargaon Police'}</div>
                  <div className="text-sm font-bold">02423-222333</div>
                </div>
                <Phone className="w-4 h-4 text-slate-500" />
              </a>
            </div>
          </div>

          {/* Action Buttons: WhatsApp SOS and Cancel */}
          <div className="pt-2 flex flex-col gap-2">
            <button
              onClick={handleWhatsAppShare}
              className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all"
            >
              <Share2 className="w-5 h-5" />
              <span>{lang === 'mr' ? 'व्हॉट्सअ‍ॅपवर लाईव्ह लोकेशन व SOS पाठवा' : 'Send WhatsApp SOS with Live Map Pin'}</span>
            </button>

            <button
              onClick={onClose}
              className="w-full py-2.5 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-xl text-xs transition-colors"
            >
              {lang === 'mr' ? 'मागे जा (Close SOS)' : 'Close SOS Window'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
