import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import { copyFileSync } from 'fs';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'copy-service-worker',
      closeBundle: () => {
        copyFileSync('service-worker.js', 'dist/service-worker.js');
      }
    },
    {
      name: 'copy-content-script',
      closeBundle: () => {
        copyFileSync('contentScript.js', 'dist/contentScript.js');
      }
    }
  ],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
      }
    },
    outDir: 'dist',
  }
});