---
status: testing
phase: 01-foundation-map-canvas
source: 01-01-SUMMARY.md, 01-02-SUMMARY.md, 01-03-SUMMARY.md, 01-04-SUMMARY.md, 01-05-SUMMARY.md, 01-06-SUMMARY.md
started: 2026-04-17T00:00:00Z
updated: 2026-04-17T00:01:00Z
---

## Current Test
<!-- OVERWRITE each test - shows where we are -->

number: 1
name: Cold Start Smoke Test
expected: |
  Kill any running dev server. Start fresh with `npm run dev`. Server should boot without errors in the terminal. Open the app in your browser — it should load without a blank screen or console errors. The map should be visible.
awaiting: user response

## Tests

### 1. Cold Start Smoke Test
expected: Kill any running dev server. Start fresh with `npm run dev`. Server should boot without errors in the terminal. Open the app in your browser — it should load without a blank screen or console errors. The map should be visible.
result: issue
reported: "npm error Missing script: 'dev' — no package.json at project root, no src/ directory, no React app files committed to git"
severity: blocker

### 2. Map Renders Full-Screen
expected: The Mapbox satellite-streets map fills the entire browser window (100vw × 100vh). No white borders or gaps around the map. The map tiles load and show Texas-area satellite imagery.
result: [pending]

### 3. TopNav Bar
expected: A fixed top bar is visible with the "SIERRA" wordmark (Manrope font), 3 nav items, and a disabled "Export PDF" button/link. It sits above the map.
result: [pending]

### 4. Sidebar HUD Visible
expected: A floating dark panel (~320px wide) appears on the left side of the screen with multiple sections (Pin Placement, Voltage, Route Priority, Constraints, Overlays). It floats over the map without covering the full screen.
result: [pending]

### 5. Click to Place Source Pin
expected: Click anywhere on the map. A pin marker drops at that location with a pulse/ring animation. The sidebar's Pin Placement section shows coordinates for the source pin.
result: [pending]

### 6. Click to Place Destination Pin
expected: Click a second location on the map. A second pin (destination) drops there with a pulse animation. The map camera adjusts (fitBounds) to show both pins with the sidebar offset accounted for.
result: [pending]

### 7. Map Controls Panel
expected: A glassmorphism-style floating panel is visible on the map with: zoom in/out controls, a satellite/terrain baselayer switcher, and a recenter button. Clicking the baselayer switcher changes the map style.
result: [pending]

### 8. Toggle Overlay Layers
expected: In the Overlays section of the sidebar, there are toggles for ERCOT Grid, Land Boundary, Wildlife Habitat, Topography, and Friction Heatmap. Toggling ERCOT Grid, Land Boundary, Wildlife Habitat, or Topography shows/hides lines or polygons on the map. Friction Heatmap toggle renders nothing (Phase 2 data — expected behavior).
result: [pending]

### 9. Voltage Selection
expected: The Voltage section in the sidebar shows 3 options (e.g., 138kV, 345kV, 500kV). Clicking each selects it visually (highlighted/active state). Only one can be selected at a time.
result: [pending]

### 10. Route Priority Chips
expected: The Route Priority section shows 2 chip/pill toggles (e.g., Cost, Speed or similar). Clicking a chip highlights it as active. Chips are styled distinctly when selected vs unselected.
result: [pending]

### 11. Constraints Toggles
expected: The Constraints section shows 3 toggle switches. Each can be independently toggled on/off. The toggle visually changes state (on = highlighted, off = dim).
result: [pending]

### 12. Run Simulation Button Disabled
expected: At the bottom of the sidebar, there is a "Run Simulation" button that is visually disabled (greyed out or has disabled styling). Clicking it does nothing.
result: [pending]

## Summary

total: 12
passed: 0
issues: 1
pending: 11
skipped: 0

## Gaps

- truth: "App starts with npm run dev — full-screen Mapbox map visible in browser"
  status: failed
  reason: "User reported: npm error Missing script: 'dev' — no package.json at project root, no src/ directory, no React app files committed to git"
  severity: blocker
  test: 1
  artifacts: []
  missing: []
