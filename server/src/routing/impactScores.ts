import type { GraphNode } from './astar.js';

// ─── Texas Census Data ────────────────────────────────────────────────────────
// 2020 Census MSA populations for major Texas metros
const TX_CITIES = [
  { name: 'Houston',       lat: 29.760, lng: -95.370, pop: 2_304_580 },
  { name: 'San Antonio',   lat: 29.425, lng: -98.494, pop: 1_434_625 },
  { name: 'Dallas',        lat: 32.776, lng: -96.797, pop: 1_304_379 },
  { name: 'Austin',        lat: 30.267, lng: -97.743, pop: 1_000_000 },
  { name: 'Fort Worth',    lat: 32.755, lng: -97.330, pop:   918_915 },
  { name: 'El Paso',       lat: 31.761, lng: -106.485, pop:  678_815 },
  { name: 'Arlington',     lat: 32.736, lng: -97.108, pop:   394_266 },
  { name: 'Corpus Christi',lat: 27.801, lng: -97.397, pop:   317_773 },
  { name: 'Plano',         lat: 33.020, lng: -96.699, pop:   288_061 },
  { name: 'Lubbock',       lat: 33.578, lng: -101.855, pop:  258_862 },
  { name: 'Laredo',        lat: 27.506, lng: -99.507, pop:   255_205 },
  { name: 'Irving',        lat: 32.814, lng: -96.948, pop:   239_798 },
  { name: 'Amarillo',      lat: 35.222, lng: -101.831, pop:  200_393 },
  { name: 'Garland',       lat: 32.913, lng: -96.638, pop:   246_018 },
  { name: 'Waco',          lat: 31.549, lng: -97.147, pop:   139_594 },
  { name: 'Abilene',       lat: 32.449, lng: -99.733, pop:   117_063 },
  { name: 'Midland',       lat: 31.997, lng: -102.078, pop:  132_524 },
  { name: 'Odessa',        lat: 31.845, lng: -102.368, pop:  114_428 },
  { name: 'Beaumont',      lat: 30.080, lng: -94.126, pop:   113_000 },
  { name: 'McAllen',       lat: 26.203, lng: -98.230, pop:   142_210 },
];

// Renewable zones (bounding boxes from our GeoJSON layers)
const SOLAR_ZONES = [
  { name: 'Trans-Pecos Solar',    minLat: 29.5, maxLat: 31.5, minLng: -105.0, maxLng: -102.0, irradiance: 6.2 },
  { name: 'South Texas Solar',    minLat: 26.5, maxLat: 28.5, minLng: -100.0, maxLng: -97.0,  irradiance: 5.8 },
];
const WIND_ZONES = [
  { name: 'West TX Panhandle',    minLat: 33.5, maxLat: 35.5, minLng: -103.0, maxLng: -100.0, capacity_gw: 45 },
  { name: 'Permian Basin Wind',   minLat: 31.0, maxLat: 33.0, minLng: -103.5, maxLng: -100.5, capacity_gw: 28 },
];

// Service radius: how far from a route node a city is considered "served"
const SERVICE_RADIUS_KM = 150;

// Fraction of a city's population that benefits from new transmission capacity
const SERVICE_FRACTION = 0.18;

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function nodeInBox(node: GraphNode, box: { minLat: number; maxLat: number; minLng: number; maxLng: number }): boolean {
  return node.lat >= box.minLat && node.lat <= box.maxLat &&
         node.lng >= box.minLng && node.lng <= box.maxLng;
}

export interface ImpactScores {
  populationServed: number;
  jobsCreated: number;
  emissionsReduced_tCO2: number;
  healthImpactScore: number;
}

/**
 * Calculates impact scores from actual route node positions.
 *
 * Population: sum of TX city populations within SERVICE_RADIUS_KM of any node × SERVICE_FRACTION
 * Emissions:  based on renewable capacity (GW) in solar/wind zones the route passes through
 * Jobs:       construction (miles × 28) + renewable enablement bonus
 * Health:     composite of population and emissions, penalised by avg friction
 */
export function calculateImpactScores(
  nodes: GraphNode[],
  distanceMiles: number,
  avgFriction: number,
): ImpactScores {
  // ── Population ──────────────────────────────────────────────────────────────
  const servedCities = new Set<string>();
  for (const node of nodes) {
    for (const city of TX_CITIES) {
      if (!servedCities.has(city.name)) {
        const dist = haversineKm(node.lat, node.lng, city.lat, city.lng);
        if (dist <= SERVICE_RADIUS_KM) servedCities.add(city.name);
      }
    }
  }
  const populationServed = Math.round(
    [...servedCities].reduce((sum, name) => {
      const city = TX_CITIES.find(c => c.name === name)!;
      return sum + city.pop * SERVICE_FRACTION;
    }, 0)
  );

  // ── Renewable potential along route ─────────────────────────────────────────
  let solarIrradianceSum = 0;
  let windCapacityGW = 0;
  const touchedWindZones = new Set<string>();
  const touchedSolarZones = new Set<string>();

  for (const node of nodes) {
    for (const z of SOLAR_ZONES) {
      if (!touchedSolarZones.has(z.name) && nodeInBox(node, z)) {
        touchedSolarZones.add(z.name);
        solarIrradianceSum += z.irradiance;
      }
    }
    for (const z of WIND_ZONES) {
      if (!touchedWindZones.has(z.name) && nodeInBox(node, z)) {
        touchedWindZones.add(z.name);
        windCapacityGW += z.capacity_gw;
      }
    }
  }

  // Each GW of enabled renewable displaces ~3.5M tCO2/year over a 30-year line life
  // Solar irradiance boost: higher irradiance → more generation per installed MW
  const renewableGW = windCapacityGW + (solarIrradianceSum / 6.2) * 8;
  const emissionsReduced_tCO2 = Math.round(
    distanceMiles * 6_500 +           // baseline: line length enables regional dispatch
    renewableGW * 1_200_000           // renewable zone bonus
  );

  // ── Jobs ────────────────────────────────────────────────────────────────────
  const constructionJobs = Math.round(distanceMiles * 28);
  const renewableEnablementJobs = Math.round(renewableGW * 420);
  const jobsCreated = constructionJobs + renewableEnablementJobs;

  // ── Health impact (0–100) ───────────────────────────────────────────────────
  // Weighted composite: population reach (40%) + emissions (40%) + low friction (20%)
  const popScore    = Math.min(populationServed / 500_000, 1) * 40;
  const emisScore   = Math.min(emissionsReduced_tCO2 / 20_000_000, 1) * 40;
  const frictionScore = (1 - avgFriction) * 20;
  const healthImpactScore = Math.round(popScore + emisScore + frictionScore);

  return { populationServed, jobsCreated, emissionsReduced_tCO2, healthImpactScore };
}
