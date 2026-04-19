import { defineConfig } from 'vite';
import type { ViteDevServer } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

function sierraPlugin() {
  return {
    name: 'sierra-static',

    configureServer(server: ViteDevServer) {
      // Serve / as landing.html
      server.middlewares.use((req, res, next) => {
        if (req.url === '/' || req.url === '') {
          const landingPath = path.join(__dirname, 'public', 'landing.html');
          res.setHeader('Content-Type', 'text/html; charset=utf-8');
          fs.createReadStream(landingPath).pipe(res);
          return;
        }
        next();
      });

      // Serve /landingpagevideo/* frames from project root
      server.middlewares.use('/landingpagevideo', (req, res, next) => {
        const filename = (req.url ?? '').replace(/^\//, '').split('?')[0];
        if (!filename) { next(); return; }
        const filePath = path.join(__dirname, 'landingpagevideo', filename);
        if (fs.existsSync(filePath)) {
          res.setHeader('Content-Type', 'image/jpeg');
          res.setHeader('Cache-Control', 'public, max-age=86400');
          fs.createReadStream(filePath).pipe(res);
        } else {
          next();
        }
      });
    },

    closeBundle() {
      const src  = path.join(__dirname, 'landingpagevideo');
      const dest = path.join(__dirname, 'dist', 'landingpagevideo');
      if (!fs.existsSync(src)) return;
      if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
      const files = fs.readdirSync(src);
      for (const file of files) {
        fs.copyFileSync(path.join(src, file), path.join(dest, file));
      }
      console.log(`[sierra-static] copied ${files.length} frames → dist/landingpagevideo/`);
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), sierraPlugin()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
});
