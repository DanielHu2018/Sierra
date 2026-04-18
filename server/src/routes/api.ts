import { Router } from 'express';
import {
  findNearestNode,
  findRoute,
  sharedGraph,
  graphNodes,
  frictionCache,
  haversineKm,
} from '../routing/astar.js';

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
  const geo = (a: [number, number], b: [number, number]) => ({
    type: 'LineString' as const,
    coordinates: [a, b],
  });
  return [
    {
      id: 'A',
      profile: 'lowest-cost',
      label: 'Route A — Lowest Cost',
      color: '#A7C8FF',
      geometry: geo(source, dest),
      metrics: { distanceMiles: 120, estimatedCapexUSD: 420_000_000, permittingMonths: [18, 24] as [number, number] },
      segmentJustifications: [
        { segmentIndex: 0, frictionScore: 0.3, justification: 'Low-friction corridor along US-385 in Reeves County.' },
      ],
      narrativeSummary: '',
    },
    {
      id: 'B',
      profile: 'balanced',
      label: 'Route B — Balanced',
      color: '#FFBC7C',
      geometry: geo(source, dest),
      metrics: { distanceMiles: 135, estimatedCapexUSD: 567_000_000, permittingMonths: [24, 36] as [number, number] },
      segmentJustifications: [
        { segmentIndex: 0, frictionScore: 0.5, justification: 'Mixed terrain through Edwards Plateau.' },
      ],
      narrativeSummary: '',
    },
    {
      id: 'C',
      profile: 'lowest-risk',
      label: 'Route C — Lowest Regulatory Risk',
      color: '#E8B3FF',
      geometry: geo(source, dest),
      metrics: { distanceMiles: 155, estimatedCapexUSD: 775_000_000, permittingMonths: [30, 48] as [number, number] },
      segmentJustifications: [
        {
          segmentIndex: 0,
          frictionScore: 0.2,
          justification:
            'Avoids Edwards Aquifer recharge zone and Nolan County habitat clusters.',
        },
      ],
      narrativeSummary: '',
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

    const routeDefs = [
      {
        id: 'A',
        profile: 'lowest-cost',
        label: 'Route A — Lowest Cost',
        color: '#A7C8FF',
        path: pathA,
        capexPerMile: 3_500_000,
        permitting: [18, 24] as [number, number],
      },
      {
        id: 'B',
        profile: 'balanced',
        label: 'Route B — Balanced',
        color: '#FFBC7C',
        path: pathB,
        capexPerMile: 4_200_000,
        permitting: [24, 36] as [number, number],
      },
      {
        id: 'C',
        profile: 'lowest-risk',
        label: 'Route C — Lowest Regulatory Risk',
        color: '#E8B3FF',
        path: pathC,
        capexPerMile: 5_000_000,
        permitting: [30, 48] as [number, number],
      },
    ];

    const routes = routeDefs.map((r) => {
      const miles = totalDistanceMiles(r.path);
      return {
        id: r.id,
        profile: r.profile,
        label: r.label,
        color: r.color,
        geometry: nodeIdPathToLineString(r.path),
        metrics: {
          distanceMiles: Math.round(miles),
          estimatedCapexUSD: Math.round(miles * r.capexPerMile),
          permittingMonths: r.permitting,
        },
        segmentJustifications: buildSegmentJustifications(r.path),
        narrativeSummary: '',
      };
    });

    res.json(routes);
  } catch (err) {
    console.error('[POST /api/route]', err);
    res.status(500).json({ error: 'Route generation failed' });
  }
});

export default router;
