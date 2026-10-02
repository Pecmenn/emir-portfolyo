import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

// Geliştirme sunucusunda /admin adresini panel sayfasına yönlendir (yayında bunu public/_redirects yapar)
const adminRoute = (): Plugin => ({
  name: 'admin-route',
  configureServer(server) {
    server.middlewares.use((req, _res, next) => {
      if (req.url === '/admin' || req.url?.startsWith('/admin/') || req.url?.startsWith('/admin?')) req.url = '/admin.html';
      next();
    });
  },
});

export default defineConfig({
  plugins: [react(), adminRoute()],
  server: { port: 5173, open: true },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        admin: resolve(__dirname, 'admin.html'),
      },
    },
  },
});
