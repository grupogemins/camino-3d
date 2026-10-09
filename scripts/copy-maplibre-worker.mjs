// Copia o worker do MapLibre para /public, pois o bundler não o resolve sozinho.
import { copyFileSync, mkdirSync } from 'node:fs';
mkdirSync('public/vendor/maplibre', { recursive: true });
copyFileSync('node_modules/maplibre-gl/dist/maplibre-gl-worker.mjs', 'public/vendor/maplibre/maplibre-gl-worker.mjs');
