# Domain Pitfalls: Sierra — AI Transmission Line Routing Platform

**Domain:** Geospatial AI routing / hackathon demo platform
**Researched:** 2026-04-16
**Confidence:** MEDIUM — drawn from training knowledge of GIS, RAG, LLM API, pathfinding, and PDF generation patterns through August 2025. External docs were unavailable for verification; flag all performance thresholds for pre-build validation.

---

## Critical Pitfalls

Mistakes that cause demo failure, judge disengagement, or a rewrite mid-hackathon.

---

### Pitfall C1: Raw GeoJSON Overload on the Map

**What goes wrong:** Loading full-resolution GeoJSON for Texas parcels, habitat zones, or topography as a single flat file into Mapbox GL JS. Texas has ~5 million land parcels. Even habitat/grid overlays can balloon to 50–200 MB of raw GeoJSON. The browser attempts to parse and render all features simultaneously, causing a 5–30 second freeze on initial load and janky pan/zoom. Judges interact with the map immediately and notice the stutter.

**Why it happens:** Developers pull a state-level shapefile from TIGER or ERCOT, convert to GeoJSON with `ogr2ogr`, and add it as a single `addSource` call. It works fine in local Chrome with 32 GB RAM. It dies on a judge's laptop or a demo machine under load.

**Consequences:** Map is unusable for the first 10–30 seconds of a live demo. Judge tries to pan while features are rendering — gets blank tiles or frozen UI. First impressions are set in the first 30 seconds.

**Prevention:**
1. Pre-process all GeoJSON layers with `tippecanoe` into MBTiles vector tiles. Serve tiles, not raw GeoJSON.
2. Apply geometry simplification at the source: `mapshaper -simplify 10%` reduces vertex count by 80–90% with no visible difference at state scale.
3. For layers you must serve as GeoJSON (e.g., the three generated routes), keep the feature count under 500 and coordinates under 10,000 total points.
4. Use Mapbox's `cluster` option for point datasets above 200 features.
5. Set `minzoom`/`maxzoom` on layers so habitat overlays only render when zoomed in.

**Detection warning signs:**
- `addSource` call followed by >2 second browser console log before first tile appears
- Chrome DevTools memory tab shows >500 MB heap during map load
- `performance.now()` around the source load exceeds 3000 ms

**Phase mapping:** Address in Phase 1 (Map Foundation) — data pipeline decision must be made before any other layer is added. Retrofitting tile serving after the fact is expensive.

---

### Pitfall C2: Hallucinated or Out-of-Bounds Coordinates from the LLM

**What goes wrong:** Prompting Claude to generate route waypoints, suggest friction scores for geographic regions, or describe segment paths produces coordinates that are outside Texas, in the Gulf of Mexico, or geometrically nonsensical (e.g., longitude 180° instead of -97°). These coordinates render as invisible paths or crash the pathfinding graph.

**Why it happens:** LLMs do not have precise geographic knowledge. Asking "give me intermediate waypoints between [lat, lon] and [lat, lon]" will produce plausible-looking but wrong numbers. This is a category error — LLMs reason about text, not coordinate space.

**Consequences:** Route lines disappear off the visible map. `turf.js` throws errors on invalid geometries. A* receives NaN node IDs. Demo crashes silently.

**Prevention:**
1. Never ask the LLM to generate coordinates. The LLM's only role is to produce friction *scores* (0.0–1.0 floats) and *text justifications*. Coordinates come exclusively from the pre-built graph.
2. Validate every LLM-returned numeric value with a bounding box check: Texas is roughly `[-106.65, 25.84, -93.51, 36.50]`. Reject and retry or use a default if out of bounds.
3. Use structured output (JSON schema with `type: number, minimum: 0, maximum: 1`) for friction scores so the LLM cannot return coordinate-like values.
4. Add a `validateRoute(geojson)` step post-pathfinding that checks all coordinates are within the bounding box before rendering.

**Detection warning signs:**
- LLM returns numbers > 1.0 in friction score fields
- Route line renders as a single dot or disappears off map
- Console error: `"coordinates must be finite numbers"`

**Phase mapping:** Address in Phase 2 (AI/RAG Core) when defining the LLM contract. Bounding box validation goes in Phase 3 (Routing Engine).

---

### Pitfall C3: A* Graph Has Disconnected Nodes (Routing Fails Silently)

**What goes wrong:** The friction-scored grid graph for Texas is built by discretizing the state into a grid of nodes. If the grid construction has any bug — wrong coordinate projection, node ID collision, floating-point precision errors in adjacency — some nodes will have no edges. A* terminates early with "no path found." Because the map still shows the source and destination pins, judges think the system worked but there are no routes.

**Why it happens:** Grid graphs are deceptively simple to describe but error-prone to build. Common bugs: using geographic degrees as distance when the graph needs projected meters; off-by-one errors in grid indexing; treating lat/lon as (x, y) instead of (y, x); high-friction nodes being pruned entirely from the graph instead of having high-cost edges.

**Consequences:** Route computation returns null. If error handling is incomplete, the UI hangs on the progress animation. This is a judge-facing demo killer.

**Prevention:**
1. Build the graph offline and serialize it as a pre-validated JSON/binary file. Do not construct the graph at request time.
2. Run a connectivity check (BFS from a central node) after construction — assert that >95% of nodes are reachable.
3. Never delete high-friction nodes. Instead, assign them a weight of 10x the base cost. Disconnected = pathfinding failure; expensive = pathfinding works but avoids the node.
4. Use a flat array index `id = row * cols + col` for node IDs, never floating-point lat/lon as keys.
5. Test A* against 20 random origin/destination pairs before demo day.

**Detection warning signs:**
- BFS from center node reaches fewer than 80% of expected nodes
- A* returns null for any pair that should be routeable
- Graph serialized file is unexpectedly small (missing nodes were silently dropped)

**Phase mapping:** Phase 3 (Routing Engine) — graph validation must be automated, not manual.

---

### Pitfall C4: LLM API Rate Limits Kill Live Demo

**What goes wrong:** The demo runs three parallel route computations, each requiring multiple LLM calls for friction scoring and justifications. Under load — multiple judges using the demo simultaneously or a single judge running it three times quickly — the Claude API returns `429 Too Many Requests`. The UI shows a spinner forever.

**Why it happens:** Hackathon API keys are often on free or starter tiers with aggressive rate limits (e.g., 5 requests/minute, 50k tokens/minute). Three routes × N hotspot segments × 2 calls each (friction + justification) can easily exceed this in a burst.

**Consequences:** Routes never render. Demo stalls. If there is no visible error, the judge assumes the AI component is broken.

**Prevention:**
1. Audit the exact API tier and rate limits before writing any LLM integration code. Budget API calls against the worst-case demo scenario.
2. Pre-compute and cache all friction scores during the build step, not at request time. LLM friction scoring should run once offline; only the justification text (which is fast and cheap) runs live.
3. Batch all live LLM calls for a single user request into one API call using a structured prompt (e.g., "score these 5 segments and return a JSON array").
4. Implement exponential backoff with a visible "AI is thinking..." UI state — never let the UI silently hang.
5. Cache LLM justification text per route profile: if the same segment appears in multiple routes, reuse the cached justification.
6. Have a hardcoded fallback justification for each route type ("This segment minimizes eminent domain exposure by...") that fires if the API fails.

**Detection warning signs:**
- API response headers show `x-ratelimit-remaining: 0`
- Request duration exceeds 10 seconds for a justification call
- Any `429` in the network tab during a dry run

**Phase mapping:** Phase 2 (AI/RAG Core) — rate limit strategy must be part of the initial API integration, not added later.

---

### Pitfall C5: RAG Retrieval Returns Irrelevant Regulation Chunks

**What goes wrong:** The RAG vector store over PUCT/NEPA/Texas environmental regulations returns chunks that do not match the query about a specific geographic segment. The LLM then generates justifications that are generically correct ("federal environmental review required") but not specific to the segment's actual constraint (e.g., a wildlife corridor crossing). Judges who read the justification text notice it sounds like boilerplate.

**Why it happens:** PDF regulations are chunked naively by page or fixed character count. A single PUCT rule may span three pages; a fixed-size chunk cuts it mid-sentence. The resulting embedding captures partial semantic content. When queried, the top-k retrieved chunks are tangentially related but not responsive.

**Consequences:** Justification text is vague or incorrect for the segment. The AI narrative sounds like it was generated without context — exactly what judges are looking for to dismiss the AI claim.

**Prevention:**
1. Chunk regulations by semantic unit: section headers, sub-sections, numbered rule boundaries. Use a regex on the PDF text to detect `§ 25.xxx` or `Section X.Y` boundaries.
2. Target chunk size of 400–600 tokens with 50–100 token overlap. Smaller chunks = more precise retrieval; overlap prevents context loss at boundaries.
3. Add metadata to each chunk: source document, rule number, geographic applicability (statewide vs. regional). Include this metadata in the retrieval prompt.
4. Test retrieval quality before the hackathon: run 10 representative queries (e.g., "eminent domain requirements for private land in Texas") and verify the top-3 chunks are relevant.
5. For a hackathon, it is acceptable to manually curate 20–30 key regulation chunks that cover the most likely segment scenarios and pin them as high-priority retrieval results.

**Detection warning signs:**
- Retrieved chunks contain the query terms but in a different context (false positives)
- LLM justification text contradicts the actual constraint shown on the map
- Justification text is identical across three very different route segments

**Phase mapping:** Phase 2 (AI/RAG Core) — chunk strategy is a one-time decision that is expensive to redo. Validate retrieval quality before building the prompt layer on top.

---

### Pitfall C6: PDF Export Blocks the UI Thread

**What goes wrong:** PDF generation (route map screenshot + dashboard metrics + per-segment justifications) is triggered client-side using a library like `jsPDF` or `html2canvas`. These operations are synchronous or near-synchronous and block the main thread for 3–8 seconds on complex layouts. The browser tab becomes unresponsive. On some machines, the tab crashes.

**Why it happens:** `html2canvas` must traverse the DOM, resolve styles, rasterize SVGs, and capture canvas elements. A full-page capture of a Mapbox map + dashboard cards can exceed 10 MB of raw bitmap data before PDF compression.

**Consequences:** The judge clicks "Export PDF" and the browser freezes. If it recovers, the PDF has a broken map capture (Mapbox GL renders via WebGL and `html2canvas` cannot capture it reliably). The PDF looks like a broken template.

**Prevention:**
1. Do not capture the live Mapbox map with `html2canvas`. Instead, use Mapbox's Static Images API or generate a map thumbnail server-side using a headless approach. Store the map thumbnail as a pre-rendered PNG at route completion time.
2. Generate PDF server-side (Node.js with `puppeteer` or `@react-pdf/renderer`). The client sends a JSON payload; the server returns a PDF blob. This moves the blocking work off the UI thread entirely.
3. Show a progress indicator during PDF generation ("Generating your dossier...") — never let the button go dead.
4. Cap PDF size: compress images to 72 DPI for screen viewing, limit per-segment justifications to 3 sentences each.
5. Test PDF generation with all three route profiles simultaneously to ensure it does not saturate server memory.

**Detection warning signs:**
- `html2canvas` call takes >2 seconds in DevTools
- Mapbox map appears as a blank white box in the PDF
- Browser console shows: `"Could not render canvas: tainted canvas"` (CORS from Mapbox tiles)

**Phase mapping:** Phase 4 (PDF Export) — architecture decision (client vs. server) must be made before writing a single line of PDF code.

---

## Moderate Pitfalls

Mistakes that degrade demo quality or cost significant recovery time.

---

### Pitfall M1: Friction Heatmap Rendering Covers Routes

**What goes wrong:** The friction heatmap (green-to-red overlay across Texas) is rendered as a raster layer on top of the route lines. During the demo, the three colored route lines are invisible beneath the heatmap. Toggling the heatmap off reveals the routes, but the judge's first impression is a red blob with no routes.

**Prevention:**
1. Set explicit layer z-order: routes always above heatmap. In Mapbox, use `map.addLayer(layer, beforeId)` to insert routes above the heatmap layer.
2. Set heatmap opacity to 0.4–0.6 by default so routes are visible through it.
3. Make the heatmap toggle default to OFF — routes are the primary visual; the heatmap is supporting context.

**Phase mapping:** Phase 1 (Map Foundation) — layer ordering must be designed upfront.

---

### Pitfall M2: Tile Loading on Slow Conference WiFi

**What goes wrong:** The demo venue WiFi is congested. Mapbox tiles load slowly, leaving grey blank areas on the map. The judge sees the map mid-load and thinks it is broken.

**Prevention:**
1. Pre-warm the tile cache by panning over Texas during setup before judges arrive. Mapbox caches tiles in IndexedDB.
2. Set the Mapbox style to a simple base style (no satellite imagery) — vector tiles are orders of magnitude smaller than raster/satellite.
3. Prepare a hotspot backup: tether from a phone if venue WiFi fails.
4. Consider a self-hosted `mbtiles` server (e.g., `tileserver-gl`) for all custom overlay tiles so they never depend on external network.

**Phase mapping:** Phase 5 (Demo Hardening) — tile caching and offline fallback are pre-demo tasks.

---

### Pitfall M3: Route Generation Progress Animation Lies

**What goes wrong:** The progress bar during route generation reaches 100% in 5 seconds but the actual LLM calls take 30+ seconds. The UI shows "Done" while still waiting for API responses. Alternatively, the progress bar freezes at 67% because the developer hardcoded three stages but did not account for variable LLM latency.

**Prevention:**
1. Use indeterminate progress (spinner + step label: "Scoring friction graph... Querying regulations... Generating narratives...") instead of a percentage bar unless you can derive the percentage from real events.
2. Stream LLM responses where possible (Claude supports streaming) so the progress animation reflects actual token generation.
3. Show partial results: render the pathfinding result immediately, then progressively add LLM justifications as they arrive.

**Phase mapping:** Phase 3 (Routing Engine) — progress UX must be designed alongside the async routing pipeline.

---

### Pitfall M4: Three Simultaneous A* Runs Block the Event Loop

**What goes wrong:** Running Lowest Cost, Balanced, and Lowest Regulatory Risk A* searches simultaneously in the same Node.js process blocks the event loop for 2–10 seconds on a large grid. API requests queue up. The UI receives no response during this window.

**Prevention:**
1. Run A* in a Worker thread (`worker_threads` in Node.js) or use `Promise.all` with three separate async workers so the event loop stays free.
2. Pre-compute route candidates for common origin/destination pairs and cache them. During the demo, the "computation" is fast because results are cached.
3. Limit grid resolution to what is visually meaningful: a 200×200 grid for Texas (roughly 1.5 km per cell) is sufficient for the demo and runs in <1 second per A* search.

**Phase mapping:** Phase 3 (Routing Engine) — grid resolution and worker architecture must be decided before implementation.

---

### Pitfall M5: Constraint Controls Don't Change Routes Visibly

**What goes wrong:** The cost-vs-risk slider, ecology avoidance toggle, and eminent domain toggle look interactive but produce routes that look identical to each other. Judges notice when moving a slider changes nothing visible on the map.

**Why it happens:** The LLM friction weights for each constraint have too little range (e.g., ecology weight changes from 1.0 to 1.05), so the A* path barely changes. Or the three route profiles are hardcoded and do not actually re-run with the new constraint values.

**Prevention:**
1. Ensure constraint weights have meaningful range: ecology avoidance off = weight 1.0, on = weight 5.0. The route should visibly detour around habitat zones when toggled.
2. Validate with at least one origin/destination pair where each toggle produces a visibly different route before the demo.
3. Pre-compute route variants for the demo's canonical origin/destination pair with each constraint combination. Swap the displayed route based on constraint state rather than re-running A* live.

**Phase mapping:** Phase 3 (Routing Engine) — constraint sensitivity testing is a required pre-demo checklist item.

---

### Pitfall M6: Hover Popups Show Wrong Segment Data

**What goes wrong:** Route segment hover shows a popup with LLM justification text, but the text is for a different segment (e.g., all popups show the same first segment's justification). This happens when segment IDs are not correctly threaded from the LLM response back to the GeoJSON feature properties.

**Prevention:**
1. Store the LLM justification as a `properties.justification` field directly on each GeoJSON LineString feature. Do not look up justifications by index at render time.
2. Validate by hovering every segment of every route during local testing — not just the first and last.

**Phase mapping:** Phase 3 (Routing Engine) — data threading from LLM → GeoJSON properties must be tested exhaustively.

---

## Minor Pitfalls

Friction items that reduce polish but do not kill the demo.

---

### Pitfall N1: ADA Color Contrast Failure on Route Colors

**What goes wrong:** The three route colors (e.g., green/orange/red) fail WCAG contrast checks against the map background. Some judges may not be able to distinguish them. Using red for "high regulatory risk" is also a red-green colorblindness issue.

**Prevention:** Use distinct hue+lightness combinations: blue (#0057B7), orange (#FF8C00), purple (#7B2D8B). Test with a colorblindness simulator (e.g., `colblindor.com`). Add route labels directly on the line, not just in the legend.

**Phase mapping:** Phase 1 (Map Foundation) — color palette decision is made once.

---

### Pitfall N2: Dashboard Cards Show Undefined for Cost/Distance

**What goes wrong:** The results dashboard cards display `undefined km` or `$undefined M` if the route computation returns before all fields are populated.

**Prevention:** Initialize all card fields with placeholder values ("—") on route start. Never render raw JavaScript values without a null-check fallback.

**Phase mapping:** Phase 3 (Routing Engine) — null-state handling for all displayed metrics.

---

### Pitfall N3: PDF Filename Collision on Multiple Exports

**What goes wrong:** Judge exports a PDF for Route A, then Route B. Both download as `sierra-report.pdf`. The second overwrites the first in the Downloads folder.

**Prevention:** Include route profile and timestamp in filename: `sierra-lowest-cost-20260416-1423.pdf`.

**Phase mapping:** Phase 4 (PDF Export) — trivial fix, but catches judges who want to compare reports.

---

### Pitfall N4: Mock Owner Contacts Look Fake

**What goes wrong:** The PDF dossier shows landowner contacts with names like "John Smith" and phone numbers like "555-0100". Judges immediately recognize these as fake and it undermines the credibility of the entire report.

**Prevention:** Use plausible-looking but clearly labeled mock data. Use real Texas county appraisal district name patterns ("Travis County Appraisal District — Parcel TX-2024-00431") with a visible "Demo Data — Not for Production Use" watermark. Realism in naming, transparency in labeling.

**Phase mapping:** Phase 4 (PDF Export) — data design decision.

---

## Hackathon-Specific Pitfalls

Patterns that are uniquely dangerous in 48-hour builds.

---

### Pitfall H1: "2-Hour" Feature Becomes 8 Hours — Integration Hell

**What goes wrong:** The RAG vector store, A* engine, and Mapbox front-end are built in parallel by different team members. Integration reveals that the data contracts between them were never agreed upon. The RAG returns scores in one format, A* expects another. Every field name is slightly different. The last 12 hours are spent on plumbing instead of polish.

**Prevention:**
1. Define the data contract between all components in a shared `types.ts` (or schema file) on Hour 1, before any code is written. Fields: node ID format, friction score range, route GeoJSON structure, segment metadata shape.
2. Build a stub for each component that satisfies the contract with hardcoded data. Integration works from Hour 2; real implementations replace stubs incrementally.
3. Assign one person as integration owner whose job is to make sure the stubs connect end-to-end before any real implementation is merged.

**Phase mapping:** Phase 1 (Foundation) — contract-first design is the single highest-leverage decision in a hackathon.

---

### Pitfall H2: Scope Creep from "While We're At It" Features

**What goes wrong:** The map foundation takes 4 hours instead of 2, but someone adds "while we're at it" features: a county boundary layer, a terrain elevation color ramp, an animated route drawing effect. These eat 6+ hours across the team and the PDF export never gets finished.

**Prevention:**
1. Every feature not on the `PROJECT.md` requirements list requires explicit team agreement to add. Default is NO.
2. Keep a "parking lot" list of nice-to-haves. Nothing from the parking lot gets built until all required features are green.
3. Use time-boxing: each required feature gets a fixed budget. If it exceeds budget by 2×, cut scope rather than extend time.

**Phase mapping:** All phases — this is a cultural/process pitfall, not technical.

---

### Pitfall H3: The Demo Machine Environment Differs from Dev

**What goes wrong:** The demo works perfectly on the developer's MacBook. On the demo machine (Windows laptop, older Chrome, different screen resolution), the map rendering is broken, the PDF layout overflows, and the font is wrong.

**Prevention:**
1. Deploy to a live URL (Vercel, Netlify, or Railway) by the halfway point of the hackathon. Demo from the deployed URL, not localhost.
2. Test on a second physical machine or at minimum a different browser (Chrome + Firefox).
3. Set explicit viewport meta tag for desktop. Use rem/vw units for layout, not px, so different screen sizes don't break card layouts.

**Phase mapping:** Phase 5 (Demo Hardening) — deploy-early discipline.

---

### Pitfall H4: LLM Cold Start Kills the First Demo

**What goes wrong:** The Claude API call for the first route takes 8–12 seconds because the model is cold-starting. Subsequent calls take 2–3 seconds. Judges see the first demo and form their impression based on the slow first call.

**Prevention:**
1. Make a "warm-up" API call at application startup (a lightweight ping with the system prompt) so the first real call is not cold.
2. Pre-generate justifications for the canonical demo route during deployment. The first demo is always the pre-generated result, not a live call.
3. Show streaming output: render justification text word-by-word as it streams. A 6-second stream looks like "real-time AI" rather than "broken API."

**Phase mapping:** Phase 2 (AI/RAG Core) + Phase 5 (Demo Hardening).

---

### Pitfall H5: No Graceful Error State for Any API Failure

**What goes wrong:** Any unhandled promise rejection (Claude API 500, vector store connection failure, graph file not found) causes the UI to freeze in the loading state with no error message. Judges click "Generate Routes" multiple times trying to make it work.

**Prevention:**
1. Every async call is wrapped in try/catch with a user-visible error message AND a fallback behavior.
2. Define fallback behavior for each failure mode before writing any async code:
   - LLM API failure → use pre-written canned justifications
   - Vector store failure → use hardcoded regulation snippets
   - Graph failure → show a configuration error with a retry button
3. Test failure paths explicitly: add a debug mode that forces each failure scenario.

**Phase mapping:** Phase 3 (Routing Engine) — error states are part of the MVP, not polish.

---

## Phase-Specific Warning Summary

| Phase | Topic | Likely Pitfall | Mitigation |
|-------|-------|---------------|------------|
| Phase 1: Map Foundation | GeoJSON data loading | C1: Raw GeoJSON overload causing lag | Pre-process to vector tiles with tippecanoe before Phase 1 starts |
| Phase 1: Map Foundation | Layer ordering | M1: Heatmap covers routes | Set explicit z-order: routes > heatmap > overlays |
| Phase 1: Map Foundation | Route color palette | N1: ADA contrast failure | Lock palette to colorblind-safe colors in Phase 1 |
| Phase 1: Map Foundation | Data contracts | H1: Integration hell | Define types.ts contract on Hour 1 |
| Phase 2: AI/RAG Core | Chunk strategy | C5: Irrelevant retrieval | Chunk by semantic boundary, not fixed size |
| Phase 2: AI/RAG Core | Rate limits | C4: API 429 kills demo | Pre-compute friction offline; live LLM only for justifications |
| Phase 2: AI/RAG Core | LLM coordinates | C2: Hallucinated coordinates | LLM never generates coordinates; validate all numeric outputs |
| Phase 2: AI/RAG Core | Cold start | H4: Slow first demo | Warm-up call at startup; pre-generate canonical demo route |
| Phase 3: Routing Engine | Graph construction | C3: Disconnected nodes | BFS connectivity check post-construction |
| Phase 3: Routing Engine | A* concurrency | M4: Event loop block | Worker threads for A* runs |
| Phase 3: Routing Engine | Constraint sensitivity | M5: Invisible constraint effect | Weight range testing: off=1.0, on=5.0 minimum |
| Phase 3: Routing Engine | Segment data threading | M6: Wrong popup data | Store justification in GeoJSON feature properties |
| Phase 3: Routing Engine | Progress animation | M3: Progress bar lies | Use step labels + streaming, not percentage bars |
| Phase 3: Routing Engine | Error handling | H5: Silent failures | Every async call has explicit fallback behavior |
| Phase 4: PDF Export | Rendering approach | C6: UI thread blocking + WebGL capture failure | Server-side PDF generation only |
| Phase 4: PDF Export | Mock data credibility | N4: Fake-looking contacts | Real patterns, visible "Demo Data" watermark |
| Phase 5: Demo Hardening | Tile loading | M2: Blank map tiles | Pre-warm cache; satellite tiles off |
| Phase 5: Demo Hardening | Environment differences | H3: Works on my machine | Deploy to live URL by hackathon midpoint |
| All phases | Scope creep | H2: Nice-to-have consumes required time | Parking lot discipline; default NO to additions |

---

## Pre-Demo Checklist (Derived from Pitfalls)

The following checks must pass before judges see the demo:

- [ ] All GeoJSON layers are tiled or simplified; map loads in <3 seconds on a cold browser
- [ ] BFS connectivity check on A* graph shows >95% node reachability
- [ ] A*/pathfinding tested with 20 random origin/destination pairs — all return routes
- [ ] All LLM outputs validated: friction scores are 0–1 floats, no coordinates in LLM responses
- [ ] Rate limit budget calculated: worst-case demo scenario stays within API tier limits
- [ ] PDF generated successfully for all three route profiles; map thumbnail is not blank
- [ ] Hover popup shows correct segment justification on every segment of every route
- [ ] Constraint toggles produce visibly different routes for the canonical demo pair
- [ ] Progress animation reflects actual async stages, never shows "done" before result arrives
- [ ] Every failure mode has a visible error state and fallback behavior
- [ ] Deployed to live URL; tested on second machine in different browser
- [ ] Tile cache pre-warmed for the demo venue; hotspot backup ready
- [ ] Pre-generated canonical demo route so first judge interaction is always fast

---

## Sources

- Training knowledge: Mapbox GL JS rendering architecture, GeoJSON source limits, layer ordering behavior (HIGH confidence — core library behavior)
- Training knowledge: Claude API rate limiting behavior, `429` error patterns, streaming API support (HIGH confidence)
- Training knowledge: RAG chunking best practices, embedding retrieval quality, semantic chunking vs. fixed-size (MEDIUM confidence — field evolves rapidly)
- Training knowledge: A* graph construction error patterns, node connectivity checking, worker thread parallelism in Node.js (HIGH confidence)
- Training knowledge: `html2canvas` WebGL capture limitation with Mapbox (HIGH confidence — well-documented browser security constraint)
- Training knowledge: Hackathon failure patterns — integration hell, scope creep, demo machine differences (HIGH confidence — common across all hackathon domains)
- Flag for validation: Specific API rate limit numbers (requests/minute, tokens/minute) — verify against current Claude API tier documentation before building
- Flag for validation: Mapbox Static Images API availability and pricing — verify before relying on it for PDF map thumbnails
