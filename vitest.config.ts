import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['src/test/setup.ts'],
    globals: true,
    exclude: ['node_modules/**', 'server/**'],
    css: false,
    alias: [
      // Alias the root mapbox-gl import to our mock (exact match only)
      {
        find: /^mapbox-gl$/,
        replacement: path.resolve(__dirname, 'src/test/__mocks__/mapbox-gl.ts'),
      },
      // Stub CSS sub-path imports from mapbox-gl (e.g. mapbox-gl/dist/mapbox-gl.css)
      {
        find: /^mapbox-gl\/.+\.css$/,
        replacement: path.resolve(__dirname, 'src/test/__mocks__/empty-style.ts'),
      },
    ],
  },
});
