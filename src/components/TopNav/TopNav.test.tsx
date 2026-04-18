import { describe, test } from 'vitest';

describe('TopNav — Export PDF button', () => {
  test.todo('button is visible and enabled when simulationStatus is "complete"');
  test.todo('button is disabled (opacity 0.4, cursor not-allowed) when simulationStatus is not "complete"');
  test.todo('clicking the button when enabled calls the exportPdf function');
  test.todo('button does not trigger exportPdf when simulationStatus is "idle"');
  test.todo('button does not trigger exportPdf when simulationStatus is "streaming"');
});
