import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';
import { localAdminMiddleware } from './src/admin/localServer';

// Geliştirme sunucusunda /admin adresini panel sayfasına yönlendirir ve panelin yerel kayıt ucunu açar
// (yayında /admin adresini barındırma servisi admin.html'e eşler; yerel kayıt ucu yalnızca geliştirmede vardır)
const adminRoute = (): Plugin => ({
  name: 'admin-route',
  configureServer(server) {
    server.middlewares.use(localAdminMiddleware(server.config.root));
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
