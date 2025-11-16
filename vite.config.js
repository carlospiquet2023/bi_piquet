import { defineConfig } from 'vite';

export default defineConfig({
  base: '/bi_piquet/',
  server: {
    port: 3000,
    open: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
  optimizeDeps: {
    include: ['chart.js', 'xlsx', 'apexcharts'],
  },
});
