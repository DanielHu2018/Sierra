import { useAppStore } from '../store/useAppStore';

/**
 * Returns an async exportPdf() function that POSTs the currently selected route's
 * pre-generated content to the Express PDF endpoint and triggers a browser download.
 *
 * All content is read from Zustand — nothing is re-fetched at export time.
 * Silent fail: if the POST fails for any reason, the function returns without error
 * to avoid visible failures during the hackathon demo.
 */
export function useExportPdf(): () => Promise<void> {
  const routes = useAppStore((s) => s.routes);
  const selectedRoute = useAppStore((s) => s.selectedRoute);
  const recommendation = useAppStore((s) => s.recommendation);
  const triggers = useAppStore((s) => s.triggers);
  const alerts = useAppStore((s) => s.alerts);
  const projectSummary = useAppStore((s) => s.projectSummary);
  const narrativeByRoute = useAppStore((s) => s.narrativeByRoute);

  return async function exportPdf(): Promise<void> {
    // Guard: nothing to export if no route is selected
    if (!selectedRoute || !routes) return;

    const route = routes.find((r) => r.id === selectedRoute);
    if (!route) return;

    const narrative = narrativeByRoute?.[selectedRoute] ?? '';

    let res: Response;
    try {
      res = await fetch('/api/export/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          routeId: selectedRoute,
          route,
          recommendation: recommendation ?? null,
          triggers: triggers ?? [],
          alerts: alerts ?? null,
          projectSummary: projectSummary ?? null,
          narrative,
        }),
      });
    } catch {
      // Network error — silent fail for demo stability
      return;
    }

    if (!res.ok) return;

    // Trigger browser download via synthetic anchor
    // window.open() is blocked by popup blockers — use createObjectURL instead
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `sierra-dossier-route-${selectedRoute}.pdf`;
    anchor.click();
    URL.revokeObjectURL(url);
  };
}
