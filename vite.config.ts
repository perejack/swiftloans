import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    proxy: {
      '/pesapal': {
        target: 'https://pay.pesapal.com/v3',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/pesapal/, ''),
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      },
    },
  },
});
