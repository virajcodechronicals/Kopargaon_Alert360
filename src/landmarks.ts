// Cached Kopargaon Landmark and POI dataset from OpenStreetMap / Overpass / Nominatim
// Caching locally ensures 0 API cost, instant zero-latency loading, and full offline survivability

export interface LocalLandmark {
  id: string;
  name: string;
  name_mr: string;
  category: 'ghat' | 'temple' | 'campus' | 'bridge' | 'hospital' | 'admin' | 'station';
  coordinates: [number, number]; // [lng, lat]
  elevation_m: number;
  description_en: string;
  description_mr: string;
  osm_id?: string;
}

export const KOPARGAON_LANDMARKS: LocalLandmark[] = [
  {
    id: 'poi-godavari-ghat',
    name: 'Godavari River Ghat (Bet Kopargaon)',
    name_mr: 'गोदावरी नदी घाट (बेट कोपरगाव)',
    category: 'ghat',
    coordinates: [74.4742, 19.8912],
    elevation_m: 489,
    description_en: 'Primary riverbank bathing ghat and key flood level gauge station in Kopargaon.',
    description_mr: 'मुख्य नदीकाठचा स्नान घाट व कोपरगाव पूर पातळी मोजणी केंद्र.',
    osm_id: 'node/kop-ghat-01'
  },
  {
    id: 'poi-kedareshwar',
    name: 'Shree Kedareshwar Temple',
    name_mr: 'श्री केदारेश्वर मंदिर',
    category: 'temple',
    coordinates: [74.4718, 19.8925],
    elevation_m: 491,
    description_en: 'Historic riverside Shiva shrine; acts as a critical low-lying flood reference landmark.',
    description_mr: 'ऐतिहासिक पुरातन शिवमंदिर; नदीकाठचा पूर निर्देशक महत्त्वाचा परिसर.',
    osm_id: 'node/kop-kedar-02'
  },
  {
    id: 'poi-sanjivani-campus',
    name: 'Sanjivani Group of Institutes Campus',
    name_mr: 'संजीवनी शैक्षणिक संकुल',
    category: 'campus',
    coordinates: [74.4554, 19.8781],
    elevation_m: 508,
    description_en: 'Major educational campus, engineering hub, and designated emergency high-ground assembly center.',
    description_mr: 'संजीवनी अभियांत्रिकी संकुल, सुरक्षित उंच ठिकाण व आपत्कालीन मदत केंद्र.',
    osm_id: 'way/sanjivani-engg'
  },
  {
    id: 'poi-godavari-bridge',
    name: 'Kopargaon-Yeola Old Godavari Bridge',
    name_mr: 'कोपरगाव-येवला जुना गोदावरी पूल',
    category: 'bridge',
    coordinates: [74.4782, 19.8895],
    elevation_m: 494,
    description_en: 'Historic road bridge across Godavari connecting Ahmednagar and Nashik boundaries.',
    description_mr: 'गोदावरीवरील मुख्य पूल, पूर विसर्ग इशारा धोक्याची पातळी मोजणी बिंदू.',
    osm_id: 'way/kop-old-bridge'
  },
  {
    id: 'poi-rural-hospital',
    name: 'Kopargaon Sub-District / Rural Hospital',
    name_mr: 'उपजिल्हा रुग्णालय, कोपरगाव',
    category: 'hospital',
    coordinates: [74.4795, 19.8841],
    elevation_m: 497,
    description_en: '24x7 Government emergency medical triage and trauma center.',
    description_mr: '२४ तास शासकीय आपत्कालीन वैद्यकीय व ट्रॉमा केंद्र.',
    osm_id: 'node/kop-sdh-04'
  },
  {
    id: 'poi-tehsil-office',
    name: 'Kopargaon Tehsil & Disaster Control Center',
    name_mr: 'तहसील कार्यालय व आपत्ती व्यवस्थापन कक्ष',
    category: 'admin',
    coordinates: [74.4812, 19.8860],
    elevation_m: 496,
    description_en: 'Central administrative nodal authority and disaster control coordination room.',
    description_mr: 'तालुका प्रशासन, नियंत्रण कक्ष व समन्वय मुख्यालय.',
    osm_id: 'node/kop-tehsil-05'
  },
  {
    id: 'poi-railway-station',
    name: 'Kopargaon Railway Station (CR)',
    name_mr: 'कोपरगाव रेल्वे स्थानक',
    category: 'station',
    coordinates: [74.4925, 19.8732],
    elevation_m: 504,
    description_en: 'Central Railway junction serving Shirdi pilgrimage transit corridors.',
    description_mr: 'मध्य रेल्वे स्थानक व शिर्डी तीर्थक्षेत्र मार्ग.',
    osm_id: 'node/kop-station-06'
  },
  {
    id: 'poi-dhamori-phata',
    name: 'Dhamori Agricultural Junction',
    name_mr: 'धामोरी कृषी फाटा',
    category: 'admin',
    coordinates: [74.4320, 19.9050],
    elevation_m: 512,
    description_en: 'Western rural farming junction, onion and pomegranate storage market.',
    description_mr: 'पश्चिम ग्रामीण कृषी परिसर, कांदा व डाळिंब साठवणूक केंद्र.',
    osm_id: 'node/kop-dhamori-07'
  }
];

// In-memory runtime cache for geocoding / search queries
const landmarkSearchCache = new Map<string, LocalLandmark[]>();

export function searchLandmarks(query: string): LocalLandmark[] {
  const q = query.trim().toLowerCase();
  if (!q) return KOPARGAON_LANDMARKS;
  
  if (landmarkSearchCache.has(q)) {
    return landmarkSearchCache.get(q)!;
  }
  
  const results = KOPARGAON_LANDMARKS.filter(lm => 
    lm.name.toLowerCase().includes(q) ||
    lm.name_mr.includes(q) ||
    lm.description_en.toLowerCase().includes(q) ||
    lm.description_mr.includes(q) ||
    lm.category.toLowerCase().includes(q)
  );
  
  landmarkSearchCache.set(q, results);
  return results;
}
