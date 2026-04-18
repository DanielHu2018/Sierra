// server/src/cannedFallback.ts
// All canned fallback content. References real Texas locations for demo credibility.
// Triggered per-endpoint via try/catch when Claude API is unavailable.

import type { RouteRecommendation, EnvironmentalTrigger, SierraAlert, ProjectSummary } from '../../src/types.js';

// ─── Reasoning Stream (streamed character by character on client) ──────────
// Target: 20-40 seconds of typewriter playback at ~30ms/char
// ~800 characters ≈ 26 seconds at 30ms/char
export const CANNED_REASONING_STREAM = `Initializing Sierra routing engine for Texas ERCOT transmission corridor analysis...

Evaluating constraint layer 1: ESA Critical Habitat. Detected endangered species habitat in Reeves County — Designated Critical Habitat for Dunes Sagebrush Lizard under ESA Section 4. Friction multiplier: 2.1x applied to affected nodes.

Evaluating constraint layer 2: Existing ROW Infrastructure. Found active 345kV transmission right-of-way along US-385 corridor between Pecos and Wink. Co-location opportunity identified — reduces land acquisition cost by approximately 40%. Applying co-location bonus to Route A.

Evaluating constraint layer 3: Water Resource Zones. Edwards Aquifer recharge zone identified in Sutton County — CWA Section 404 permit required for any crossing. NHPA Section 106 consultation triggered by proximity to historic Comanche trail corridor in McCulloch County.

Evaluating constraint layer 4: Landowner Opposition Risk. Nolan County parcel records indicate historical opposition to transmission infrastructure from agricultural landowners in T&P Land Survey block. Eminent domain proceedings likely for three parcels crossing Route A northern alignment.

Evaluating constraint layer 5: Topographic and Geological Constraints. Caprock Escarpment crossing at Lubbock County requires engineered foundation for lattice towers — cost premium of $2.1M per mile vs. standard plains terrain.

Synthesis complete. Applying constraint-weighted A* pathfinding across 47,832 graph nodes...

Route A finalized: 118 miles via Pecos Basin — leverages US-385 ROW corridor, lowest construction cost, moderate regulatory exposure.
Route B finalized: 134 miles via Permian Basin midpoint — balanced cost and regulatory profile, avoids primary ESA zones.
Route C finalized: 152 miles via Edwards Plateau bypass — maximum habitat avoidance, fully outside Edwards Aquifer recharge zone.

Sierra Recommends: Route C. Preparing justification and risk summary.`;

// ─── Recommendation ───────────────────────────────────────────────────────
export const CANNED_RECOMMENDATION: RouteRecommendation = {
  routeId: 'C',
  rationale: 'Route C — Lowest Regulatory Risk is the recommended corridor because it fully bypasses the Edwards Aquifer recharge zone in Sutton County and avoids the ESA-designated Dunes Sagebrush Lizard habitat in Reeves County, eliminating the two costliest permit triggers. Although Route C adds approximately 34 miles versus Route A, the avoided ESA Section 7 consultation and CWA Section 404 individual permit reduce the permitting timeline by an estimated 12–18 months. Given the project\'s stated priority to minimize regulatory risk, Route C presents the strongest risk-adjusted outcome for a Texas ERCOT transmission project of this scale.',
  timestamp: Date.now(),
};

// ─── Environmental Triggers ───────────────────────────────────────────────
export const CANNED_TRIGGERS: EnvironmentalTrigger[] = [
  {
    routeId: 'A',
    triggers: [
      { statute: 'ESA Section 7', explanation: 'Route A crosses Dunes Sagebrush Lizard critical habitat in Reeves County, triggering formal Section 7 consultation with the U.S. Fish and Wildlife Service.', timelineMonths: [12, 18] },
      { statute: 'CWA Section 404', explanation: 'Three perennial stream crossings in the Pecos River watershed require individual 404 permits from the U.S. Army Corps of Engineers.', timelineMonths: [6, 12] },
      { statute: 'NHPA Section 106', explanation: 'ROW alignment passes within 0.5 miles of a recorded Comanche camp site in McCulloch County — cultural resource survey required.', timelineMonths: [3, 6] },
      { statute: 'NEPA Level', explanation: 'Environmental Impact Statement (EIS) required due to ESA critical habitat crossing — most intensive NEPA review tier.', timelineMonths: [18, 30] },
    ],
  },
  {
    routeId: 'B',
    triggers: [
      { statute: 'ESA Section 7', explanation: 'Route B skirts the eastern edge of Dunes Sagebrush Lizard habitat — informal consultation with USFWS recommended but formal consultation likely avoidable.', timelineMonths: [3, 6] },
      { statute: 'CWA Section 404', explanation: 'Two ephemeral drainages crossed in Midland County — nationwide permit (NWP 57) likely sufficient, avoiding individual 404 permit.', timelineMonths: [2, 4] },
      { statute: 'NHPA Section 106', explanation: 'No known historic properties within Area of Potential Effect — Phase I archaeological survey recommended as standard practice.', timelineMonths: [2, 4] },
      { statute: 'NEPA Level', explanation: 'Environmental Assessment (EA) with Finding of No Significant Impact (FONSI) anticipated — intermediate NEPA review tier.', timelineMonths: [8, 14] },
    ],
  },
  {
    routeId: 'C',
    triggers: [
      { statute: 'ESA Section 7', explanation: 'Route C fully avoids all designated ESA critical habitat in Reeves and Loving Counties — no Section 7 consultation required.', timelineMonths: [0, 0] },
      { statute: 'CWA Section 404', explanation: 'Route C avoids the Edwards Aquifer recharge zone entirely — one ephemeral crossing in Edwards County qualifies for nationwide permit (NWP 57).', timelineMonths: [2, 3] },
      { statute: 'NHPA Section 106', explanation: 'Standard Phase I archaeological survey required — no known historic properties in Edwards Plateau alignment.', timelineMonths: [2, 4] },
      { statute: 'NEPA Level', explanation: 'Categorical Exclusion (CE) or Environmental Assessment anticipated — minimal NEPA burden due to habitat avoidance.', timelineMonths: [4, 8] },
    ],
  },
];

// ─── Sierra Alerts ────────────────────────────────────────────────────────
export const CANNED_ALERTS: SierraAlert = {
  primary: {
    text: 'Nolan County landowner opposition cluster identified. Historical parcel records show three adjacent agricultural landowners (approximately 8,400 acres combined) who actively contested a 2019 wind transmission project. Eminent domain proceedings may extend ROW acquisition timeline by 18–24 months and add $4–7M in legal costs.',
    location: 'Nolan County',
  },
  secondary: [
    {
      text: 'Edwards Aquifer Authority coordination required. Route C alignment in Sutton County falls within the Edwards Aquifer Protection Program boundary — a separate state-level review process running concurrently with federal NEPA.',
      location: 'Sutton County',
    },
    {
      text: 'PUCT Certificate of Convenience and Necessity (CCN) application processing times have increased from an average of 14 months to 22 months since 2022 due to ERCOT Competitive Renewable Energy Zone (CREZ) backlog.',
      location: 'Austin, TX (PUCT)',
    },
  ],
};

// ─── Project Summary ──────────────────────────────────────────────────────
export const CANNED_SUMMARY: ProjectSummary = {
  phases: [
    { name: 'Desktop Screening & Route Selection', estimatedMonths: [2, 3], keyDependency: 'GIS data availability and initial stakeholder alignment' },
    { name: 'Environmental Review (NEPA/ESA/CWA)', estimatedMonths: [8, 18], keyDependency: 'USFWS consultation response time and scope of NEPA document required' },
    { name: 'ROW Acquisition & Negotiation', estimatedMonths: [12, 24], keyDependency: 'Landowner cooperation; eminent domain proceedings if required' },
    { name: 'State Permitting (PUCT CCN + TCEQ)', estimatedMonths: [14, 22], keyDependency: 'PUCT docket scheduling and intervention activity' },
    { name: 'Construction', estimatedMonths: [18, 30], keyDependency: 'Material lead times (transformers 18–36 month procurement) and weather windows' },
    { name: 'Total Estimated Timeline', estimatedMonths: [48, 84], keyDependency: 'Parallel tracking of permitting and ROW acquisition is critical to schedule compression' },
  ],
};

// ─── Segment Justifications (by segment index, used when frictionCache unavailable) ──
export const CANNED_SEGMENT_JUSTIFICATIONS: Record<number, string> = {
  0: 'Initial segment traverses Pecos Basin — low topographic relief, existing 345kV ROW available for co-location.',
  1: 'Crosses Permian Basin sedimentary geology — stable foundation, minimal geotechnical risk.',
  2: 'Approaching Edwards Plateau — limestone karst terrain increases foundation engineering complexity.',
  3: 'Edwards Plateau traverse — high biodiversity sensitivity; Golden-cheeked Warbler habitat adjacent to ROW.',
  4: 'Final approach to load center — urban fringe, higher land values and visual impact sensitivity.',
};
