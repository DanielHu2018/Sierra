import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['src/test/setup.ts'],
    globals: true,
    exclude: ['node_modules/**', 'server/**'],
    alias: {
      'mapbox-gl': '/src/test/__mocks__/mapbox-gl.ts',
    },
  },
});
