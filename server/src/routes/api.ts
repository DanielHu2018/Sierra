import { Router } from 'express';
import {
  findNearestNode,
  findRoute,
  sharedGraph,
  graphNodes,
  frictionCache,
  haversineKm,
} from '../routing/astar.js';
import { buildMapboxStaticUrl, fetchMapboxThumbnail } from '../pdf/buildMapboxUrl.js';
import { generatePdf } from '../pdf/pdfGenerator.js';
import { mockContacts } from '../data/mock-contacts.js';
import { CANNED_NARRATIVES } from '../data/canned-narrative.js';
import { calculateImpactScores } from '../routing/impactScores.js';

const router = Router();

// ─── Health ───────────────────────────────────────────────────────────────────

router.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'sierra-api' });
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Constraint slider: 0 = full cost weight, 1 = full risk weight.
 * Blends into each profile's base weights linearly.
 */
function blendWeights(
  base: { costW: number; riskW: number },
  costRisk: number,
): { costW: number; riskW: number; coLocationW: number } {
  const blend = Math.max(0, Math.min(1, costRisk ?? 0.5));
  return {
    costW: base.costW * (1 - blend * 0.5),
    riskW: base.riskW * (1 + blend * 0.5),
    coLocationW: 1.0,
  };
}

function nodeIdPathToLineString(nodeIds: string[]) {
  const coords = nodeIds.map((id) => {
    const node = graphNodes.find((n) => n.id === id);
    return node ? ([node.lng, node.lat] as [number, number]) : ([0, 0] as [number, number]);
  });
  return { type: 'LineString' as const, coordinates: coords };
}

function buildSegmentJustifications(nodeIds: string[]) {
  return nodeIds.slice(0, -1).map((id, i) => ({
    segmentIndex: i,
    frictionScore: frictionCache[id]?.frictionScore ?? 0.5,
    justification: frictionCache[id]?.justification ?? 'No justification data available.',
  }));
}

function totalDistanceMiles(nodeIds: string[]): number {
  let totalKm = 0;
  for (let i = 0; i < nodeIds.length - 1; i++) {
    const a = graphNodes.find((n) => n.id === nodeIds[i]);
    const b = graphNodes.find((n) => n.id === nodeIds[i + 1]);
    if (a && b) totalKm += haversineKm(a.lat, a.lng, b.lat, b.lng);
  }
  return totalKm * 0.621371;
}

// ─── Stub routes when graph is empty (Phase 2 not yet complete) ───────────────

function cannedStubRoutes(source: [number, number], dest: [number, number]) {
  // Interpolate midpoint between source and dest for building distinct waypoints
  const midLng = (source[0] + dest[0]) / 2;
  const midLat = (source[1] + dest[1]) / 2;
  // Perpendicular offset magnitude (~1° ≈ ~70 miles — visually distinct on Texas map)
  const latSpan = Math.abs(dest[1] - source[1]);
  const lngSpan = Math.abs(dest[0] - source[0]);
  const offset = Math.max(latSpan, lngSpan, 1.5) * 0.35;

  // Route A bows west (lowest cost — follows existing utility corridors to the west)
  const waypointA: [number, number] = [midLng - offset * 0.9, midLat - offset * 0.2];
  // Route B goes straight with a slight northern bow (balanced)
  const waypointB1: [number, number] = [midLng - offset * 0.3, midLat + offset * 0.5];
  const waypointB2: [number, number] = [midLng + offset * 0.3, midLat + offset * 0.3];
  // Route C bows east (lowest risk — avoids western habitat clusters)
  const waypointC: [number, number] = [midLng + offset * 0.9, midLat - offset * 0.2];

  return [
    {
      id: 'A',
      profile: 'lowest-cost',
      label: 'Route A — Least-Cost',
      color: '#A7C8FF',
      geometry: {
        type: 'LineString' as const,
        coordinates: [source, waypointA, dest],
      },
      metrics: { distanceMiles: 120, estimatedCapexUSD: 420_000_000, permittingMonths: [18, 24] as [number, number] },
      segmentJustifications: [
        { segmentIndex: 0, frictionScore: 0.3, justification: 'Low-friction corridor along US-385 in Reeves County.' },
        { segmentIndex: 1, frictionScore: 0.25, justification: 'Follows existing utility right-of-way reducing acquisition cost.' },
      ],
      narrativeSummary: '',
      populationServed: 1_020_000,
      impactScore: { jobsCreated: 3_200, emissionsReduced_tCO2: 980_000, healthImpactScore: 62 },
    },
    {
      id: 'B',
      profile: 'balanced',
      label: 'Route B — Max Population Served',
      color: '#4ade80',
      geometry: {
        type: 'LineString' as const,
        coordinates: [source, waypointB1, waypointB2, dest],
      },
      metrics: { distanceMiles: 135, estimatedCapexUSD: 567_000_000, permittingMonths: [24, 36] as [number, number] },
      segmentJustifications: [
        { segmentIndex: 0, frictionScore: 0.5, justification: 'Mixed terrain through Edwards Plateau.' },
        { segmentIndex: 1, frictionScore: 0.45, justification: 'Moderate permitting complexity; balanced cost-risk profile.' },
        { segmentIndex: 2, frictionScore: 0.4, justification: 'Approaches destination through lower-friction agricultural land.' },
      ],
      narrativeSummary: '',
      populationServed: 2_150_000,
      impactScore: { jobsCreated: 5_800, emissionsReduced_tCO2: 1_840_000, healthImpactScore: 78 },
    },
    {
      id: 'C',
      profile: 'lowest-risk',
      label: 'Route C — Renewable-Optimized',
      color: '#E8B3FF',
      geometry: {
        type: 'LineString' as const,
        coordinates: [source, waypointC, dest],
      },
      metrics: { distanceMiles: 155, estimatedCapexUSD: 775_000_000, permittingMonths: [30, 48] as [number, number] },
      segmentJustifications: [
        {
          segmentIndex: 0,
          frictionScore: 0.2,
          justification:
            'Avoids Edwards Aquifer recharge zone and Nolan County habitat clusters.',
        },
        {
          segmentIndex: 1,
          frictionScore: 0.15,
          justification:
            'Eastern bypass clears sensitive ESA-designated species corridors entirely.',
        },
      ],
      narrativeSummary: '',
      populationServed: 1_380_000,
      impactScore: { jobsCreated: 4_100, emissionsReduced_tCO2: 1_420_000, healthImpactScore: 71 },
    },
  ];
}

// ─── POST /api/route ──────────────────────────────────────────────────────────

router.post('/route', async (req, res) => {
  try {
    const { source, dest, constraints } = req.body as {
      source: [number, number]; // [lng, lat]
      dest: [number, number];   // [lng, lat]
      constraints?: {
        costRisk?: number;           // 0→1 slider
        coLocation?: boolean;
        eminentDomainAvoidance?: boolean;
        ecologyAvoidance?: boolean;
      };
      voltage?: string;
    };

    const costRisk = constraints?.costRisk ?? 0.5;

    // If graph has no nodes (Phase 2 not complete), return stub routes
    if (graphNodes.length === 0) {
      return res.json(cannedStubRoutes(source, dest));
    }

    // Map lng/lat pins to nearest graph node (findNearestNode takes lat, lng)
    const srcId = findNearestNode(source[1], source[0]);
    const dstId = findNearestNode(dest[1], dest[0]);

    // Three parallel route profiles
    const [pathA, pathB, pathC] = await Promise.all([
      Promise.resolve(
        findRoute(srcId, dstId, sharedGraph, blendWeights({ costW: 1.5, riskW: 0.5 }, costRisk)),
      ),
      Promise.resolve(
        findRoute(srcId, dstId, sharedGraph, blendWeights({ costW: 1.0, riskW: 1.0 }, costRisk)),
      ),
      Promise.resolve(
        findRoute(srcId, dstId, sharedGraph, blendWeights({ costW: 0.5, riskW: 1.5 }, costRisk)),
      ),
    ]);

    // Detect when A* produces identical paths (happens when frictionScore === regulatoryRisk
    // across all edges, making weight ratios irrelevant). In that case fall back to
    // geographically distinct canned routes so the map shows three visible lines.
    const pathAKey = pathA.join(',');
    const pathBKey = pathB.join(',');
    const pathCKey = pathC.join(',');
    const pathsIdentical = pathAKey === pathBKey || pathBKey === pathCKey;
    if (pathsIdentical || pathA.length === 0 || pathB.length === 0 || pathC.length === 0) {
      return res.json(cannedStubRoutes(source, dest));
    }

    const routeDefs = [
      {
        id: 'A',
        profile: 'lowest-cost',
        label: 'Route A — Least-Cost',
        color: '#A7C8FF',
        path: pathA,
        capexPerMile: 3_500_000,
        permitting: [18, 24] as [number, number],
      },
      {
        id: 'B',
        profile: 'balanced',
        label: 'Route B — Max Population Served',
        color: '#4ade80',
        path: pathB,
        capexPerMile: 4_200_000,
        permitting: [24, 36] as [number, number],
      },
      {
        id: 'C',
        profile: 'lowest-risk',
        label: 'Route C — Renewable-Optimized',
        color: '#E8B3FF',
        path: pathC,
        capexPerMile: 5_000_000,
        permitting: [30, 48] as [number, number],
      },
    ];

    const routes = routeDefs.map((r) => {
      const miles = totalDistanceMiles(r.path);
      const segs = buildSegmentJustifications(r.path);
      const avgFriction = segs.length
        ? segs.reduce((s, j) => s + j.frictionScore, 0) / segs.length
        : 0.5;
      const frictionMultiplier = 0.75 + avgFriction * 0.75;
      const [pMin, pMax] = r.permitting;
      const permittingScale = 0.8 + avgFriction * 0.6;
      const routeNodes = r.path.map(id => graphNodes.find(n => n.id === id)!).filter(Boolean);
      const impact = calculateImpactScores(routeNodes, miles, avgFriction);
      return {
        id: r.id,
        profile: r.profile,
        label: r.label,
        color: r.color,
        geometry: nodeIdPathToLineString(r.path),
        metrics: {
          distanceMiles: Math.round(miles),
          estimatedCapexUSD: Math.round(miles * r.capexPerMile * frictionMultiplier),
          permittingMonths: [
            Math.round(pMin * permittingScale),
            Math.round(pMax * permittingScale),
          ] as [number, number],
        },
        segmentJustifications: segs,
        narrativeSummary: '',
        populationServed: impact.populationServed,
        impactScore: {
          jobsCreated: impact.jobsCreated,
          emissionsReduced_tCO2: impact.emissionsReduced_tCO2,
          healthImpactScore: impact.healthImpactScore,
        },
      };
    });

    res.json(routes);
  } catch (err) {
    console.error('[POST /api/route]', err);
    res.status(500).json({ error: 'Route generation failed' });
  }
});

// ─── POST /api/export/pdf ─────────────────────────────────────────────────
// Generate and stream a Puppeteer PDF dossier for the selected route.
// All content is pre-generated (via Phase 3 parallel batch + POST /api/narrative).
// Client passes everything in the request body; server only adds mapThumbnail + contacts.
//
// Pipeline: Validate → Fetch Mapbox thumbnail → Assemble template data → generatePdf → stream
router.post('/export/pdf', async (req, res) => {
  const {
    routeId,
    route,
    recommendation,
    triggers,
    alerts,
    projectSummary,
    narrative,
  } = req.body as {
    routeId: 'A' | 'B' | 'C';
    route: import('../types.js').RouteResult;
    recommendation: import('../types.js').RouteRecommendation;
    triggers: import('../types.js').EnvironmentalTrigger[];
    alerts: import('../types.js').SierraAlert;
    projectSummary: import('../types.js').ProjectSummary;
    narrative: string;
  };

  // Validate routeId
  if (!routeId || !['A', 'B', 'C'].includes(routeId)) {
    res.status(400).json({ error: 'Invalid routeId — must be A, B, or C' });
    return;
  }

  try {
    // Step 1: Fetch Mapbox Static Image server-side
    // .catch(() => '') — empty string means template shows placeholder div instead of img
    const mapboxToken = process.env.MAPBOX_TOKEN ?? '';
    let mapThumbnail = '';
    if (mapboxToken && route?.geometry) {
      const mapUrl = buildMapboxStaticUrl(route.geometry as import('geojson').LineString, mapboxToken);
      mapThumbnail = await fetchMapboxThumbnail(mapUrl).catch((err: Error) => {
        console.warn('[pdf] Mapbox thumbnail fetch failed:', err.message);
        return '';
      });
    }

    // Step 2: Server-side data (not trusted from client)
    const contacts = mockContacts[routeId] ?? [];

    // Step 3: Narrative coalescing — use canned fallback if client didn't send one
    const safeNarrative = narrative || CANNED_NARRATIVES[routeId] || '';

    // Step 4: Build template data + generate PDF buffer
    const exportDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const pdfBuffer = await generatePdf({
      route,
      recommendation,
      triggers: triggers ?? [],
      alerts,
      projectSummary,
      narrative: safeNarrative,
      contacts,
      mapThumbnail,
      exportDate,
    });

    // Step 5: Stream PDF buffer with download headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="sierra-dossier-route-${routeId}.pdf"`
    );
    res.setHeader('Content-Length', pdfBuffer.length);
    res.send(pdfBuffer);
  } catch (err) {
    console.error('[pdf] PDF generation failed:', err);
    res.status(500).json({ error: 'PDF generation failed' });
  }
});

export default router;
