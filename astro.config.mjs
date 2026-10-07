import { defineConfig } from 'astro/config';
import node from '@astrojs/node';

export default defineConfig({
  site: 'https://mateussiil.com.br',
  // As páginas continuam estáticas; só as rotas /api/comments rodam no servidor.
  adapter: node({ mode: 'standalone', bodySizeLimit: 64 * 1024 }),
});
