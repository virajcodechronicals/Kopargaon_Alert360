import { Language, HazardType, RiskLevel } from './types';

export const translations = {
  en: {
    appTitle: 'Kopargaon Early Warning',
    hazards: 'Hazards',
    contacts: 'Emergency Info',
    assistant: 'AI Assistant',
    hazardNames: {
      flood: 'Flood',
      drought: 'Drought',
      heatwave: 'Heatwave',
      unseasonal: 'Unseasonal Weather',
    },
    riskLevels: {
      LOW: 'LOW RISK',
      MODERATE: 'MODERATE RISK',
      HIGH: 'HIGH RISK',
      CRITICAL: 'CRITICAL RISK',
    },
    actionAdvice: {
      LOW: 'No immediate action required. Routine activities can continue.',
      MODERATE: 'Stay informed. Check updates daily and prepare basic supplies.',
      HIGH: 'Prepare for impact. Secure property and be ready to move if advised.',
      CRITICAL: 'Take action immediately. Follow evacuation or shelter orders now.',
    },
    lastUpdated: 'Updated',
    metric: 'Telemetry',
    offlineNotice: 'Available offline',
    sheltersTitle: 'Safe Shelters',
    contactsTitle: 'Contacts',
    askAssistant: 'Ask AI for advice',
    asking: 'Getting advice...',
    placeholder: 'Ask the assistant for current guidance...',
    noNetwork: 'Network unavailable. Using offline guidelines.',
  },
  mr: {
    appTitle: 'कोपरगाव पूर्व-सूचना',
    hazards: 'धोके (Hazards)',
    contacts: 'आणीबाणी माहिती (Emergency Info)',
    assistant: 'एआय सहाय्यक (AI Assistant)',
    hazardNames: {
      flood: 'पूर (Flood)',
      drought: 'दुष्काळ (Drought)',
      heatwave: 'उष्णतेची लाट (Heatwave)',
      unseasonal: 'अवकाळी हवामान (Unseasonal Weather)',
    },
    riskLevels: {
      LOW: 'कमी धोका (LOW)',
      MODERATE: 'मध्यम धोका (MODERATE)',
      HIGH: 'जास्त धोका (HIGH)',
      CRITICAL: 'गंभीर धोका (CRITICAL)',
    },
    actionAdvice: {
      LOW: 'कोणतीही तातडीची कारवाई आवश्यक नाही. दैनंदिन कामे चालू ठेवा.',
      MODERATE: 'माहिती घेत राहा. दररोज अपडेट तपासा आणि प्राथमिक साहित्य तयार ठेवा.',
      HIGH: 'प्रभावासाठी तयार राहा. मालमत्ता सुरक्षित करा आणि सूचना मिळाल्यास हलण्यासाठी तयार राहा.',
      CRITICAL: 'त्वरित कारवाई करा. आताच स्थलांतर किंवा निवारा आदेशांचे पालन करा.',
    },
    lastUpdated: 'अपडेट केले',
    metric: 'टेलीमेट्री (Telemetry)',
    offlineNotice: 'ऑफलाइन उपलब्ध (Available offline)',
    sheltersTitle: 'सुरक्षित निवारे (Safe Shelters)',
    contactsTitle: 'संपर्क (Contacts)',
    askAssistant: 'सल्ल्यासाठी एआयला विचारा (Ask AI)',
    asking: 'सल्ला मिळवत आहे...',
    placeholder: 'सध्याच्या मार्गदर्शनासाठी सहाय्यकाला विचारा...',
    noNetwork: 'नेटवर्क उपलब्ध नाही. ऑफलाइन मार्गदर्शक तत्त्वे वापरत आहे.',
  }
};

export function t(key: keyof typeof translations.en, lang: Language): any {
  return translations[lang][key];
}
