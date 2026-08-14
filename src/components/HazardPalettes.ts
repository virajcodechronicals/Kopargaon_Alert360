import { HazardType, RiskLevel } from '../types';

export interface HazardPalette {
  name: string;
  marathiName: string;
  symbol: string;
  baseColor: string;
  tone90: string;
  tone70: string;
  tone50: string;
  tone30: string;
}

export const HAZARD_PALETTES: Record<HazardType, HazardPalette> = {
  flood: {
    name: 'Flood',
    marathiName: 'पूर',
    symbol: 'water_drop',
    baseColor: '#0284c7', // cyan-blue
    tone90: '#e0f2fe',
    tone70: '#7dd3fc',
    tone50: '#0284c7',
    tone30: '#082f49',
  },
  drought: {
    name: 'Drought',
    marathiName: 'दुष्काळ',
    symbol: 'grass',
    baseColor: '#d97706', // amber-brown
    tone90: '#fef3c7',
    tone70: '#fcd34d',
    tone50: '#d97706',
    tone30: '#451a03',
  },
  heatwave: {
    name: 'Heatwave',
    marathiName: 'उष्णतेची लाट',
    symbol: 'thermostat',
    baseColor: '#dc2626', // red-orange
    tone90: '#fee2e2',
    tone70: '#fca5a5',
    tone50: '#dc2626',
    tone30: '#450a0a',
  },
  unseasonal: {
    name: 'Unseasonal Rain / Storm',
    marathiName: 'अवकाळी पाऊस / वादळ',
    symbol: 'thunderstorm',
    baseColor: '#7c3aed', // violet
    tone90: '#ede9fe',
    tone70: '#c4b5fd',
    tone50: '#7c3aed',
    tone30: '#2e1065',
  }
};

/**
 * Maps a risk level and hazard to MD3 tonal surfaces and text contrasts
 */
export function getHazardTonalStyle(hazard: HazardType, level: RiskLevel = 'LOW') {
  const pal = HAZARD_PALETTES[hazard] || HAZARD_PALETTES.flood;
  
  switch (level) {
    case 'LOW':
      // Tone 90: pale surface, dark text
      return {
        bg: pal.tone90,
        text: hazard === 'flood' ? '#0369a1' : hazard === 'drought' ? '#92400e' : hazard === 'heatwave' ? '#991b1b' : '#5b21b6',
        border: hazard === 'flood' ? '#bae6fd' : hazard === 'drought' ? '#fde68a' : hazard === 'heatwave' ? '#fecaca' : '#ddd6fe',
        badgeBg: hazard === 'flood' ? '#bae6fd' : hazard === 'drought' ? '#fde68a' : hazard === 'heatwave' ? '#fecaca' : '#ddd6fe',
        badgeText: hazard === 'flood' ? '#075985' : hazard === 'drought' ? '#78350f' : hazard === 'heatwave' ? '#7f1d1d' : '#4c1d95',
        dotColor: pal.baseColor,
        fillRatio: 0.25,
      };
    case 'MODERATE':
      // Tone 70: medium-light tone
      return {
        bg: pal.tone70,
        text: hazard === 'flood' ? '#082f49' : hazard === 'drought' ? '#451a03' : hazard === 'heatwave' ? '#450a0a' : '#2e1065',
        border: pal.baseColor,
        badgeBg: pal.baseColor,
        badgeText: '#ffffff',
        dotColor: pal.baseColor,
        fillRatio: 0.5,
      };
    case 'HIGH':
      // Tone 50: saturated primary tone
      return {
        bg: pal.tone50,
        text: '#ffffff',
        border: pal.tone30,
        badgeBg: pal.tone30,
        badgeText: pal.tone90,
        dotColor: '#ffffff',
        fillRatio: 0.8,
      };
    case 'CRITICAL':
      // Tone 30: deep dark tone with glowing high-contrast text
      return {
        bg: pal.tone30,
        text: pal.tone90,
        border: pal.baseColor,
        badgeBg: pal.baseColor,
        badgeText: '#ffffff',
        dotColor: '#ef4444',
        fillRatio: 1.0,
      };
  }
}
