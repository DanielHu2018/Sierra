/**
 * 1-scrape-embed.ts — Regulation scrape + embed pipeline script
 * Fetches regulation text from public .gov URLs (with fallback),
 * chunks into paragraph segments, embeds via OpenAI text-embedding-3-small,
 * and writes server/data/regulations-embedded.json.
 *
 * Run from repo root: OPENAI_API_KEY=<key> npx tsx server/src/pipeline/1-scrape-embed.ts
 */
import fs from 'fs';
import path from 'path';
import OpenAI from 'openai';
import type { RegChunk } from '../types.js';

// ---- Env validation -------------------------------------------------------
if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY env var is required. Set it before running this script.');
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ---- Pre-seeded regulation text fallbacks ---------------------------------
const REGULATION_FALLBACKS: Record<string, string> = {
  PUCT: `
Public Utility Commission of Texas (PUCT) — 16 Texas Administrative Code Chapter 25
Section 25.101 — Certification of Competitive Retailers
Section 25.191 — Technical Requirements for Transmission Service
Section 25.192 — Transmission Line Routing Standards for ERCOT

Transmission projects in Texas require a Certificate of Convenience and Necessity (CCN) from PUCT.
High-voltage transmission lines (>= 60 kV) require formal CCN application review.
PUCT evaluates routing alternatives based on: cost, reliability, environmental impact, and land use.
Texas utility corridors designated under Texas Utilities Code Chapter 37 receive expedited review.
Eminent domain authority granted under Texas Property Code Chapter 21 for certified utilities.
CCN applications must include environmental resource report, route alternatives analysis, and stakeholder engagement plan.
Expected PUCT review timeline: 9–18 months from application to final order.
ERCOT transmission planning guidelines require coordination for projects affecting the 345 kV backbone.

Section 25.193 — Rights-of-Way and Easement Requirements
Transmission line rights-of-way (ROW) in Texas must be secured prior to CCN approval.
ROW widths for 345 kV lines: typically 150–200 feet; for 500 kV: 200–250 feet.
Private landowner negotiations required under Texas Property Code Chapter 21 before eminent domain exercise.
Agricultural land crossings in the Panhandle (Moore, Deaf Smith counties) require additional crop damage compensation.
Urban area routing through Dallas-Fort Worth Metroplex or Houston metro areas requires additional environmental impact analysis and local government consultation.
PUCT Section 25.192(f) mandates that routing alternatives minimize impacts to prime farmland and environmentally sensitive areas.
Permian Basin routing in Reeves, Loving, Ward counties subject to oil and gas infrastructure coordination requirements.
  `,
  NEPA: `
National Environmental Policy Act (NEPA) — 42 U.S.C. §§ 4321–4347
40 CFR Part 1500–1508 — Council on Environmental Quality (CEQ) Regulations

Section 102(2)(C) requires Environmental Impact Statements (EIS) for major federal actions significantly affecting the quality of the human environment.
Categorical Exclusions (CE) available for routine transmission projects with no significant impacts.
Environmental Assessments (EA) determine significance; if Finding of No Significant Impact (FONSI) issued, EIS not required.
Scoping process under 40 CFR §1501.7 identifies issues and alternatives for analysis.
Texas transmission projects crossing federal land (National Forest, BLM, military installations) trigger NEPA review.
Edwards Aquifer recharge zones in Sutton, Real, and Uvalde counties require detailed groundwater impact analysis.
Cumulative impact assessment required under 40 CFR §1508.27 for actions in sensitive areas.
Section 7 consultation with USFWS required when federal nexus exists and ESA-listed species may be present.
Expected NEPA timeline: EA 6–12 months; EIS 18–36 months from initiation to Record of Decision.

Big Bend National Park buffer zone in Brewster County: projects within 10 miles require NPS coordination per 36 CFR Part 60.
Padre Island National Seashore in Kleberg/Kenedy counties: coastal zone management compliance required under CZMA Section 307.
Sam Houston National Forest in Walker, San Jacinto, and Montgomery counties: USFS coordination required for any federal nexus projects.
40 CFR §1502.14 requires rigorous alternatives analysis; typically 3–5 routing alternatives must be evaluated in an EIS.
Public scoping period under 40 CFR §1501.6: minimum 45-day comment period; typical scoping meetings held in affected Texas counties.
  `,
  ESA: `
Endangered Species Act (ESA) — 16 U.S.C. §§ 1531–1544
Section 7 Consultation — Interagency Cooperation

Section 7(a)(2) requires federal agencies to consult with U.S. Fish and Wildlife Service (USFWS) to ensure actions do not jeopardize listed species or destroy critical habitat.
Informal consultation typically resolves within 135 days; formal consultation up to 135 days from initiation plus biological opinion preparation.
Texas critical habitats include: Houston toad (Anaxyrus houstonensis) in Bastrop County, Golden-cheeked warbler (Setophaga chrysoparia) in Hill Country counties (Kerr, Kendall, Bandera, Real counties).
Reeves County and Trans-Pecos region host ESA-listed species including the Pecos gambusia and several bat species; Section 7 consultation mandatory for federal nexus projects crossing this area.
Section 10 Incidental Take Permits (ITP) with Habitat Conservation Plans (HCP) for non-federal projects affecting listed species.
Biological Assessment (BA) must be completed before formal consultation begins; BA typically requires 6–12 months of field surveys.
Critical habitat designations under 50 CFR Part 17 restrict transmission routing options in designated areas.
Mitigation hierarchy: avoid, minimize, compensate for impacts to listed species and critical habitat.

Dunes sagebrush lizard (Sceloporus arenicolus) in Permian Basin: Lea, Eddy, Andrews counties in New Mexico/Texas border region.
Black-capped vireo (Vireo atricapilla) in Edwards Plateau and Hill Country: Williamson, Travis, Llano, Mason, Menard counties.
Whooping crane (Grus americana) critical habitat along Gulf Coast: Aransas County and Matagorda Island; seasonal restrictions on construction activities October–April.
Texas blind salamander (Eurycea rathbuni) in Edwards Aquifer: Hays County; any dewatering activities near recharge zone require Section 7 consultation.
Interior least tern (Sternula antillarum) nesting on sandbars of Rio Grande, Pecos River, and other Texas rivers: seasonal construction restrictions May–August.
  `,
  CWA: `
Clean Water Act (CWA) — 33 U.S.C. §§ 1251–1387
Section 404 — Permits for Dredged or Fill Material

Section 404(a) authorizes U.S. Army Corps of Engineers (USACE) Fort Worth District to issue permits for discharge of fill material into waters of the U.S. in Texas.
Nationwide Permits (NWP) available for activities with minimal individual and cumulative adverse effects.
NWP 57 specifically covers electric utility line activities, including transmission tower foundations in wetlands; acreage limits apply.
Texas wetlands include: coastal marshes along Gulf Coast (Jefferson, Chambers, Galveston counties), bottomland hardwoods in East Texas (Tyler, Nacogdoches, Sabine counties), playa lakes in Panhandle (Lubbock, Bailey, Lamb counties).
Impacts to jurisdictional wetlands require Section 404 permit; review timeline: 60 days for NWP verification, 6–18 months for individual permit.
Compensatory mitigation required for unavoidable wetland impacts: restoration, establishment, enhancement, or preservation in-kind within same watershed.
Section 401 Water Quality Certification required from Texas Commission on Environmental Quality (TCEQ) for all federal permits affecting Texas waters.
Edwards Aquifer and its recharge zone near San Antonio (Bexar, Comal, Hays counties) subject to additional state water quality protections under Texas Water Code Chapter 26.

Rivers and streams requiring individual USACE permits for major transmission crossings in Texas:
- Trinity River: major crossings in Dallas/Tarrant counties
- Brazos River: major crossings from Young County to Fort Bend County
- Colorado River: major crossings from Runnels County to Matagorda County
- Guadalupe River: crossings in Comal, Guadalupe, Victoria counties
- Neches River: East Texas crossings in Angelina, Jasper counties
- Sabine River: East Texas/Louisiana border crossings
Pecos River crossings in Reeves, Ward counties require individual permits due to sensitive aquifer recharge zones.
  `,
  NHPA: `
National Historic Preservation Act (NHPA) — 54 U.S.C. §§ 300101–320303
Section 106 Review — Effects on Historic Properties

Section 106 requires federal agencies to consider effects on historic properties listed in or eligible for the National Register of Historic Places (NRHP).
Advisory Council on Historic Preservation (ACHP) oversees Section 106 compliance under 36 CFR Part 800.
Area of Potential Effect (APE) must be defined; includes direct, indirect, and visual effects of undertaking.
Texas has numerous NRHP-listed properties along potential transmission corridors, including historic ranch headquarters, battlefields, and archaeological sites.
Section 106 consultation with Texas State Historic Preservation Office (SHPO) required for all projects with federal nexus.
Programmatic Agreements (PA) can streamline review for large-scale transmission projects affecting multiple Texas counties.
Tribal consultation required if undertaking may affect properties of religious or cultural significance to federally recognized tribes, including Comanche Nation, Alabama-Coushatta Tribe of Texas, Kickapoo Traditional Tribe of Texas.
Expected timeline: 30-day comment periods for each consultation step; complex consultations may extend 6–12 months.
Visual impact assessment required for undertakings near historic districts (e.g., San Antonio Missions National Historical Park, Fredericksburg Historic District) or cultural landscapes.

El Camino Real de los Tejas National Historic Trail: crosses East and Central Texas; NHPA Section 106 review required for any projects crossing the trail corridor.
Big Bend Ranch State Park and Fort Davis National Historic Site: Section 106 required for projects in adjacent areas in Presidio County.
San Antonio Missions World Heritage Site buffer zone: UNESCO buffer extends several miles; NHPA review essential for projects in Bexar County near mission corridor.
Archaeological sensitivity in West Texas: Hueco Tanks State Historic Site area in El Paso County; permits required for ground disturbance within 1-mile buffer.
  `,
  HABITAT: `
Texas Parks and Wildlife Department (TPWD) — Habitat Conservation and Wildlife Management
Texas Ecological Systems Classification

Texas Ecological Systems Classification identifies 90+ unique habitat types statewide; transmission routing must demonstrate habitat impact minimization.
Priority habitats for transmission routing avoidance include:

Pineywoods Ecoregion (East Texas): longleaf pine ecosystem in Tyler, Nacogdoches, Jasper counties; Southern Flying Squirrel and Red-cockaded Woodpecker habitat.
Edwards Plateau Ecoregion: juniper-oak savanna; habitat for golden-cheeked warbler and black-capped vireo in Kerr, Real, Bandera, Llano counties.
Trans-Pecos Ecoregion: Chihuahuan Desert; habitat for listed bat species (Mexican long-nosed bat in Val Verde, Kinney counties) and pronghorn migration corridors in Jeff Davis, Presidio counties.
South Texas Plains Ecoregion: thornbrush; habitat for ocelot (Leopardus pardalis) in Zapata, Starr, Hidalgo counties; jaguarundi in Webb County.
Coastal Prairies Ecoregion: migratory bird staging areas; whooping crane habitat in Aransas County; colonial waterbird rookeries along Gulf Coast.
Rolling Plains Ecoregion (Nolan, Taylor, Jones counties): active wind energy development creates cumulative impact concerns with transmission corridors.

TPWD Wildlife Management Areas requiring special permits for construction access:
- Black Gap WMA in Brewster County: critical pronghorn and desert bighorn sheep habitat
- Chaparral WMA in Dimmit County: brush management for white-tailed deer
- Matador WMA in Cottle County: Rolling Plains habitat management

Texas Ecological Mapping System of Texas (EMST) data required for environmental review documentation on all PUCT CCN applications.
Desert grassland corridors in West Texas identified as critical for pronghorn migration under TPWD Pronghorn Conservation Plan; projects in Reeves, Loving, Ward counties require biological survey.
Monarch butterfly (Danaus plexippus) migration corridor across Central Texas (I-35 corridor): transmission construction during September-November should minimize milkweed habitat impacts.
  `,
};

// ---- Regulation sources ---------------------------------------------------
const STATUTE_SOURCES: Record<string, string> = {
  PUCT: 'https://ftp.puc.texas.gov/public/puct-info/agency/rulesnlaws/subrules/electric/ch25complete.pdf',
  NEPA: 'https://ceq.doe.gov/docs/ceq-publications/NEPA_NHPA_Section_106_Handbook_Mar2013.pdf',
  ESA: 'https://www.fws.gov/sites/default/files/documents/endangered-species-act-section7.pdf',
  CWA: 'https://www.epa.gov/cwa-404',
  NHPA: 'https://www.epa.gov/system/files/documents/2023-07/NHPA-Overview.pdf',
  HABITAT: 'https://tpwd.texas.gov/landwater/land/habitats/',
};

// ---- Fetch with fallback ---------------------------------------------------
async function fetchStatuteText(statute: string, url: string): Promise<string> {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Sierra Pipeline Bot)' },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const contentType = res.headers.get('content-type') ?? '';
    if (contentType.includes('text/html')) {
      const html = await res.text();
      const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      if (text.length > 200) {
        console.log(`[${statute}] Fetched HTML text (${text.length} chars)`);
        return text.slice(0, 8000);
      }
    }
    throw new Error('PDF or non-HTML content; using fallback');
  } catch (err) {
    console.warn(`[${statute}] Fetch failed (${(err as Error).message}), using fallback text`);
    return REGULATION_FALLBACKS[statute] ?? '';
  }
}

// ---- Chunking strategy ----------------------------------------------------
function chunkText(text: string, statute: string): Array<{ text: string; statute: string }> {
  const paragraphs = text
    .split(/\n\n+/)
    .map(p => p.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim())
    .filter(p => p.length > 50);

  const chunks: Array<{ text: string; statute: string }> = [];

  for (const para of paragraphs) {
    // If paragraph is very long (> ~2000 chars), split into ~400-char pieces
    if (para.length > 2000) {
      const sentences = para.split(/(?<=[.!?])\s+/);
      let current = '';
      for (const sentence of sentences) {
        if ((current + ' ' + sentence).length > 400 && current.length > 0) {
          if (current.trim().length > 50) {
            chunks.push({ text: current.trim(), statute });
          }
          current = sentence;
        } else {
          current = current ? current + ' ' + sentence : sentence;
        }
      }
      if (current.trim().length > 50) {
        chunks.push({ text: current.trim(), statute });
      }
    } else {
      chunks.push({ text: para, statute });
    }
  }

  // Target 5–10 chunks per statute; if we have too many, keep the most substantive ones
  if (chunks.length > 10) {
    return chunks
      .sort((a, b) => b.text.length - a.text.length)
      .slice(0, 10);
  }

  return chunks;
}

// ---- OpenAI embeddings ----------------------------------------------------
async function embedChunks(texts: string[]): Promise<number[][]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: texts,
    encoding_format: 'float',
  });
  return response.data.map(d => d.embedding);
}

// ---- Main -----------------------------------------------------------------
async function main() {
  console.log('Sierra Pipeline — Step 1: Scraping and embedding regulations...');

  const allChunks: Array<{ text: string; statute: string }> = [];

  for (const [statute, url] of Object.entries(STATUTE_SOURCES)) {
    console.log(`Processing ${statute}...`);
    const text = await fetchStatuteText(statute, url);
    const chunks = chunkText(text, statute);
    console.log(`  ${statute}: ${chunks.length} chunks`);
    allChunks.push(...chunks);
  }

  console.log(`Total chunks to embed: ${allChunks.length}`);

  if (allChunks.length < 6) {
    throw new Error(`Too few chunks (${allChunks.length}) — regulation text fallbacks may be empty.`);
  }

  // Embed all chunks in one OpenAI call (batched)
  console.log('Calling OpenAI embeddings API...');
  const texts = allChunks.map(c => c.text);
  const embeddings = await embedChunks(texts);

  // Build output
  const output: RegChunk[] = allChunks.map((chunk, i) => ({
    text: chunk.text,
    embedding: embeddings[i],
    statute: chunk.statute,
  }));

  // Write to server/data/
  const outPath = path.resolve('./server/data/regulations-embedded.json');
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2));

  const statutes = [...new Set(output.map(c => c.statute))];
  console.log(`regulations-embedded.json written: ${output.length} chunks`);
  console.log(`Statutes covered: ${statutes.join(', ')}`);
  console.log(`Embedding dimensions: ${output[0]?.embedding?.length ?? 'unknown'}`);
}

main().catch(err => {
  console.error('Scrape+embed failed:', err.message);
  process.exit(1);
});
