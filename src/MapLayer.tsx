import React, { useEffect, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { MapboxOverlay } from '@deck.gl/mapbox';
import { GeoJsonLayer, ScatterplotLayer, TextLayer } from '@deck.gl/layers';
import { HeatmapLayer } from '@deck.gl/aggregation-layers';
import { HazardType, RiskPrediction, Shelter } from './types';
import { KOPARGAON_LANDMARKS, LocalLandmark } from './landmarks';
import { KOPARGAON_MASK_GEOJSON } from './KopargaonMask';
import { KOPARGAON_BOUNDARY_GEOJSON } from './KopargaonBoundary';
import { calculateFloodTimeline } from "./utils/floodEngine";
import { HEAT_GRID } from './HeatGrid';

interface MapLayerProps {
  activeHazard: HazardType;
  predictions: RiskPrediction[];
  shelters: Shelter[];
  timeOffset: number;
  dischargeRate: number;
  lang: 'en' | 'mr';
  incidents?: any[];
  onSelectZone: (zone: { id: string; name: string }, prediction: RiskPrediction | null) => void;
  onSelectLandmark?: (landmark: LocalLandmark) => void;
  selectedLayerFilter?: 'all' | 'flood' | 'shelters' | 'heat';
  userLocation?: { lat: number; lng: number } | null;
}

// GeoJSON Geo-Polygons for the actual Kopargaon Sectors
export const KOPARGAON_SECTORS_GEOJSON: GeoJSON.FeatureCollection = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      id: 'zone-bet',
      properties: {
        id: 'zone-bet',
        name: 'Godavari Riverbank / Bet',
        name_mr: 'गोदावरी बेट / पूर पट्टा',
        baseElevation: 489,
        center: [74.4735, 19.8920]
      },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [74.4600, 19.8970],
          [74.4710, 19.8965],
          [74.4820, 19.8920],
          [74.4880, 19.8860],
          [74.4820, 19.8830],
          [74.4690, 19.8870],
          [74.4600, 19.8970]
        ]]
      }
    },
    {
      type: 'Feature',
      id: 'zone-urban',
      properties: {
        id: 'zone-urban',
        name: 'Kopargaon Urban Center',
        name_mr: 'कोपरगाव शहर',
        baseElevation: 496,
        center: [74.4795, 19.8850]
      },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [74.4720, 19.8865],
          [74.4890, 19.8850],
          [74.4920, 19.8750],
          [74.4780, 19.8730],
          [74.4710, 19.8810],
          [74.4720, 19.8865]
        ]]
      }
    },
    {
      type: 'Feature',
      id: 'zone-sanjivani',
      properties: {
        id: 'zone-sanjivani',
        name: 'Sanjivani Rural Campus',
        name_mr: 'संजीवनी परिसर',
        baseElevation: 508,
        center: [74.4554, 19.8781]
      },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [74.4460, 19.8840],
          [74.4640, 19.8840],
          [74.4650, 19.8710],
          [74.4480, 19.8700],
          [74.4460, 19.8840]
        ]]
      }
    },
    {
      type: 'Feature',
      id: 'zone-sanvatsar',
      properties: {
        id: 'zone-sanvatsar',
        name: 'Sanvatsar Sector',
        name_mr: 'संवत्सर विभाग',
        baseElevation: 504,
        center: [74.5020, 19.9050]
      },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [74.4890, 19.9200],
          [74.5150, 19.9150],
          [74.5180, 19.8950],
          [74.4930, 19.8920],
          [74.4890, 19.9200]
        ]]
      }
    },
    {
      type: 'Feature',
      id: 'zone-dhamori',
      properties: {
        id: 'zone-dhamori',
        name: 'Dhamori Agricultural Belt',
        name_mr: 'धामोरी कृषी पट्टा',
        baseElevation: 512,
        center: [74.4320, 19.9050]
      },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [74.4150, 19.9200],
          [74.4480, 19.9200],
          [74.4520, 19.8950],
          [74.4200, 19.8900],
          [74.4150, 19.9200]
        ]]
      }
    },
    {
      type: 'Feature',
      id: 'zone-kolpewadi',
      properties: {
        id: 'zone-kolpewadi',
        name: 'Kolpewadi Rural Zone',
        name_mr: 'कोळपेवाडी ग्रामीण परिसर',
        baseElevation: 518,
        center: [74.4980, 19.8550]
      },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [74.4820, 19.8680],
          [74.5200, 19.8650],
          [74.5220, 19.8400],
          [74.4840, 19.8420],
          [74.4820, 19.8680]
        ]]
      }
    }
  ]
};

// Godavari River Line GeoJSON passing through Kopargaon
export const GODAVARI_RIVER_GEOJSON: GeoJSON.Feature = {
  type: 'Feature',
  properties: { name: 'Godavari River' },
  geometry: {
    type: 'LineString',
    coordinates: [[74.306792,19.946242],[74.3096513,19.9455814],[74.3163568,19.9447393],[74.3175691,19.9442804],[74.3188244,19.943055],[74.319157,19.9427171],[74.3198115,19.9424902],[74.3202192,19.9422179],[74.3207931,19.9410934],[74.3232179,19.9361917],[74.3238884,19.935289],[74.3242371,19.9344771],[74.3259966,19.9298022],[74.3276489,19.9282085],[74.3298805,19.9271595],[74.3315864,19.9268469],[74.3331635,19.9270385],[74.3348801,19.9280774],[74.3355882,19.9296307],[74.3355238,19.9316379],[74.3345475,19.934704],[74.3344617,19.9363581],[74.33532,19.9373264],[74.3369722,19.9379618],[74.3386459,19.9379416],[74.3408775,19.9367817],[74.343034,19.9349764],[74.3432379,19.9345225],[74.3447828,19.9332012],[74.3493533,19.9306393],[74.3518102,19.9297316],[74.3537092,19.9293785],[74.3558208,19.9295407],[74.3607902,19.9315874],[74.3629682,19.9322935],[74.3650067,19.9323036],[74.3671739,19.9315874],[74.3734257,19.927583],[74.3809712,19.9237705],[74.3837392,19.9217834],[74.3890125,19.9170475],[74.3903589,19.9165886],[74.3920487,19.916644],[74.3933093,19.9169921],[74.3948114,19.9179907],[74.39722,19.9205528],[74.3986094,19.9215816],[74.400326,19.9223583],[74.4029868,19.9227416],[74.4058728,19.9226206],[74.4069457,19.9223785],[74.4090915,19.920815],[74.4108724,19.9185354],[74.4117093,19.9158018],[74.4122672,19.9113028],[74.4128466,19.9084279],[74.4137907,19.9061682],[74.4152391,19.9038077],[74.4163442,19.9011545],[74.4164729,19.9001154],[74.4160438,19.8990965],[74.4143861,19.8964483],[74.4142252,19.8952226],[74.4145632,19.8938909],[74.415974,19.891631],[74.4174975,19.8900975],[74.4214565,19.8876611],[74.4235754,19.8869447],[74.4288057,19.8866522],[74.4303024,19.886526],[74.4309515,19.8862183],[74.4313645,19.8855878],[74.4317078,19.8804019],[74.4319868,19.8754075],[74.4332957,19.8721485],[74.4350767,19.8703726],[74.4368791,19.8693838],[74.4399166,19.8684547],[74.442265,19.8681528],[74.4437778,19.8674969],[74.4475007,19.8636727],[74.4485521,19.8628755],[74.4522321,19.8615839],[74.453643,19.8615789],[74.4554132,19.8620885],[74.4562501,19.862593],[74.4566953,19.8631934],[74.4572371,19.8635617],[74.4580311,19.8643336],[74.458369,19.8651308],[74.4584978,19.8660692],[74.4589055,19.8669067],[74.460268,19.8680216],[74.4635242,19.8701607],[74.4688886,19.8721737],[74.4716942,19.8726681],[74.4729388,19.8731524],[74.4735235,19.8737528],[74.4740385,19.874116],[74.4762325,19.874792],[74.4777667,19.8751654],[74.4796872,19.8761945],[74.4820046,19.8776474],[74.4827235,19.8784647],[74.4842899,19.8820565],[74.4846708,19.8826568],[74.4850838,19.883353],[74.4853359,19.8844578],[74.4864142,19.8855171],[74.4874656,19.8861679],[74.4886297,19.88641],[74.4938171,19.8864252],[74.4954693,19.8861225],[74.4995725,19.8847485],[74.5050502,19.8824904],[74.5074642,19.8814411],[74.5155966,19.875579],[74.5172167,19.8739546],[74.5195981,19.8691731],[74.5219481,19.8652972],[74.5242226,19.8626636],[74.5261216,19.8585567],[74.5269799,19.8545607],[74.5289755,19.8503627],[74.5317757,19.8469316],[74.5345223,19.8446207],[74.5397258,19.8408968],[74.5456159,19.8357599],[74.546957,19.8352149],[74.5495856,19.834902],[74.5557976,19.8347506],[74.5567524,19.8343974],[74.5582545,19.8332368],[74.5589948,19.8314605],[74.5594668,19.8259902],[74.560132,19.8232046],[74.5613766,19.8210951],[74.563694,19.8173404],[74.5640373,19.8159273],[74.5641339,19.8134039],[74.5634472,19.8097196],[74.5614276,19.8057726],[74.560014,19.8031837],[74.5595419,19.8015888],[74.5596009,19.8003623],[74.5602608,19.799373],[74.5614838,19.7986058],[74.5628303,19.7983736],[74.5642197,19.7983989],[74.5650673,19.7985453],[74.5668644,19.7985402],[74.569037,19.7983282],[74.5703191,19.797874],[74.5718479,19.7969806],[74.5741922,19.7953099],[74.5776898,19.7941742],[74.5790255,19.7935584],[74.5838427,19.7908126],[74.5861065,19.7890762],[74.5873734,19.7875407],[74.5883381,19.7860022],[74.5888424,19.7849623],[74.5894217,19.7820699],[74.5902854,19.7781528],[74.5906287,19.7774814],[74.5913368,19.7767444],[74.5955747,19.773766],[74.6024546,19.7705528],[74.6049303,19.7696719],[74.6067113,19.7694751],[74.6082669,19.7694599],[74.6103108,19.7697628],[74.6113515,19.7702374],[74.6123385,19.7710602],[74.6132183,19.7724586],[74.614082,19.7754117],[74.6142966,19.776073],[74.614951,19.7773804],[74.6160829,19.7784052],[74.6166784,19.7790614],[74.6177351,19.7806464],[74.6184862,19.7815349],[74.6196449,19.7825747],[74.6217155,19.7849674],[74.624033,19.7884604],[74.6271658,19.7904391],[74.631679,19.7927549],[74.6334207,19.7932657],[74.6350918,19.7932204],[74.637444,19.792448],[74.6417785,19.7890661],[74.6445572,19.787673],[74.6474647,19.7863908],[74.6483982,19.7855933],[74.6496212,19.783766],[74.6500289,19.7827161],[74.6513271,19.7783244],[74.6524858,19.7771634],[74.6543527,19.7764667],[74.6566594,19.7763961],[74.6605217,19.7767595],[74.6654248,19.7769715],[74.6678173,19.7763557],[74.6693516,19.7754874],[74.6713042,19.7728523],[74.6745872,19.7686825],[74.6774948,19.7670065],[74.6791685,19.766542],[74.6822262,19.76738],[74.6859813,19.7684806],[74.6881485,19.7687835],[74.6903264,19.7684604],[74.6914959,19.7675921],[74.6920002,19.7665118],[74.6920431,19.7652395],[74.6901628,19.7612709],[74.689393,19.7590804],[74.6895218,19.7579192],[74.6905732,19.7564248],[74.6921396,19.7555968],[74.6940117,19.7553644],[74.6955943,19.7555262],[74.697268,19.7563037],[74.7002721,19.7590955],[74.7023267,19.7602971],[74.7036141,19.7610342],[74.7052664,19.76268],[74.7069508,19.7639926],[74.7083723,19.7647044],[74.7096652,19.7649619],[74.7116393,19.7649114],[74.714756,19.7642601],[74.7167408,19.7635837],[74.7183877,19.7626497],[74.7188383,19.7619076],[74.7204618,19.7573877],[74.7214776,19.7559856],[74.7223574,19.7552535],[74.7239399,19.7544659],[74.7250879,19.754158],[74.7267938,19.7541832],[74.7280705,19.7545669],[74.7292668,19.7552636],[74.7304147,19.7566571],[74.731375,19.7587825],[74.7321045,19.7618268],[74.7328448,19.7630586],[74.7342074,19.7640481],[74.7358596,19.7645025],[74.7370934,19.76424],[74.7380805,19.7634827],[74.7403282,19.7606],[74.7436273,19.7548698],[74.7452795,19.7526686],[74.7476774,19.7506036],[74.7499895,19.7493363],[74.7516203,19.748892],[74.753015,19.7490233],[74.7545278,19.7500987],[74.755311,19.7508056],[74.7563034,19.7520981],[74.7567862,19.7524919],[74.7590661,19.7538702],[74.7608471,19.7543549],[74.7627944,19.7545265],[74.7642481,19.7543044],[74.7655773,19.7532903],[74.7664797,19.7517295],[74.7669303,19.7501341],[74.7668391,19.7481347],[74.7659325,19.7430049],[74.7659111,19.7417326],[74.7664797,19.7394907],[74.7677135,19.7374609],[74.7688454,19.7367086],[74.7703528,19.7364511],[74.7758514,19.7366177],[74.7787106,19.7369358],[74.780159,19.7367843],[74.78194,19.7360471],[74.7843964,19.7338539],[74.7855502,19.7323106],[74.7859847,19.730508],[74.7858828,19.7287154],[74.7855234,19.7267309],[74.7855019,19.7222922],[74.7850943,19.7204036],[74.7849333,19.7185554],[74.7853303,19.7169697],[74.7861564,19.7158588],[74.7872507,19.7150104],[74.7925678,19.7102291],[74.7998679,19.7050212],[74.8044383,19.7028496],[74.8055005,19.7027284],[74.8086655,19.7033647],[74.8118949,19.7038546],[74.812662,19.7035061],[74.8133218,19.7026779],[74.8138744,19.7010213],[74.8140353,19.6991224],[74.8136276,19.6968799],[74.8129409,19.6954098],[74.8113473,19.6931612],[74.8099261,19.6917384],[74.8090196,19.690506],[74.8087889,19.6895413],[74.8089176,19.688213],[74.8094058,19.6871877],[74.8105967,19.6861169],[74.8168194,19.6817983],[74.8175061,19.6808285],[74.8176992,19.6797779],[74.8181069,19.6787475],[74.8195124,19.6770604],[74.8201561,19.6762522],[74.8218083,19.6705847],[74.8220175,19.6692461],[74.8222214,19.6678468],[74.8225325,19.6672305],[74.8233747,19.6665385],[74.8242062,19.6661849],[74.8246139,19.6662303],[74.8250914,19.666397],[74.8255044,19.6663465],[74.8258316,19.6660535],[74.826529,19.6650483],[74.8271674,19.6645381],[74.8280418,19.6640582],[74.8282456,19.6637349],[74.828369,19.663548],[74.8286641,19.6634772],[74.8290074,19.6635884],[74.8297155,19.6641845],[74.8304182,19.6646037],[74.8312765,19.6648007],[74.8320812,19.6648816],[74.8335296,19.6648765],[74.8352569,19.6644876],[74.8368072,19.6637753],[74.8379016,19.6628761],[74.8396397,19.6603654],[74.8414797,19.6557532],[74.8429119,19.6517622],[74.8451006,19.6480742],[74.8459536,19.647276],[74.8476702,19.6466141],[74.8494029,19.6462756],[74.8519188,19.6463161],[74.8548156,19.6464575],[74.8580772,19.6468112],[74.859606,19.6473012],[74.8650831,19.6505952],[74.867202,19.651646],[74.8682696,19.6517925],[74.8692191,19.651555],[74.8711395,19.6505497],[74.8731512,19.649999],[74.8744816,19.6501051],[74.8760104,19.6507215],[74.8778236,19.6519743],[74.8799348,19.6532782],[74.8828286,19.6547933],[74.8837459,19.6549752],[74.8848242,19.654758],[74.8858541,19.6542022],[74.8864603,19.6535051],[74.8870397,19.6522775],[74.8871791,19.6502415],[74.8866373,19.6481702],[74.8848295,19.6441335],[74.8846739,19.6428806],[74.8849314,19.6419055],[74.8857254,19.6406323],[74.8872113,19.6393086],[74.8882654,19.638869],[74.8893571,19.6389145],[74.8934693,19.6403088],[74.8959875,19.6410466],[74.8996997,19.6418348],[74.9018079,19.6428553],[74.9061853,19.6462958],[74.9078429,19.6473113],[74.9099564,19.6480439],[74.9118125,19.6484885],[74.914388,19.6486418],[74.9164259,19.6484683],[74.9176061,19.6479833],[74.9188238,19.6468971],[74.9201435,19.6458664],[74.9212915,19.6455027],[74.9224877,19.6455279],[74.925824,19.6469068],[74.9265271,19.6470739],[74.9272352,19.6469223],[74.9284315,19.6461291],[74.9296009,19.6448812],[74.9297404,19.6441992],[74.9288714,19.6407788],[74.9288928,19.6395966],[74.9294132,19.6382122],[74.9306256,19.637126],[74.9318218,19.6366561],[74.9325997,19.6367723],[74.9333775,19.637318],[74.9340105,19.6383082],[74.9346489,19.6391419],[74.9385766,19.6425308],[74.9402708,19.6442093],[74.9411988,19.6448913],[74.9435914,19.6460028],[74.945426,19.6464777],[74.9475235,19.6464878],[74.9530435,19.6458361],[74.954567,19.6459624],[74.9562782,19.6463918],[74.9591535,19.647377],[74.9610954,19.6477155],[74.9630427,19.6476094],[74.9649364,19.6471547],[74.9676722,19.6457401],[74.9699575,19.644083],[74.9738628,19.642436],[74.9807399,19.640405],[74.9830842,19.6395966],[74.9843985,19.638672],[74.9853694,19.6373028],[74.9856162,19.6363024],[74.9859381,19.6336953],[74.9861526,19.6331547],[74.9873167,19.6320028],[74.9922681,19.6292895],[74.9940437,19.6279353],[74.996742,19.6252877],[74.9982548,19.6243479],[74.999907,19.6238224],[75.001409,19.6238022],[75.0048369,19.6248026],[75.0059115,19.6250411],[75.0071168,19.625025],[75.01287,19.623787],[75.0179905,19.6235041]]
  }
};
// CARTO Free Tile Styles (Positron light style for calm citizen-comprehensible safety map)
const CARTO_LIGHT_STYLE: maplibregl.StyleSpecification = {
  version: 8,
  sources: {
    'carto-light': {
      type: 'raster',
      tiles: [
        'https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png',
        'https://b.basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png',
        'https://c.basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png',
        'https://d.basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png'
      ],
      tileSize: 256,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
    }
  },
  layers: [
    {
      id: 'carto-light-layer',
      type: 'raster',
      source: 'carto-light',
      minzoom: 0,
      maxzoom: 20
    }
  ]
};

export default function MapLayer({
  activeHazard,
  predictions,
  shelters,
  timeOffset,
  dischargeRate,
  lang,
  incidents = [],
  onSelectZone,
  onSelectLandmark,
  selectedLayerFilter = 'all',
  userLocation = null
}: MapLayerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const deckOverlayRef = useRef<MapboxOverlay | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [heatTick, setHeatTick] = useState(0);

  // Animate heat waves
  useEffect(() => {
    let animId: number;
    let startTime = performance.now();
    const animate = (time: number) => {
      setHeatTick((time - startTime) * 0.002);
      animId = requestAnimationFrame(animate);
    };
    animId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animId);
  }, []);

  // Initialize MapLibre GL JS (Free, Open-Source, 0 Billing)
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: CARTO_LIGHT_STYLE,
      center: [74.4760, 19.8880], // Kopargaon Center
      zoom: 12.8,
      pitch: 35, // 3D perspective
      bearing: -10,
      attributionControl: false
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: true }), 'top-right');
    map.addControl(new maplibregl.ScaleControl({ maxWidth: 100, unit: 'metric' }), 'bottom-left');

    const deckOverlay = new MapboxOverlay({
      interleaved: false,
      layers: []
    });

    map.addControl(deckOverlay as any);
    deckOverlayRef.current = deckOverlay;
    mapRef.current = map;

    map.on('load', () => {
      setMapLoaded(true);
      map.resize();
    });

    const handleResize = () => map.resize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      map.remove();
    };
  }, []);

  // Compute Animated Heatmap Points for Heatwave (Waves Effect)
  const heatmapData = React.useMemo(() => {
    if (activeHazard !== 'heatwave') return [];
    
    const relevantPreds = predictions.filter(p => p.hazard_type === 'heatwave');
    const hasCritical = relevantPreds.some(p => p.risk_level === 'CRITICAL');
    const baseWeight = hasCritical ? 100 : 60;
    
    return HEAT_GRID.map(pt => {
      // Create an organic wave pattern using distance and time (heatTick)
      const distFromCenter = Math.sqrt(Math.pow(pt[0] - 74.476, 2) + Math.pow(pt[1] - 19.888, 2));
      const wave = Math.sin(distFromCenter * 50 - heatTick) * Math.cos(pt[0] * 30 + heatTick * 0.5);
      // Normalize wave to 0-1
      const normalizedWave = (wave + 1) / 2;
      return {
        position: pt,
        weight: baseWeight * (0.4 + 0.6 * normalizedWave)
      };
    });
  }, [activeHazard, predictions, heatTick]);

  // Update Deck.gl Overlay Layers
  useEffect(() => {
    if (!deckOverlayRef.current || !mapLoaded) return;

    // Get current heatwave temperature
    const heatPreds = predictions.filter(p => p.hazard_type === 'heatwave');
    const currentTemp = heatPreds.length > 0 ? Math.max(...heatPreds.map(p => p.risk_score)) : 28;

    // Dynamic Color Range based on Temperature
    let heatColorRange: [number, number, number, number][] = [
      [254, 240, 138, 20],   // Yellow-200
      [253, 224, 71, 50],    // Yellow-300
      [250, 204, 21, 100],   // Yellow-400
      [234, 179, 8, 150],    // Yellow-500
      [202, 138, 4, 180],    // Yellow-600
      [161, 98, 7, 220]      // Yellow-700
    ]; // Default: Cool/Warm (<= 30)

    if (currentTemp > 40) {
      // Extreme Heat (Red/Dark Red)
      heatColorRange = [
        [253, 186, 116, 20],
        [251, 146, 60, 50],
        [249, 115, 22, 120],
        [239, 68, 68, 180],
        [185, 28, 28, 220],
        [153, 27, 27, 240]
      ];
    } else if (currentTemp > 35) {
      // High Heat (Orange/Red)
      heatColorRange = [
        [253, 230, 138, 20],
        [252, 211, 77, 50],
        [251, 146, 60, 100],
        [249, 115, 22, 150],
        [234, 88, 12, 180],
        [194, 65, 12, 220]
      ];
    } else if (currentTemp > 30) {
      // Moderate Heat (Yellow/Orange)
      heatColorRange = [
        [254, 240, 138, 20],
        [253, 224, 71, 50],
        [252, 211, 77, 100],
        [251, 146, 60, 150],
        [249, 115, 22, 180],
        [234, 88, 12, 220]
      ];
    }

    const layers = [
      // 0. Dimming Mask (covers everything outside Kopargaon)
      new GeoJsonLayer({
        id: 'kopargaon-world-mask',
        data: KOPARGAON_MASK_GEOJSON,
        filled: true,
        stroked: false,
        getFillColor: [15, 23, 42, 180] // Slate-900 with high opacity to dim outside
      }),

      // 1. GeoJSON Risk Polygon Layer
      (selectedLayerFilter === 'all' || selectedLayerFilter === 'flood') && new GeoJsonLayer({
        id: 'kopargaon-zones-layer',
        data: KOPARGAON_SECTORS_GEOJSON,
        filled: true,
        stroked: true,
        lineWidthMinPixels: 2,
        getLineColor: [71, 85, 105, 180],
        getFillColor: (f: any) => {
          const zoneId = f.properties.id;
          let level = 'LOW';
          if (activeHazard === 'flood') {
             const damDischarges = [ { name: "Gangapur", discharge_cusecs: dischargeRate } ];
             const timeline = calculateFloodTimeline(13.2, damDischarges, 20);
             const currentPred = timeline.find((p: any) => p.timeOffset === timeOffset) || timeline[0];
             level = currentPred.risk_level;
          } else {
            const pred = predictions.find(p => p.zone_id === zoneId && p.hazard_type === activeHazard);
            level = pred ? pred.risk_level : (zoneId === 'zone-bet' && activeHazard === 'flood' ? 'CRITICAL' : 'LOW');
          }
          
          // Time offset increases intensity
          const tOffset = Math.min(255, Math.floor((timeOffset || 0) * 2));

          if (activeHazard === 'flood' || selectedLayerFilter === 'flood') {
            if (level === 'CRITICAL') return [2, 132, 199, Math.min(255, 175 + tOffset)];
            if (level === 'HIGH') return [14, 165, 233, Math.min(255, 145 + tOffset)];
            if (level === 'MODERATE') return [56, 189, 248, Math.min(255, 105 + tOffset)];
            return [186, 230, 253, Math.min(255, 55 + tOffset)];
          } else if (activeHazard === 'drought') {
            if (level === 'CRITICAL') return [180, 83, 9, 175];
            if (level === 'HIGH') return [217, 119, 6, 145];
            if (level === 'MODERATE') return [245, 158, 11, 105];
            return [253, 230, 138, 55];
          } else if (activeHazard === 'heatwave') {
            if (level === 'CRITICAL') return [220, 38, 38, 175];
            if (level === 'HIGH') return [234, 88, 12, 145];
            if (level === 'MODERATE') return [249, 115, 22, 105];
            return [254, 215, 170, 55];
          } else {
            if (level === 'CRITICAL') return [124, 58, 237, 175];
            if (level === 'HIGH') return [147, 51, 234, 145];
            if (level === 'MODERATE') return [168, 85, 247, 105];
            return [233, 213, 255, 55];
          }
        },
        pickable: true,
        autoHighlight: true,
        highlightColor: [255, 255, 255, 80],
        onClick: (info) => {
          if (info.object?.properties) {
            const z = info.object.properties;
            const pred = predictions.find(p => p.zone_id === z.id && p.hazard_type === activeHazard) || null;
            onSelectZone({ id: z.id, name: z.name }, pred);
          }
        },
        updateTriggers: {
          getFillColor: [activeHazard, predictions, timeOffset, selectedLayerFilter]
        }
      }),

      // 2. Godavari River Vector Line
      (selectedLayerFilter === 'all' || selectedLayerFilter === 'flood') && new GeoJsonLayer({
        id: 'godavari-river-bed',
        data: GODAVARI_RIVER_GEOJSON,
        filled: false,
        stroked: true,
        lineWidthMinPixels: activeHazard === 'flood' ? 7 : 4,
        getLineColor: activeHazard === 'flood' ? [2, 132, 199, 220] : [14, 165, 233, 130]
      }),

      // 3. Taluka-wide Regional Hazard Layer (Best for Drought)
      (activeHazard === 'drought' && selectedLayerFilter === 'all') && new GeoJsonLayer({
        id: 'hazard-regional-layer',
        data: KOPARGAON_BOUNDARY_GEOJSON,
        filled: true,
        stroked: true,
        lineWidthMinPixels: 2,
        getLineColor: [217, 119, 6, 200],
        getFillColor: () => {
          const relevantPreds = predictions.filter(p => p.hazard_type === 'drought');
          const hasCritical = relevantPreds.some(p => p.risk_level === 'CRITICAL');
          const hasHigh = relevantPreds.some(p => p.risk_level === 'HIGH');
          const hasModerate = relevantPreds.some(p => p.risk_level === 'MODERATE');
          
          if (hasCritical) return [180, 83, 9, 140];
          if (hasHigh) return [217, 119, 6, 120];
          if (hasModerate) return [245, 158, 11, 100];
          return [253, 230, 138, 70];
        },
        updateTriggers: {
          getFillColor: [predictions]
        }
      }),

      // 4. Animated Thermal Waves for Heatwave
      (activeHazard === 'heatwave' || selectedLayerFilter === 'heat') && (selectedLayerFilter === 'all' || selectedLayerFilter === 'heat') && new HeatmapLayer({
        id: 'hazard-heatmap-layer',
        data: heatmapData,
        getPosition: (d: any) => d.position,
        getWeight: (d: any) => d.weight,
        radiusPixels: 80,
        intensity: 1.5,
        threshold: 0.1,
        colorRange: heatColorRange
      }),

      // 4. Shelter Pins Layer (Scatterplot)
      (selectedLayerFilter === 'all' || selectedLayerFilter === 'shelters') && new ScatterplotLayer({
        id: 'shelters-deck-layer',
        data: shelters,
        getPosition: (d: any) => {
          if (d.location && typeof d.location.lng === 'number') {
            return [d.location.lng, d.location.lat];
          }
          if (d.id === 'offline-1') return [74.478, 19.883];
          if (d.id === 'offline-2') return [74.455, 19.878];
          return [74.492, 19.873];
        },
        getRadius: 10,
        radiusUnits: 'pixels',
        getFillColor: [16, 185, 129, 255],
        stroked: true,
        getLineColor: [255, 255, 255, 255],
        lineWidthMinPixels: 2.5,
        pickable: true,
        onClick: (info) => {
          if (info.object) {
            onSelectZone({ id: info.object.id, name: info.object.name }, null);
          }
        }
      }),

      // 6. OpenStreetMap Landmarks (Scatterplot + Billboard Text)
      (selectedLayerFilter === 'all' || selectedLayerFilter === 'flood') && new ScatterplotLayer({
        id: 'osm-landmarks-layer',
        data: KOPARGAON_LANDMARKS,
        getPosition: (d: LocalLandmark) => [d.coordinates[0], d.coordinates[1]],
        getRadius: 9,
        radiusUnits: 'pixels',
        getFillColor: (d: LocalLandmark) => {
          if (d.category === 'ghat') return [56, 189, 248, 255];
          if (d.category === 'temple') return [245, 158, 11, 255];
          if (d.category === 'campus') return [168, 85, 247, 255];
          if (d.category === 'hospital') return [239, 68, 68, 255];
          return [148, 163, 184, 255];
        },
        stroked: true,
        getLineColor: [255, 255, 255, 255],
        lineWidthMinPixels: 2,
        pickable: true,
        onClick: (info) => {
          if (info.object) {
            onSelectLandmark?.(info.object);
            onSelectZone({ id: info.object.id, name: info.object.name }, null);
          }
        }
      }),

      // Landmark Labels in 3D TextLayer
      new TextLayer({
        id: 'osm-landmarks-text',
        data: KOPARGAON_LANDMARKS,
        getPosition: (d: LocalLandmark) => [d.coordinates[0], d.coordinates[1]],
        getText: (d: LocalLandmark) => lang === 'mr' ? d.name_mr : d.name,
        getSize: 12,
        getColor: [15, 23, 42, 255],
        getTextAnchor: 'start',
        getAlignmentBaseline: 'center',
        getPixelOffset: [14, 0],
        billboard: true,
        background: true,
        getBackgroundColor: [255, 255, 255, 230],
        backgroundPadding: [5, 3, 5, 3],
        fontFamily: 'Roboto Flex, system-ui, sans-serif'
      }),

      // 7. Citizen Reported Incidents
      (selectedLayerFilter === 'all' || selectedLayerFilter === 'flood') && incidents.length > 0 && new ScatterplotLayer({
        id: 'incidents-deck-layer',
        data: incidents,
        getPosition: (d: any) => [d.longitude || 74.475, d.latitude || 19.888],
        getRadius: 11,
        radiusUnits: 'pixels',
        getFillColor: [239, 68, 68, 240],
        stroked: true,
        getLineColor: [255, 255, 255, 255],
        lineWidthMinPixels: 2,
        pickable: true
      }),

      // 8. Live GPS Pin
      userLocation && new ScatterplotLayer({
        id: 'user-gps-location',
        data: [userLocation],
        getPosition: (d: any) => [d.lng, d.lat],
        getRadius: 14,
        radiusUnits: 'pixels',
        getFillColor: [16, 185, 129, 255], // Emerald
        stroked: true,
        getLineColor: [255, 255, 255, 255],
        lineWidthMinPixels: 3,
        pickable: false,
      })
    ].filter(Boolean);

    deckOverlayRef.current.setProps({ layers });
  }, [mapLoaded, activeHazard, predictions, shelters, incidents, lang, timeOffset, selectedLayerFilter, userLocation]);

  return (
    <div className="relative w-full h-full">
      {/* MapLibre WebGL Canvas Container */}
      <div ref={mapContainerRef} className="w-full h-full" />
    </div>
  );
}
