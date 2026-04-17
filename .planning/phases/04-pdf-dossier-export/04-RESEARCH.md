# Phase 4: PDF Dossier Export - Research

**Researched:** 2026-04-16
**Domain:** Server-side PDF generation (Puppeteer), EJS templating, Mapbox Static Images API, Express endpoint design
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**PDF Visual Design**
- Color scheme: White / print-friendly — clean white background, dark text, route colors (`#A7C8FF` / `#FFBC7C` / `#E8B3FF`) used as accent only. Judges can print it without ink problems.
- Generation library: Puppeteer (headless Chrome). Render an HTML/CSS template server-side, print to PDF.
- Template engine: Handlebars or EJS (Claude's choice) to inject route data into the HTML template.
- Structure: Cover page + running header on all subsequent pages.
  - Cover: Sierra branding, route label, export date, full-width map thumbnail.
  - Running header (pages 2+): slim bar with route label + page number.

**Section Order (Story Arc)**
1. Page 1: LLM narrative intro + map thumbnail (cover)
2. Page 2: Route metrics + Sierra Recommends rationale
3. Page 3: Environmental Trigger summary + Sierra Alerts risk flag
4. Page 4: Inline Project Summary phase timeline
5. Page 5: Per-segment justifications
6. Page 6: Mock land parcel owner contacts

**LLM Narrative Introduction**
- Pre-generated alongside routes in Phase 3's `Promise.all` batch — add `POST /api/narrative` to parallel call set.
- Stored in Zustand alongside other agentic panel content.
- Canned fallback: one pre-written narrative referencing Reeves County, Edwards Aquifer, Nolan County, US-385 corridor.

**Map Thumbnail**
- API: Mapbox Static Images API (locked — not html2canvas).
- Content: Selected route only at full opacity, other routes excluded.
- Viewport: Auto-fit to route bounding box with padding (`bbox` parameter).
- Style: Satellite (`satellite-streets-v12`) — photogenic Texas geography.
- Fetch timing: Fetched server-side inside Express PDF endpoint; embedded as base64 data URI.

**Mock Contacts**
- Count: 8–10 contacts per route export.
- Route-specific: Each route has a different contact set keyed by route ID.
- Storage: `server/data/mock-contacts.ts` keyed by `'A' | 'B' | 'C'`.
- Fields: owner name, county, parcel acreage, parcel type, contact phone/email (mock values).
- Presentation: Table layout in PDF. No ROW status field.

**PDF Endpoint**
- Route: `POST /api/export/pdf`
- Request body: `{ routeId: 'A' | 'B' | 'C' }` plus pre-generated agentic content from client.
- Response: PDF buffer with `Content-Type: application/pdf` + `Content-Disposition: attachment; filename="sierra-dossier-route-{id}.pdf"`
- Client trigger: TopNav "Export PDF" button with currently selected route ID; receives buffer; triggers browser download.

### Claude's Discretion
- Exact Handlebars vs EJS template choice
- CSS details within the white PDF template (font sizes, spacing, table styling)
- How route geometry bounding box is computed for the Mapbox Static API bbox parameter
- Puppeteer launch options (headless: true, timeout settings)
- Whether narrative is added to existing `AppState` type or a separate `narrativeByRoute` map

### Deferred Ideas (OUT OF SCOPE)
- None — discussion stayed within phase scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| PDF-01 | "Export PDF Dossier" button always visible; exports currently selected route | TopNav button already exists (disabled); Phase 4 wires onClick with selectedRoute from Zustand + fetch to POST /api/export/pdf |
| PDF-02 | PDF generated server-side (not client-side) to avoid WebGL canvas capture limitations | Puppeteer on Express server: page.setContent() + page.pdf() returns buffer; no client-side canvas capture needed |
| PDF-03 | PDF includes: narrative intro, route profile, metrics, Sierra Recommends rationale, env triggers, project timeline, Sierra Alerts, segment justifications, mock contacts, regulatory jurisdictions | EJS template renders all Phase 3 data types (RouteResult, RouteRecommendation, EnvironmentalTrigger, SierraAlert, ProjectSummary) already defined in types.ts; contacts from static mock-contacts.ts |
| PDF-04 | Map thumbnail via Mapbox Static Images API (not html2canvas) | Server-side fetch to `https://api.mapbox.com/styles/v1/mapbox/satellite-streets-v12/static/{overlay}/{bbox}/{width}x{height}?access_token=...`; response as base64 data URI embedded in HTML template |
</phase_requirements>

---

## Summary

Phase 4 is an Express-only backend phase with a thin client-side trigger. The three core technical problems are: (1) generating a multi-page, print-quality PDF from an HTML/EJS template using Puppeteer, (2) fetching a satellite map thumbnail server-side via the Mapbox Static Images API and embedding it as a base64 data URI in the HTML before rendering, and (3) wiring the TopNav "Export PDF" button to POST the currently selected route's pre-generated content to the new endpoint and trigger a browser download.

The technology choices are all locked. EJS is the recommended template engine (over Handlebars) because `ejs.render(str, data)` operates on a raw HTML string without requiring a view engine setup — clean for a single-endpoint PDF workflow that doesn't need Express view rendering. Puppeteer v24 (latest stable) launches headless Chrome, calls `page.setContent(html, { waitUntil: 'networkidle0' })`, and returns a Buffer from `page.pdf()` without writing to disk. The Mapbox Static Images API accepts a `bbox` parameter derived from the route's LineString coordinates and a `path` or `geojson` overlay of the route geometry — fetched by the Express endpoint before rendering the EJS template.

The narrative introduction (`POST /api/narrative`) is the only new Claude API call in Phase 4, and it joins Phase 3's parallel batch at route generation time — not at export time. By the time a judge clicks "Export PDF", all content is already in Zustand and is passed in the POST body to the PDF endpoint. The endpoint is entirely synchronous: fetch Mapbox image → render EJS → Puppeteer PDF → return buffer.

**Primary recommendation:** Use EJS (`ejs.render()`) for the HTML template, Puppeteer with `headless: true` and `--no-sandbox --disable-dev-shm-usage` args, browser instance reuse (singleton pattern), and the Mapbox Static Images API with `@mapbox/polyline` to encode the route geometry for the overlay path.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `puppeteer` | 24.x (latest) | Headless Chrome PDF generation | Industry standard for HTML→PDF with full CSS support; returns Buffer directly without disk I/O when `path` omitted |
| `ejs` | 3.x | HTML templating for PDF content | Minimal API — `ejs.render(str, data)` on a string; no view engine wiring needed; works directly with Puppeteer `setContent` pattern |
| `@mapbox/polyline` | 1.x | Encode route LineString coordinates to polyline format | Official Mapbox library; `polyline.fromGeoJSON()` converts LineString GeoJSON to encoded polyline for Static Images API path overlay |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Node.js built-in `https` / `fetch` | Node 18+ | Fetch Mapbox Static Image as binary buffer | Server-side only; use `fetch()` with `arrayBuffer()` response and convert to base64 |
| `@anthropic-ai/sdk` | Already installed | `POST /api/narrative` Claude call | New endpoint following the exact canned-fallback pattern from Phase 3 |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `ejs` | Handlebars | Both work; EJS chosen because `ejs.render(htmlString, data)` operates on a raw string with no setup — Handlebars requires `Handlebars.compile()` which is equivalent but more verbose for a single-file template |
| `puppeteer` | `puppeteer-core` | `puppeteer-core` is smaller but requires providing Chrome executable path; full `puppeteer` bundles Chromium automatically — acceptable for a hackathon server |
| `@mapbox/polyline` | Custom encoder | Polyline encoding has precision/offset arithmetic that is easy to get wrong; official library is 1 dependency, zero risk |
| Puppeteer multi-page via `page-break-after` CSS | Separate Puppeteer page per section | CSS page breaks are simpler and standard — one Puppeteer page generates the multi-page PDF |

**Installation (server directory):**
```bash
cd server && npm install puppeteer ejs @mapbox/polyline
```

---

## Architecture Patterns

### Recommended Project Structure (Phase 4 additions)
```
server/
├── src/
│   ├── routes/
│   │   └── api.ts               # Extend: POST /api/narrative, POST /api/export/pdf
│   ├── pdf/
│   │   ├── pdfGenerator.ts      # NEW: Puppeteer singleton + generatePdf(data) function
│   │   ├── template.ejs         # NEW: Full HTML/CSS template for dossier
│   │   └── buildMapboxUrl.ts    # NEW: Compute bbox + encode route as polyline → Static API URL
│   ├── data/
│   │   ├── mock-contacts.ts     # NEW: Contact records keyed by 'A' | 'B' | 'C'
│   │   └── canned-narrative.ts  # NEW: Per-route fallback narrative strings
│   └── __tests__/
│       ├── pdfGenerator.test.ts # NEW: Wave 0 test scaffold
│       └── buildMapboxUrl.test.ts  # NEW: Wave 0 test scaffold
src/
├── components/
│   └── TopNav/
│       └── TopNav.tsx           # Extend: wire onClick + useExportPdf hook
├── hooks/
│   └── useExportPdf.ts          # NEW: POST /api/export/pdf → trigger download
└── types.ts                     # Extend: add NarrativeByRoute type + narrative field to AppStore
```

### Pattern 1: EJS + Puppeteer PDF Flow
**What:** Render an EJS template string with route data into HTML, then pass to Puppeteer for PDF output.
**When to use:** `POST /api/export/pdf` handler.

```typescript
// Source: ejs.co official docs + Puppeteer pptr.dev docs
import ejs from 'ejs';
import puppeteer from 'puppeteer';
import fs from 'fs/promises';
import path from 'path';

// Singleton browser instance — launch once at server startup
let browser: puppeteer.Browser | null = null;

async function getBrowser() {
  if (!browser) {
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
      ],
    });
  }
  return browser;
}

export async function generatePdf(templateData: PdfTemplateData): Promise<Buffer> {
  const templateStr = await fs.readFile(
    path.join(__dirname, 'template.ejs'),
    'utf-8'
  );
  const html = ejs.render(templateStr, templateData);

  const b = await getBrowser();
  const page = await b.newPage();

  try {
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: '<span></span>', // empty — cover page has its own header
      footerTemplate: `
        <div style="font-size:9px;font-family:Inter,sans-serif;color:#888;
                    width:100%;padding:0 40px;box-sizing:border-box;
                    display:flex;justify-content:space-between;">
          <span>Sierra — Illustrative data only</span>
          <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
        </div>`,
      margin: { top: '60px', bottom: '50px', left: '40px', right: '40px' },
    });
    return pdfBuffer as Buffer;
  } finally {
    await page.close(); // always close page, never browser
  }
}
```

### Pattern 2: Mapbox Static Image — Server-Side Fetch
**What:** Compute bbox from route LineString, encode route geometry as polyline, build Static Images API URL, fetch binary response, convert to base64 data URI.
**When to use:** Inside `POST /api/export/pdf` before calling EJS render.

```typescript
// Source: docs.mapbox.com/api/maps/static-images/ + @mapbox/polyline README
import polyline from '@mapbox/polyline';
import type { LineString } from 'geojson';

export function buildMapboxStaticUrl(
  geometry: LineString,
  accessToken: string
): string {
  const coords = geometry.coordinates as [number, number][];

  // Compute bbox: [minLng, minLat, maxLng, maxLat]
  const lngs = coords.map(c => c[0]);
  const lats = coords.map(c => c[1]);
  const bbox = [
    Math.min(...lngs) - 0.05,  // padding ~5km
    Math.min(...lats) - 0.05,
    Math.max(...lngs) + 0.05,
    Math.max(...lats) + 0.05,
  ].join(',');

  // Encode route as polyline overlay
  // @mapbox/polyline expects [lat, lng] pairs (note: reversed from GeoJSON [lng, lat])
  const latLngPairs = coords.map(c => [c[1], c[0]] as [number, number]);
  const encoded = polyline.encode(latLngPairs);
  const pathOverlay = `path-3+A7C8FF-1(${encodeURIComponent(encoded)})`;

  // satellite-streets-v12 with mapbox username
  const url = new URL(
    `https://api.mapbox.com/styles/v1/mapbox/satellite-streets-v12/static/${pathOverlay}/[${bbox}]/800x500@2x`
  );
  url.searchParams.set('access_token', accessToken);
  return url.toString();
}

export async function fetchMapboxThumbnail(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Mapbox Static API error: ${res.status}`);
  const buf = await res.arrayBuffer();
  const base64 = Buffer.from(buf).toString('base64');
  return `data:image/png;base64,${base64}`;
}
```

### Pattern 3: Express PDF Endpoint
**What:** Receive route ID + pre-generated content, build PDF, respond with buffer and download headers.
**When to use:** `POST /api/export/pdf` route.

```typescript
// Source: Express official docs + Puppeteer buffer pattern
app.post('/api/export/pdf', async (req, res) => {
  try {
    const { routeId, route, recommendation, triggers, alerts, projectSummary, narrative } = req.body;

    // Fetch map thumbnail server-side
    const mapUrl = buildMapboxStaticUrl(route.geometry, process.env.MAPBOX_TOKEN!);
    const mapThumbnail = await fetchMapboxThumbnail(mapUrl).catch(() => '');
    // mapThumbnail is '' if Mapbox fetch fails — template shows placeholder

    const contacts = mockContacts[routeId as 'A' | 'B' | 'C'];

    const pdfBuffer = await generatePdf({
      route, recommendation, triggers, alerts, projectSummary,
      narrative, contacts, mapThumbnail, exportDate: new Date().toLocaleDateString(),
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="sierra-dossier-route-${routeId}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.send(pdfBuffer);
  } catch (err) {
    console.error('PDF generation error:', err);
    res.status(500).json({ error: 'PDF generation failed' });
  }
});
```

### Pattern 4: Client-Side Download Trigger
**What:** POST to `/api/export/pdf`, receive blob, create object URL, click synthetic anchor to download.
**When to use:** `useExportPdf` hook called by TopNav button.

```typescript
// Source: MDN Blob + createObjectURL pattern
export function useExportPdf() {
  const routes = useAppStore(s => s.routes);
  const selectedRoute = useAppStore(s => s.selectedRoute);
  const recommendation = useAppStore(s => s.recommendation);
  // ... other store fields

  return async function exportPdf() {
    const route = routes?.find(r => r.id === selectedRoute);
    if (!route) return;

    const res = await fetch('/api/export/pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        routeId: route.id,
        route,
        recommendation,
        triggers,
        alerts,
        projectSummary,
        narrative,
      }),
    });

    if (!res.ok) return; // silent fail for demo

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sierra-dossier-route-${route.id}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  };
}
```

### Pattern 5: Narrative Endpoint (joins Phase 3 parallel batch)
**What:** New Claude API endpoint following exact Phase 3 canned-fallback pattern. Client calls it alongside `/api/recommend`, `/api/triggers` etc. in `Promise.all`.
**When to use:** `POST /api/narrative` — called at route generation time, not at export time.

```typescript
// Source: Phase 3 established pattern (see 03-RESEARCH.md Pattern 3 and canned fallback)
app.post('/api/narrative', async (req, res) => {
  const { routeId, routeLabel, constraints } = req.body;
  try {
    const message = await anthropic.messages.create({
      model: 'claude-opus-4-7',
      max_tokens: 600,
      messages: [{
        role: 'user',
        content: buildNarrativePrompt(routeId, routeLabel, constraints),
      }],
    });
    const text = message.content[0].type === 'text' ? message.content[0].text : '';
    res.json({ narrative: text });
  } catch {
    res.json({ narrative: CANNED_NARRATIVES[routeId] }); // silent fallback
  }
});
```

### Pattern 6: EJS Multi-Page Template with CSS Page Breaks
**What:** Single EJS file renders full HTML document. CSS `page-break-before` / `break-before: page` divides it into Puppeteer pages.
**When to use:** `server/src/pdf/template.ejs`

```html
<!-- Source: CSS paged media spec — MDN @page -->
<style>
  @page { margin: 0; }  /* margins handled in page.pdf() options */
  body { font-family: Inter, Manrope, sans-serif; background: #fff; color: #1a1a1a; }
  .page { page-break-after: always; padding: 40px; min-height: 100vh; box-sizing: border-box; }
  .page:last-child { page-break-after: auto; }

  /* Cover page */
  .cover { display: flex; flex-direction: column; }
  .cover-map { width: 100%; height: 320px; object-fit: cover; border-radius: 6px; }

  /* Running header (pages 2+) — Puppeteer headerTemplate handles this */
  .section-title { font-size: 13px; font-weight: 700; text-transform: uppercase;
                   letter-spacing: 0.08em; color: #555; margin-bottom: 16px; }
  table { width: 100%; border-collapse: collapse; font-size: 11px; }
  th { background: #f5f5f5; padding: 8px; text-align: left; font-weight: 600; }
  td { padding: 7px 8px; border-bottom: 1px solid #eee; }

  /* Route color accents */
  .accent-A { color: #5B9BD5; }  /* #A7C8FF darkened for print legibility */
  .accent-B { color: #D48A2A; }  /* #FFBC7C darkened */
  .accent-C { color: #9B6BBF; }  /* #E8B3FF darkened */
</style>

<!-- Page 1: Cover -->
<div class="page cover">
  <h1>Sierra Transmission Routing Analysis</h1>
  <h2 class="accent-<%= route.id %>"><%= route.label %></h2>
  <p>Export date: <%= exportDate %></p>
  <img class="cover-map" src="<%= mapThumbnail %>" alt="Route map thumbnail" />
  <div class="narrative"><%- narrative %></div>
</div>

<!-- Page 2: Metrics + Recommendation -->
<div class="page">
  <div class="section-title">Route Profile & Metrics</div>
  <!-- metrics table, recommendation rationale -->
</div>
<!-- ... remaining pages ... -->
```

### Anti-Patterns to Avoid
- **Launching Puppeteer per request:** Chrome startup costs 2–4 seconds. Reuse a module-level singleton browser instance; only open/close `Page` per request.
- **Setting `path` in `page.pdf()` options on a server:** Writing to disk requires temp file management and cleanup; omit `path` to receive Buffer directly.
- **Passing GeoJSON LineString directly to Mapbox Static API overlay:** The URL character limit is 8,192. A long route with many coordinates will exceed 2,083-character overlay limit. Use polyline encoding (via `@mapbox/polyline`) to compress coordinates — it reduces URL length by ~50% vs raw GeoJSON.
- **Using `satellite-streets-v12` via Mapbox Standard style ID format:** The Static Images API is not compatible with Mapbox Standard/Standard Satellite styles. Use `mapbox/satellite-streets-v12` (classic style) with the `mapbox` account username.
- **Calling `fetchMapboxThumbnail` at PDF export time without fallback:** Mapbox API may be rate-limited or unavailable. Always catch the fetch error and pass an empty string to the template; show a placeholder div instead of breaking PDF generation.
- **Using `waitUntil: 'domcontentloaded'` when template embeds base64 image:** Use `'networkidle0'` — the base64 image is data: URI so no network call, but `networkidle0` is safer and handles any Google Font CDN calls if fonts are loaded externally. Alternatively, embed fonts as base64 in `<style>` to avoid network dependency entirely.
- **`displayHeaderFooter` templates with external fonts:** Puppeteer renders header/footer in a separate frame; external font references do not load there. Use only system fonts or inline base64 fonts in `headerTemplate`/`footerTemplate`.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| HTML to PDF rendering | Custom wkhtmltopdf wrapper, jsPDF manual drawing | Puppeteer `page.pdf()` | jsPDF requires programmatic layout (no CSS); wkhtmltopdf is outdated and requires system binary; Puppeteer supports flexbox, custom fonts, page breaks via CSS |
| Polyline encoding | Custom encoder from GeoJSON coordinates | `@mapbox/polyline` `fromGeoJSON()` | Polyline encoding uses a specific signed integer delta + ASCII offset algorithm — trivial to introduce an off-by-one; official library has 100% test coverage |
| PDF download trigger | File save dialog API, `window.open()` | `URL.createObjectURL` + synthetic anchor `.click()` | `window.open()` is blocked by popup blockers; synthetic anchor download works cross-browser without blocking |
| Multi-page PDF sections | Multiple Puppeteer page renders stitched together | CSS `page-break-before: always` / `break-before: page` | CSS paged media is the standard; Puppeteer honors it natively in `page.pdf()` |

**Key insight:** Every piece of Phase 4 is a thin integration layer over proven primitives. The engineering risk is entirely in correctness (base64 image embed, polyline encoding, URL length) not in choosing custom algorithms.

---

## Common Pitfalls

### Pitfall 1: Mapbox Static API URL Exceeds 8,192-Character Limit
**What goes wrong:** A route LineString with 200+ coordinate pairs encoded as raw GeoJSON in the overlay parameter will exceed Mapbox's URL character limit, returning a 400 error.
**Why it happens:** GeoJSON coordinates are verbose (`[[-104.1234,31.5678],...]`). A route with 300 nodes at 20 chars/pair = 6,000 chars just for coordinates.
**How to avoid:** Always use `@mapbox/polyline` to encode the geometry before building the URL. Polyline encoding is ~50% more compact than raw GeoJSON. If the polyline is still too long, downsample the route geometry: take every Nth coordinate to reduce points while preserving shape.
**Warning signs:** 400 response from Mapbox Static API; mapThumbnail blank in PDF.

### Pitfall 2: Puppeteer Browser Not Closed on Server Crash
**What goes wrong:** Server restart leaves orphaned Chrome processes consuming RAM.
**Why it happens:** The singleton browser pattern only calls `browser.launch()` once; `process.on('exit')` cleanup not registered.
**How to avoid:** Register cleanup in `server/index.ts`:
```typescript
process.on('exit', () => browser?.close());
process.on('SIGINT', () => { browser?.close(); process.exit(); });
```
**Warning signs:** `ps aux | grep chrome` shows multiple Chrome processes after server restarts during development.

### Pitfall 3: EJS Template Renders `undefined` for Missing Zustand Fields
**What goes wrong:** Phase 3 adds `recommendation`, `triggers`, etc. to Zustand. Phase 4 adds `narrative`. If the client sends the POST before narrative is populated (e.g., Claude API was slow), the template crashes or renders `undefined`.
**Why it happens:** EJS renders `<%= variable %>` as the string `"undefined"` — no crash, but visible "undefined" text in the PDF.
**How to avoid:** Use defensive defaults in the EJS template data object passed to `ejs.render()`. Always coalesce: `narrative: narrativeFromBody || CANNED_NARRATIVES[routeId]`. Server is the last line of defense — never trust the client payload to be complete.
**Warning signs:** "undefined" appearing in rendered PDF sections.

### Pitfall 4: Puppeteer `displayHeaderFooter` Footer Overlaps Content
**What goes wrong:** Page content is cropped or overlaps the running footer because `margin.bottom` in `page.pdf()` is not large enough for the footer template's rendered height.
**Why it happens:** Puppeteer renders `headerTemplate`/`footerTemplate` outside the page margin; if `margin.bottom` is `'20px'` and the footer is `30px` tall, it overlaps.
**How to avoid:** Set `margin.bottom: '50px'` minimum when using `displayHeaderFooter: true`. The footer template itself should be `font-size: 9px` — small enough to fit in 50px.
**Warning signs:** Last line of content on each page appears cut off; footer not visible.

### Pitfall 5: `waitUntil: 'networkidle0'` Times Out When Google Fonts Is Blocked
**What goes wrong:** The EJS template references Google Fonts (`@import url('https://fonts.googleapis.com/...')`). In a network-restricted CI/CD or demo environment, the font request never resolves, causing `networkidle0` to time out (default 30s).
**Why it happens:** `networkidle0` waits for 500ms of zero network connections. A pending font request keeps the count above zero indefinitely.
**How to avoid:** Embed fonts as base64 data URIs in `<style>` tags within the EJS template. This ensures zero external network calls during Puppeteer rendering, making `networkidle0` resolve instantly.
**Warning signs:** PDF generation takes 30+ seconds; Puppeteer timeout errors in server logs.

### Pitfall 6: `@mapbox/polyline` Coordinate Order (lat,lng vs lng,lat)
**What goes wrong:** GeoJSON stores coordinates as `[lng, lat]`. `@mapbox/polyline.encode()` expects `[lat, lng]` pairs (Google Maps convention). Passing GeoJSON coordinates directly produces an inverted route on the map thumbnail.
**Why it happens:** Different geospatial standards (GeoJSON = `[x, y]` = `[lng, lat]`; polyline = `[lat, lng]`).
**How to avoid:** Always swap coordinates when calling `polyline.encode()`:
```typescript
const latLngPairs = coords.map(c => [c[1], c[0]] as [number, number]);
polyline.encode(latLngPairs);
```
Alternatively, use `polyline.fromGeoJSON(lineStringFeature)` which handles the swap internally.
**Warning signs:** Map thumbnail shows route in the wrong geographic location (mirrored or in ocean).

---

## Code Examples

### Complete Express PDF Endpoint
```typescript
// Source: Puppeteer pptr.dev + Express docs + pattern derived from Phase 3 API structure
app.post('/api/export/pdf', async (req, res) => {
  const { routeId, route, recommendation, triggers, alerts, projectSummary, narrative } = req.body;

  try {
    // 1. Fetch Mapbox static image (server-side, no CORS issue)
    const mapUrl = buildMapboxStaticUrl(route.geometry, process.env.MAPBOX_TOKEN ?? '');
    const mapThumbnail = await fetchMapboxThumbnail(mapUrl).catch(() => '');

    // 2. Get route-specific mock contacts
    const contacts = mockContacts[routeId as 'A' | 'B' | 'C'] ?? [];

    // 3. Render EJS + generate PDF
    const buffer = await generatePdf({
      route,
      recommendation,
      triggers: triggers ?? [],
      alerts,
      projectSummary,
      narrative: narrative || CANNED_NARRATIVES[routeId as 'A' | 'B' | 'C'],
      contacts,
      mapThumbnail,
      exportDate: new Date().toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric',
      }),
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition',
      `attachment; filename="sierra-dossier-route-${routeId}.pdf"`);
    res.setHeader('Content-Length', buffer.length);
    res.send(buffer);
  } catch (err) {
    console.error('[PDF] generation error:', err);
    res.status(500).json({ error: 'PDF generation failed' });
  }
});
```

### Mapbox URL Builder with Polyline Encoding
```typescript
// Source: @mapbox/polyline README (github.com/mapbox/polyline) + Mapbox Static API docs
import polyline from '@mapbox/polyline';
import type { LineString } from 'geojson';

export function buildMapboxStaticUrl(geometry: LineString, token: string): string {
  const coords = geometry.coordinates as [number, number][];

  // bbox with padding
  const lngs = coords.map(c => c[0]);
  const lats = coords.map(c => c[1]);
  const pad = 0.05;
  const bbox = `[${Math.min(...lngs) - pad},${Math.min(...lats) - pad},${Math.max(...lngs) + pad},${Math.max(...lats) + pad}]`;

  // Downsample if too many points (keep every 3rd)
  const sampledCoords = coords.filter((_, i) => i % 3 === 0 || i === coords.length - 1);
  const encoded = polyline.encode(sampledCoords.map(c => [c[1], c[0]]));
  const pathOverlay = `path-3+A7C8FF(${encodeURIComponent(encoded)})`;

  return `https://api.mapbox.com/styles/v1/mapbox/satellite-streets-v12/static/${pathOverlay}/${bbox}/800x500@2x?access_token=${token}`;
}
```

### TopNav Export Button — Wired onClick
```typescript
// Source: derived from existing TopNav.tsx (src/components/TopNav/TopNav.tsx)
// TopNav button currently: disabled, opacity 0.4, cursor not-allowed
// Phase 4: enable when simulationStatus === 'complete', call useExportPdf

const exportPdf = useExportPdf();
const simulationStatus = useAppStore(s => s.simulationStatus);
const isReady = simulationStatus === 'complete';

<button
  onClick={isReady ? exportPdf : undefined}
  disabled={!isReady}
  style={{
    // ... existing styles ...
    cursor: isReady ? 'pointer' : 'not-allowed',
    opacity: isReady ? 1 : 0.4,
  }}
>
  EXPORT PDF
</button>
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `wkhtmltopdf` system binary | Puppeteer headless Chrome | ~2018 | Puppeteer supports modern CSS (flexbox, grid, CSS variables); wkhtmltopdf uses outdated WebKit |
| `jsPDF` programmatic drawing | HTML/CSS + Puppeteer | ~2019 | No more manual `doc.text(x, y, str)` calls; design in HTML/CSS, render with browser engine |
| `html2canvas` + jsPDF (client-side) | Server-side Puppeteer | Ongoing | html2canvas cannot capture WebGL (Mapbox) and produces rasterized text; Puppeteer produces real vector PDF |
| `EventSource` or plain `res.download()` | `URL.createObjectURL` + synthetic anchor | ~2020 | `res.download()` via Express works; client-side blob URL gives progress control |
| `headless: 'new'` (Puppeteer v21-22 syntax) | `headless: true` (Puppeteer v22+) | v22, 2024 | `headless: 'new'` is now the default behavior of `headless: true`; the string form is deprecated |

**Deprecated/outdated:**
- `headless: 'new'` string: Deprecated since Puppeteer v22; use `headless: true` (boolean).
- `page.waitForNavigation()` after `setContent()`: Not needed; `setContent()` accepts `waitUntil` directly.

---

## Open Questions

1. **Server directory structure from Phase 3**
   - What we know: Phase 3 plans reference `server/src/routes/api.ts`, `server/src/__tests__/`, `server/package.json`; server directory does not yet exist in filesystem (confirmed by `ls` — no `server/` dir at root).
   - What's unclear: Whether Phase 3 will have fully created the server scaffolding before Phase 4 begins; if not, Phase 4 Wave 0 must create `server/package.json` + dependencies.
   - Recommendation: Phase 4 Wave 0 task must verify that `server/` exists and that `puppeteer`, `ejs`, `@mapbox/polyline` are installed; create server scaffold if needed.

2. **`narrative` field storage in Zustand / AppState**
   - What we know: CONTEXT.md says to store narrative in Zustand "alongside other agentic panel content"; `types.ts` currently has no `narrative` field; `useAppStore.ts` does not include it.
   - What's unclear: Whether to add `narrativeByRoute: Record<'A'|'B'|'C', string>` to AppState (symmetric with other per-route data) or a flat `narrative: string` tied to the selected route.
   - Recommendation: Use `narrativeByRoute: Record<'A'|'B'|'C', string>` — consistent with how `recommendation`, `triggers`, `alerts` are structured; allows export of any route's narrative without re-fetching.

3. **Mapbox Static API rate limits**
   - What we know: Standard Mapbox token includes 50,000 static image requests/month free.
   - What's unclear: Whether the hackathon demo token has any lower limits.
   - Recommendation: Not a concern for demo scale; one request per "Export PDF" click. No caching needed.

---

## Validation Architecture

> nyquist_validation is enabled (`workflow.nyquist_validation: true` in config.json).

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.4 |
| Config file | `vitest.config.ts` (root, jsdom) + `server/` will have its own vitest config from Phase 3 |
| Quick run command | `npx vitest run --reporter=dot` (root) / `cd server && npx vitest run --reporter=dot` |
| Full suite command | `npx vitest run && cd server && npx vitest run` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PDF-01 | "Export PDF" button enabled when simulationStatus === 'complete' | unit | `npx vitest run src/components/TopNav/TopNav.test.tsx` | ❌ Wave 0 |
| PDF-02 | `POST /api/export/pdf` returns Buffer with correct Content-Type header | integration | manual — requires Puppeteer; smoke-test only in CI | manual-only |
| PDF-03 | `generatePdf()` called with all required data fields; EJS template renders without `undefined` strings | unit | `cd server && npx vitest run src/__tests__/pdfGenerator.test.ts` | ❌ Wave 0 |
| PDF-04 | `buildMapboxStaticUrl()` produces valid URL with correct bbox, polyline overlay, and satellite-streets-v12 style | unit | `cd server && npx vitest run src/__tests__/buildMapboxUrl.test.ts` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `cd server && npx vitest run --reporter=dot`
- **Per wave merge:** `npx vitest run && cd server && npx vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/components/TopNav/TopNav.test.tsx` — covers PDF-01 (button enabled/disabled by simulationStatus)
- [ ] `server/src/__tests__/pdfGenerator.test.ts` — covers PDF-03 (generatePdf data contract + template render)
- [ ] `server/src/__tests__/buildMapboxUrl.test.ts` — covers PDF-04 (URL structure, bbox calculation, polyline encoding, coordinate swap)
- [ ] Dependencies: `cd server && npm install puppeteer ejs @mapbox/polyline @types/ejs` — not yet installed
- [ ] `server/src/__tests__/narrative.test.ts` — canned narrative fallback shape validation (same pattern as Phase 3 `cannedFallback.test.ts`)

*(PDF-02 is manual-only: Puppeteer with headless Chrome cannot run in jsdom; actual PDF binary output requires a full integration smoke test during demo validation.)*

---

## Sources

### Primary (HIGH confidence)
- Puppeteer official docs — https://pptr.dev/ — confirmed `headless: true` (v22+ syntax), `page.setContent(html, { waitUntil })`, `page.pdf()` buffer return, singleton browser pattern, `--no-sandbox --disable-dev-shm-usage` args
- Mapbox Static Images API docs — https://docs.mapbox.com/api/maps/static-images/ — confirmed URL format, `mapbox` username for built-in styles, `satellite-streets-v12` style ID, `bbox` parameter, path overlay syntax, 8,192-character URL limit, 2,083-character overlay limit
- `@mapbox/polyline` npm README — https://www.npmjs.com/package/@mapbox/polyline — confirmed `polyline.encode([lat,lng][])`, `polyline.fromGeoJSON()`, coordinate order convention
- EJS official docs — https://ejs.co/ — confirmed `ejs.render(str, data, options)` API for string-based rendering (no Express view engine needed)
- Existing project files: `src/types.ts`, `src/store/useAppStore.ts`, `src/components/TopNav/TopNav.tsx`, `vitest.config.ts`, Phase 3 research doc

### Secondary (MEDIUM confidence)
- Puppeteer v24.41.0 as latest version — npm registry search result (verified against https://pptr.dev/)
- `displayHeaderFooter` + `headerTemplate`/`footerTemplate` with `pageNumber`/`totalPages` classes — confirmed via multiple Puppeteer docs and community sources; known issue with multi-PDF sessions flagged
- Mapbox Standard/Standard Satellite incompatibility with Static Images API — confirmed via official Mapbox docs (explicit limitation statement)
- EJS `ejs.render()` string-based approach vs `ejs.renderFile()` — confirmed both work; `render()` chosen for single-template PDF use case

### Tertiary (LOW confidence)
- Google Fonts timeout with `networkidle0` — derived from known behavior of `networkidle0` + external network dependency; mitigation (base64 embed) is standard practice
- Puppeteer singleton browser RAM impact — qualitative assessment from community sources; no exact numbers for this workload

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — Puppeteer, EJS, @mapbox/polyline all verified via official docs and npm
- Architecture: HIGH — patterns derived directly from official docs and existing project code; Express endpoint pattern mirrors Phase 3
- Pitfalls: MEDIUM-HIGH — URL length limit and coordinate swap verified from official docs; header/footer overlap is documented community issue; Google Fonts timeout from reasoning about `networkidle0` behavior

**Research date:** 2026-04-16
**Valid until:** 2026-05-16 (Puppeteer API is stable at v24; Mapbox Static API URL format has been stable for years)
