/**
 * generate-mock-data.ts — Generate synthetic pipeline artifacts for testing
 * Creates regulations-embedded.json and friction_cache.json without API keys.
 * Used when API keys are not available during development/testing.
 *
 * Run from repo root: npx tsx server/src/pipeline/generate-mock-data.ts
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import path from 'path';
import type { GraphNode, FrictionEntry, RegChunk } from '../types.js';

const ROOT = path.resolve('./');

// ---- Synthetic embedding generator ----------------------------------------
function generateEmbedding(seed: string, dim = 1536): number[] {
  // Deterministic pseudo-random embedding based on string seed
  const embedding: number[] = [];
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(i);
    hash |= 0;
  }
  let state = hash;
  for (let i = 0; i < dim; i++) {
    state = (state * 1664525 + 1013904223) | 0;
    embedding.push((state / 2147483648) * 0.1);
  }
  // Normalize to unit vector
  const norm = Math.sqrt(embedding.reduce((s, v) => s + v * v, 0));
  return embedding.map(v => v / norm);
}

// ---- Regulation text blobs ------------------------------------------------
const REGULATION_DATA: Array<{ statute: string; texts: string[] }> = [
  {
    statute: 'PUCT',
    texts: [
      'Public Utility Commission of Texas (PUCT) — 16 Texas Administrative Code Chapter 25. Section 25.101 — Certification of Competitive Retailers. Transmission projects in Texas require a Certificate of Convenience and Necessity (CCN) from PUCT. High-voltage transmission lines (>= 60 kV) require formal CCN application review.',
      'PUCT Section 25.192 — Transmission Line Routing Standards for ERCOT. PUCT evaluates routing alternatives based on cost, reliability, environmental impact, and land use. Texas utility corridors designated under Texas Utilities Code Chapter 37 receive expedited review.',
      'Section 25.193 — Rights-of-Way and Easement Requirements. Transmission line rights-of-way (ROW) must be secured prior to CCN approval. ROW widths for 345 kV lines: typically 150–200 feet. Expected PUCT review timeline: 9–18 months from application to final order.',
      'ERCOT transmission planning guidelines require coordination for projects affecting the 345 kV backbone. Permian Basin routing in Reeves, Loving, Ward counties subject to oil and gas infrastructure coordination requirements per 16 TAC §25.192(f).',
      'Eminent domain authority granted under Texas Property Code Chapter 21 for certified utilities. CCN applications must include environmental resource report, route alternatives analysis, and stakeholder engagement plan covering all affected Texas counties.',
    ],
  },
  {
    statute: 'NEPA',
    texts: [
      'National Environmental Policy Act (NEPA) — 42 U.S.C. §§ 4321–4347. 40 CFR Part 1500–1508 — Council on Environmental Quality (CEQ) Regulations. Section 102(2)(C) requires Environmental Impact Statements (EIS) for major federal actions. Categorical Exclusions available for routine transmission projects.',
      'Environmental Assessments (EA) determine significance under 40 CFR §1501.6; if Finding of No Significant Impact (FONSI) issued, EIS not required. Texas transmission projects crossing federal land trigger NEPA review. Expected timeline: EA 6–12 months; EIS 18–36 months from initiation.',
      'Edwards Aquifer recharge zones in Sutton, Real, and Uvalde counties require detailed groundwater impact analysis under NEPA. Cumulative impact assessment required under 40 CFR §1508.27 for actions in sensitive areas of West Texas.',
      'Section 7 consultation with USFWS required when federal nexus exists and ESA-listed species may be present in Texas. Big Bend National Park buffer zone in Brewster County: projects within 10 miles require NPS coordination per 36 CFR Part 60.',
      'Sam Houston National Forest in Walker, San Jacinto, and Montgomery counties: USFS coordination required. 40 CFR §1502.14 requires rigorous alternatives analysis; typically 3–5 routing alternatives must be evaluated in an EIS for Texas transmission projects.',
    ],
  },
  {
    statute: 'ESA',
    texts: [
      'Endangered Species Act (ESA) — 16 U.S.C. §§ 1531–1544. Section 7(a)(2) requires federal agencies to consult with USFWS to ensure actions do not jeopardize listed species or destroy critical habitat. Informal consultation typically 135 days; formal consultation up to 135 days.',
      'Texas critical habitats: Houston toad (Anaxyrus houstonensis) in Bastrop County, Golden-cheeked warbler (Setophaga chrysoparia) in Hill Country counties (Kerr, Kendall, Bandera, Real). Section 10 Incidental Take Permits with Habitat Conservation Plans for non-federal projects.',
      'Reeves County and Trans-Pecos region host ESA-listed species including Pecos gambusia and several bat species; Section 7 consultation mandatory. Dunes sagebrush lizard (Sceloporus arenicolus) in Permian Basin: Lea, Eddy, Andrews counties.',
      'Whooping crane (Grus americana) critical habitat along Gulf Coast: Aransas County and Matagorda Island; seasonal restrictions on construction activities October–April per ESA Section 7 formal consultation requirements.',
      'Biological Assessment must be completed before formal consultation; typically requires 6–12 months of field surveys in Texas. Critical habitat designations under 50 CFR Part 17 restrict transmission routing options in designated areas including Trans-Pecos bat corridors.',
    ],
  },
  {
    statute: 'CWA',
    texts: [
      'Clean Water Act (CWA) — 33 U.S.C. §§ 1251–1387. Section 404(a) authorizes U.S. Army Corps of Engineers Fort Worth District to issue permits for discharge of fill material into waters of the U.S. Nationwide Permits available for activities with minimal adverse effects.',
      'NWP 57 specifically covers electric utility line activities, including transmission tower foundations in wetlands; acreage limits apply. Texas wetlands: coastal marshes (Jefferson, Chambers, Galveston counties), bottomland hardwoods in East Texas, playa lakes in Panhandle.',
      'Section 401 Water Quality Certification required from Texas Commission on Environmental Quality (TCEQ) for all federal permits. Edwards Aquifer and its recharge zone near San Antonio subject to additional state water quality protections under Texas Water Code Chapter 26.',
      'Major river crossings requiring individual USACE permits: Trinity River (Dallas/Tarrant counties), Brazos River (Young to Fort Bend County), Colorado River (Runnels to Matagorda County), Guadalupe River (Comal, Guadalupe, Victoria counties).',
      'Compensatory mitigation required for unavoidable wetland impacts: restoration, establishment, enhancement in-kind within same watershed. Review timeline: 60 days for NWP verification, 6–18 months for individual permit in Texas.',
    ],
  },
  {
    statute: 'NHPA',
    texts: [
      'National Historic Preservation Act (NHPA) — 54 U.S.C. §§ 300101–320303. Section 106 requires federal agencies to consider effects on historic properties listed in the National Register of Historic Places (NRHP). Advisory Council on Historic Preservation oversees compliance under 36 CFR Part 800.',
      'Area of Potential Effect must be defined including direct, indirect, and visual effects. Texas SHPO consultation required for all projects with federal nexus. Programmatic Agreements can streamline review for large-scale transmission projects in Texas.',
      'Tribal consultation required for properties of religious or cultural significance to Comanche Nation, Alabama-Coushatta Tribe of Texas, Kickapoo Traditional Tribe. El Camino Real de los Tejas National Historic Trail: NHPA Section 106 review required for crossings.',
      'San Antonio Missions World Heritage Site buffer zone: UNESCO buffer extends several miles; NHPA review essential for projects in Bexar County. Expected timeline: 30-day comment periods; complex consultations 6–12 months in Texas.',
      'Big Bend Ranch State Park and Fort Davis National Historic Site: Section 106 required for projects in adjacent areas in Presidio County. Visual impact assessment required for undertakings near historic districts per 36 CFR Part 800.',
    ],
  },
  {
    statute: 'HABITAT',
    texts: [
      'Texas Parks and Wildlife Department (TPWD) — Habitat Conservation. Texas Ecological Systems Classification identifies 90+ habitat types. Edwards Plateau: juniper-oak savanna; Golden-cheeked warbler and black-capped vireo habitat in Kerr, Real, Bandera, Llano counties.',
      'Trans-Pecos Ecoregion: Chihuahuan Desert; Mexican long-nosed bat habitat in Val Verde, Kinney counties; pronghorn corridors in Jeff Davis, Presidio counties. TPWD Wildlife Management Areas in Reeves, Brewster, Presidio counties require special permits.',
      'South Texas Plains: ocelot (Leopardus pardalis) habitat in Zapata, Starr, Hidalgo counties; jaguarundi in Webb County. Coastal Prairies: whooping crane habitat in Aransas County; colonial waterbird rookeries along Gulf Coast.',
      'Nolan County (Rolling Plains ecoregion): active wind energy development creates cumulative impact concerns with transmission corridors. Texas Ecological Mapping System data required for environmental review on PUCT CCN applications.',
      'Monarch butterfly migration corridor across Central Texas (I-35 corridor): transmission construction during September–November should minimize milkweed habitat impacts. Desert grassland corridors in West Texas critical for pronghorn under TPWD Pronghorn Conservation Plan.',
    ],
  },
];

// ---- Friction scoring data ------------------------------------------------
// Pre-computed justifications referencing real Texas locations and statutes
const FRICTION_JUSTIFICATIONS: Array<{ frictionScore: number; justification: string; pattern: string }> = [
  // Very high friction
  {
    frictionScore: 0.92,
    justification: 'Per ESA Section 7(a)(2) and PUCT 16 TAC §25.192(f), this node overlaps critical Golden-cheeked warbler habitat in the Edwards Plateau Hill Country. Formal USFWS Section 7 consultation required, adding 8–14 months. Additionally, NEPA 40 CFR §1502.14 mandates full EIS with alternatives analysis due to proximity to Kerr County habitat conservation area.',
    pattern: 'esa+puct',
  },
  {
    frictionScore: 0.88,
    justification: 'Under PUCT 16 TAC §25.191 and CWA Section 404, this node in Bastrop County intersects Houston toad (Anaxyrus houstonensis) critical habitat and bottomland hardwood wetlands. ESA Section 10 Incidental Take Permit with full HCP required; USACE individual Section 404 permit adds 12–18 months to routing approval timeline.',
    pattern: 'esa+cwa',
  },
  {
    frictionScore: 0.85,
    justification: 'Per NEPA 40 CFR §1508.27 cumulative impact assessment requirements, this node in Aransas County falls within whooping crane (Grus americana) critical habitat buffer. ESA Section 7 formal consultation mandatory; seasonal construction restrictions October–April under USFWS Biological Opinion. NHPA Section 106 review also required for Gulf Coast cultural resources.',
    pattern: 'nepa+esa',
  },
  // High friction
  {
    frictionScore: 0.78,
    justification: 'This node in Reeves County, Trans-Pecos region, triggers ESA Section 7(a)(2) consultation for Pecos gambusia and trans-Pecos spotted bat species. PUCT CCN review under 16 TAC §25.192 requires Permian Basin oil and gas infrastructure coordination. CWA Section 404 individual permit required for Pecos River crossing. Estimated review timeline: 18–24 months.',
    pattern: 'trans-pecos',
  },
  {
    frictionScore: 0.74,
    justification: 'Per NHPA 36 CFR Part 800 and NEPA 40 CFR §1501.7, this node within 10 miles of Big Bend National Park (Brewster County) requires NPS coordination and full Section 106 review with Texas SHPO. Cultural resource survey of 1,500+ acres required. TPWD black-tailed prairie dog habitat survey additionally mandated under Texas Parks and Wildlife Code §68.004.',
    pattern: 'nhpa+nepa',
  },
  {
    frictionScore: 0.71,
    justification: 'PUCT 16 TAC §25.192 routing standards and TPWD habitat requirements identify this Edwards Aquifer recharge zone node in Hays County as high friction. Texas Water Code §26.131 groundwater protection requirements apply. NEPA EA required under 40 CFR §1501.6; Texas blind salamander (Eurycea rathbuni) ESA critical habitat designation applies per 50 CFR Part 17.',
    pattern: 'edwards-aquifer',
  },
  // Moderate-high friction
  {
    frictionScore: 0.65,
    justification: 'Per CWA Section 404 and PUCT 16 TAC §25.193, this node in Tyler County (East Texas Pineywoods) requires USACE individual permit for bottomland hardwood wetland impacts. Red-cockaded woodpecker (Dryobates borealis) habitat survey required under ESA Section 7. USFS coordination mandatory per 36 CFR Part 219 for proximity to Sabine National Forest.',
    pattern: 'east-texas',
  },
  {
    frictionScore: 0.62,
    justification: 'Under NEPA 40 CFR §1502.14 and CWA Section 401 TCEQ certification requirements, this node in Comal County intersects Guadalupe River corridor. San Antonio Missions World Heritage Site UNESCO buffer triggers NHPA Section 106 review. Edwards Aquifer contributing zone protection applies under Texas Water Code. Estimated 14–18 month review timeline.',
    pattern: 'san-antonio',
  },
  {
    frictionScore: 0.58,
    justification: 'This node in Webb County (South Texas Plains) involves ocelot (Leopardus pardalis) habitat requiring ESA Section 7 informal consultation per USFWS guidelines. PUCT CCN application must address international border proximity under 16 TAC §25.191. CWA Section 404 Nationwide Permit 57 applicable; TCEQ Section 401 certification required. Review timeline approximately 12–15 months.',
    pattern: 'south-texas',
  },
  // Moderate friction
  {
    frictionScore: 0.52,
    justification: 'Per PUCT 16 TAC §25.192 routing standards, this node in Nolan County (Rolling Plains) has moderate friction due to existing wind energy infrastructure cumulative impacts. NEPA 40 CFR §1508.27 cumulative assessment required. TPWD habitat assessment for lesser prairie-chicken under ESA Section 7 informal consultation adds 3–4 months to approval timeline.',
    pattern: 'rolling-plains-wind',
  },
  {
    frictionScore: 0.48,
    justification: 'PUCT 16 TAC §25.191 technical requirements apply for this node in Young County near Brazos River crossing. CWA Section 404 Nationwide Permit 57 verification required from USACE Fort Worth District (60-day review). TCEQ Section 401 certification needed. Moderate private land acquisition complexity under Texas Property Code Chapter 21 eminent domain provisions.',
    pattern: 'brazos-crossing',
  },
  {
    frictionScore: 0.44,
    justification: 'Standard PUCT CCN review under 16 TAC §25.192 applies for this node in Taylor County. NEPA Categorical Exclusion potentially available given minimal sensitive resources. NHPA Section 106 desktop review sufficient per Texas SHPO programmatic agreement. CWA Nationwide Permit 57 applicable with standard TCEQ Section 401 certification. Estimated 9–12 month approval.',
    pattern: 'central-plains',
  },
  // Moderate-low friction
  {
    frictionScore: 0.38,
    justification: 'Per PUCT 16 TAC §25.192 and NEPA guidance, this node in Hardeman County has limited regulatory constraints. NEPA Categorical Exclusion likely available; no ESA-listed species critical habitat within 5 miles per USFWS IPaC review. CWA Nationwide Permit 57 applicable with streamlined TCEQ review. Standard NHPA desktop survey sufficient. Timeline: 6–9 months for PUCT CCN.',
    pattern: 'low-constraint',
  },
  {
    frictionScore: 0.32,
    justification: 'This node in Childress County (Rolling Plains) shows favorable routing characteristics per PUCT 16 TAC §25.192 standards. Near existing ERCOT 345 kV corridor enabling expedited co-location review under Texas Utilities Code §37.052. No ESA-listed species within buffer per 50 CFR Part 17. CWA NWP 57 applicable. Standard 6-month PUCT CCN expected.',
    pattern: 'ercot-adjacent',
  },
  {
    frictionScore: 0.28,
    justification: 'Favorable transmission corridor node in Lubbock County per PUCT 16 TAC §25.191 assessment. Playa lake CWA Section 404 NWP 57 verification required from USACE but anticipated without mitigation. NEPA CE available. No ESA critical habitat designation. TPWD habitat assessment limited to standard review. Estimated 6–8 month approval timeline.',
    pattern: 'panhandle',
  },
  // Low friction
  {
    frictionScore: 0.22,
    justification: 'Per PUCT 16 TAC §25.192 routing analysis, this node in Parmer County (Panhandle) has minimal regulatory friction. Existing agricultural land with no ESA critical habitat. CWA NWP 57 straightforward; TCEQ Section 401 anticipated. NEPA CE applicable per 40 CFR Part 1508. Standard NHPA desktop review. PUCT CCN likely within 6–7 months.',
    pattern: 'ag-land',
  },
  {
    frictionScore: 0.18,
    justification: 'Minimal friction node in Dawson County. PUCT CCN under 16 TAC §25.191 expected within standard 6-month timeline. No ESA-listed species within 3-mile buffer per USFWS IPaC. CWA NWP 57 applicable with routine TCEQ certification. No NHPA properties within APE per Texas SHPO database. Open rangeland routing minimizes land acquisition complexity.',
    pattern: 'open-range',
  },
  {
    frictionScore: 0.12,
    justification: 'Very low friction node in Lynn County (South Plains). PUCT 16 TAC §25.192 routing corridors favor this location adjacent to existing transmission infrastructure. No ESA, CWA, or NHPA constraints identified in preliminary screening. NEPA CE applicable. ERCOT co-location within existing ROW possible under Texas Utilities Code §37.052. Estimated approval: 4–6 months.',
    pattern: 'low-friction',
  },
  {
    frictionScore: 0.08,
    justification: 'Optimal transmission corridor node in Yoakum County. Near existing 345 kV ERCOT backbone per ERCOT transmission planning guidelines; potential co-location under Texas Utilities Code Chapter 37 expedited review. No ESA critical habitat, CWA jurisdictional waters, or NHPA properties within APE. PUCT CCN anticipated in 4–5 months under 16 TAC §25.192 streamlined review.',
    pattern: 'optimal',
  },
];

// ---- Generate friction cache -----------------------------------------------
function generateFrictionCache(nodes: GraphNode[]): Record<string, FrictionEntry> {
  const cache: Record<string, FrictionEntry> = {};
  const justCount = FRICTION_JUSTIFICATIONS.length;

  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    // Distribute friction scores across nodes using a deterministic but varied pattern
    // Use a combination of position and hash to create geographic variation
    const hashBase = i % justCount;
    const variation = (i * 7 + Math.floor(node.lat * 10) + Math.floor(Math.abs(node.lng) * 10)) % justCount;
    const jIdx = (hashBase + variation) % justCount;
    const template = FRICTION_JUSTIFICATIONS[jIdx];

    // Add small deterministic variation to the score
    const scoreVariation = ((i * 13 + 7) % 100) / 1000; // 0-0.099 variation
    const frictionScore = Math.max(0.05, Math.min(0.95, template.frictionScore + scoreVariation - 0.05));

    cache[node.id] = {
      frictionScore: parseFloat(frictionScore.toFixed(3)),
      justification: template.justification,
    };
  }

  return cache;
}

// ---- Main -----------------------------------------------------------------
async function main() {
  console.log('Generating mock pipeline data for testing...');

  // Load graph.json
  const graphPath = path.join(ROOT, 'public/data/graph.json');
  if (!existsSync(graphPath)) {
    throw new Error(`graph.json not found at ${graphPath}. Run 2-build-graph.ts first.`);
  }
  const nodes: GraphNode[] = JSON.parse(readFileSync(graphPath, 'utf-8'));
  console.log(`Loaded ${nodes.length} nodes`);

  // Generate regulations-embedded.json
  console.log('Generating regulations-embedded.json with synthetic embeddings...');
  const chunks: RegChunk[] = [];
  for (const { statute, texts } of REGULATION_DATA) {
    for (const text of texts) {
      chunks.push({
        text,
        embedding: generateEmbedding(`${statute}:${text.slice(0, 50)}`, 1536),
        statute,
      });
    }
  }

  const ragPath = path.join(ROOT, 'server/data/regulations-embedded.json');
  mkdirSync(path.dirname(ragPath), { recursive: true });
  writeFileSync(ragPath, JSON.stringify(chunks, null, 2));
  const statutes = [...new Set(chunks.map(c => c.statute))];
  console.log(`regulations-embedded.json written: ${chunks.length} chunks (${statutes.join(', ')})`);

  // Generate friction_cache.json
  console.log('Generating friction_cache.json...');
  const frictionCache = generateFrictionCache(nodes);

  const frictionPath = path.join(ROOT, 'public/data/friction_cache.json');
  mkdirSync(path.dirname(frictionPath), { recursive: true });
  writeFileSync(frictionPath, JSON.stringify(frictionCache, null, 2));
  console.log(`friction_cache.json written: ${Object.keys(frictionCache).length} entries`);

  // Verify no lat/lng in entries
  const hasCoords = Object.values(frictionCache).some(e => 'lat' in e || 'lng' in e);
  console.log(`Coordinate check: ${hasCoords ? 'FAIL — has lat/lng!' : 'PASS — no coordinates'}`);

  // Show score distribution
  const scores = Object.values(frictionCache).map(e => e.frictionScore);
  const min = Math.min(...scores);
  const max = Math.max(...scores);
  const avg = scores.reduce((s, v) => s + v, 0) / scores.length;
  console.log(`Score distribution: min=${min.toFixed(3)}, max=${max.toFixed(3)}, avg=${avg.toFixed(3)}`);

  console.log('Mock data generation complete!');
}

main().catch(err => {
  console.error('Mock data generation failed:', err.message);
  process.exit(1);
});
