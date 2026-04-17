# Phase 4: PDF Dossier Export - Context

**Gathered:** 2026-04-16
**Status:** Ready for planning

<domain>
## Phase Boundary

Add a server-side PDF export endpoint that converts the fully-generated route data (produced in Phase 3) into a judge-presentable dossier. The "Export PDF Dossier" button in TopNav triggers a POST to Express, which builds and returns a PDF for the currently selected route. No new routing, no new AI panels — Phase 4 is entirely about packaging what Phase 3 already produced.

</domain>

<decisions>
## Implementation Decisions

### PDF Visual Design
- **Color scheme:** White / print-friendly — clean white background, dark text, route colors (`#A7C8FF` / `#FFBC7C` / `#E8B3FF`) used as accent only. Judges can print it without ink problems. Looks like a professional engineering report, not a dark-mode screenshot.
- **Generation library:** Puppeteer (headless Chrome). Render an HTML/CSS template server-side, print to PDF. Full CSS support means flexbox layout, custom fonts (Inter/Manrope via Google Fonts or local), and the map thumbnail image all work naturally. Accepts the ~150MB Chromium binary as a reasonable hackathon tradeoff for visual quality.
- **Template engine:** Handlebars or EJS (Claude's choice) to inject route data into the HTML template before Puppeteer renders it.
- **Structure:** Cover page + running header on all subsequent pages.
  - Cover: Sierra branding, route label (e.g., "Route C — Lowest Regulatory Risk"), export date, full-width map thumbnail.
  - Running header (pages 2+): slim bar with route label + page number.

### Section Order (Story Arc)
Pages flow as a narrative judges can read linearly:
1. **Page 1:** LLM narrative intro + map thumbnail (cover)
2. **Page 2:** Route metrics + Sierra Recommends rationale
3. **Page 3:** Environmental Trigger summary + Sierra Alerts risk flag
4. **Page 4:** Inline Project Summary phase timeline
5. **Page 5:** Per-segment justifications
6. **Page 6:** Mock land parcel owner contacts

### LLM Narrative Introduction
- **When generated:** Pre-generated alongside routes in Phase 3's `Promise.all` batch — add `POST /api/narrative` to the same parallel call set as `/api/recommend`, `/api/triggers`, `/api/alerts`, `/api/summary`. Export is instant — no Claude call at export time.
- **Content emphasis:** Full planning story across 3 paragraphs:
  - Para 1: Context and goal (what this transmission project is, why it's needed)
  - Para 2: Why this specific route was chosen over the alternatives (constraint tradeoffs, regulatory advantages)
  - Para 3: Key risks and mitigations for this corridor
- **Stored in Zustand:** Narrative result added to AppState alongside other agentic panel content (same pattern as `RouteRecommendation`, `SierraAlert`, etc.).
- **Canned fallback:** One pre-written narrative set (referencing Reeves County, Edwards Aquifer, Nolan County, US-385 corridor) fills in seamlessly if Claude API is unavailable — same silent fallback pattern as Phase 3.

### Map Thumbnail
- **API:** Mapbox Static Images API (locked by PDF-04 — not html2canvas).
- **Content:** Selected route only — the exported route at full opacity. No other routes shown.
- **Viewport:** Auto-fit to route bounding box with padding (`bbox` parameter). Zoomed to the corridor level so judges can see real terrain and county context.
- **Style:** Satellite (`satellite-streets-v12`) — photogenic, shows real Texas geography, impressive in a white PDF.
- **Fetch timing:** Fetched server-side inside the Express PDF endpoint (not pre-fetched). Express has the route geometry, fetches the static image, embeds it in the Puppeteer HTML template as a base64 data URI.

### Mock Contacts
- **Count:** 8–10 contacts per route export.
- **Route-specific:** Each route has a different set of landowners corresponding to its geographic corridor (Route A crosses different parcels than Route C). Stored as static mock data in the server (e.g., `server/data/mock-contacts.ts`), keyed by route ID (`'A' | 'B' | 'C'`).
- **Fields per contact:** Owner name, county, parcel acreage, parcel type (e.g., "Private Ranch", "Agricultural"), contact phone/email (mock values).
- **Presentation:** Table layout in the PDF — owner name, county, acreage, type, phone/email.
- **No ROW status field** — keep the table clean; status tracking is out of scope.

### PDF Endpoint
- **Route:** `POST /api/export/pdf`
- **Request body:** `{ routeId: 'A' | 'B' | 'C' }` — server reads all needed content from the pre-generated state passed by the client (route metrics, narrative, triggers, alerts, timeline, segment justifications).
- **Response:** PDF buffer with `Content-Type: application/pdf` + `Content-Disposition: attachment; filename="sierra-dossier-route-{id}.pdf"`
- **Client trigger:** TopNav "Export PDF" button calls the endpoint with the currently selected route ID, receives the buffer, triggers a browser download.

### Claude's Discretion
- Exact Handlebars vs EJS template choice
- CSS details within the white PDF template (font sizes, spacing, table styling)
- How route geometry bounding box is computed for the Mapbox Static API bbox parameter
- Puppeteer launch options (headless: 'new', timeout settings)
- Whether narrative is added to existing `AppState` type or a separate `narrativeByRoute` map

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/components/TopNav/TopNav.tsx` — "Export PDF" button already exists in top nav (Phase 1); Phase 4 wires up the onClick handler
- `src/types.ts` — `RouteResult`, `RouteRecommendation`, `EnvironmentalTrigger`, `SierraAlert`, `ProjectSummary` all defined; PDF draws from these directly
- `src/store/useAppStore.ts` — Zustand store holds `routes`, `recommendation`, `triggers`, `alerts`, `projectSummary`; Phase 4 adds `narrative` field
- Express server at `localhost:3001` (established Phase 2) — Phase 4 adds `/api/narrative` and `/api/export/pdf` routes
- `/api/recommend`, `/api/triggers`, `/api/alerts`, `/api/summary` (Phase 3) — narrative call joins this same parallel batch

### Established Patterns
- Silent Claude API fallback: try live call, catch → canned text, no user-visible indicator
- Zustand as single source of truth; all agentic panel content flows through store
- Vite proxy `/api/*` → Express port 3001
- TypeScript throughout; `server/data/` for static mock data files
- Phase 3's `Promise.all` parallel call pattern is the established way to fire multiple Claude calls at route generation time

### Integration Points
- TopNav "Export PDF" button → `POST /api/export/pdf` with selected route ID
- Express PDF endpoint reads: route geometry (for Mapbox bbox), narrative/metrics/triggers/alerts/summary (from client request body or server-side state), mock contacts (from `server/data/mock-contacts.ts`)
- Mapbox Static Images API called server-side (requires `MAPBOX_TOKEN` env var in Express)
- Puppeteer renders HTML template → returns PDF buffer → client triggers download
- `POST /api/narrative` added to Phase 3's Promise.all batch; result stored in Zustand under new `narrative` field

</code_context>

<specifics>
## Specific Ideas

- The PDF should feel like a document a real transmission planner would hand to a county commissioner — professional, not a screenshot of the app
- White background is intentional even though the app is dark: this is a take-home artifact, not a UI component
- Narrative paragraphs should reference real Texas location names (Reeves County, Edwards Aquifer, Nolan County, US-385 corridor) for credibility — consistent with the friction justifications and canned content established in Phase 3

</specifics>

<deferred>
## Deferred Ideas

- None — discussion stayed within phase scope

</deferred>

---

*Phase: 04-pdf-dossier-export*
*Context gathered: 2026-04-16*
