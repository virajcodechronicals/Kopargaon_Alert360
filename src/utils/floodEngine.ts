export function calculateFloodTimeline(baseLevel: number, damDischarges: any[], rainForecast: number) {
  // mathematical hydrodynamic flood routing engine
  // Account for delayed wave arrival times: Gangapur (14h), Darna (18h), Nandur Madhmeshwar (7h), Nilwande (10h), Bhandardara (12h).
  const timeline = [0, 12, 24, 48, 72];
  const predictions: any[] = [];
  
  timeline.forEach(t => {
    let deltaDamWave = 0;
    damDischarges.forEach(dam => {
      // rough triangular routing or lag routing
      let travelTime = 14;
      if (dam.name.includes('Gangapur')) travelTime = 14;
      if (dam.name.includes('Darna')) travelTime = 18;
      if (dam.name.includes('Nandur')) travelTime = 7;
      if (dam.name.includes('Nilwande')) travelTime = 10;
      if (dam.name.includes('Bhandardara')) travelTime = 12;

      // if t is close to travelTime, wave hits
      if (t >= travelTime - 6 && t <= travelTime + 12) {
        // basic conversion: 10,000 cusecs -> ~ 0.5m rise at Kopargaon
        deltaDamWave += (dam.discharge_cusecs / 10000) * 0.5;
      }
    });

    // Rain accumulation: 50mm rain -> ~ 0.2m rise
    let deltaRain = (rainForecast / 50) * 0.2;

    const projectedStage = baseLevel + deltaDamWave + deltaRain;
    const isDanger = projectedStage >= 16.50;
    const isWarning = projectedStage >= 14.50;
    
    let risk_level = 'LOW';
    if (isDanger) risk_level = 'CRITICAL';
    else if (isWarning) risk_level = 'HIGH';
    else if (projectedStage >= 12.0) risk_level = 'MODERATE';

    predictions.push({
      timeOffset: t,
      projectedStage: projectedStage.toFixed(2),
      risk_level,
      affected_wards: isDanger ? ['Bet Kopargaon', 'Kedareshwar Temple Ghats'] : (isWarning ? ['Bet Kopargaon'] : []),
      directives_en: isDanger ? 'Mandatory Evacuation. Move to Sanjivani Campus immediately.' : (isWarning ? 'Be prepared to evacuate low-lying areas.' : 'Monitor river levels.'),
      directives_mr: isDanger ? 'तातडीने स्थलांतर करा. संजीवनी कॅम्पसमध्ये जा.' : (isWarning ? 'सखल भागातून स्थलांतराची तयारी ठेवा.' : 'नदीच्या पातळीवर लक्ष ठेवा.')
    });
  });

  return predictions;
}
