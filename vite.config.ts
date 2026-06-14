import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [vue(), vueDevTools(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            // Dev identity headers so tasks-api can auto-create a local user
            // without the full home-stack gateway.
            proxyReq.setHeader('X-User-ID', 'dev-user')
            proxyReq.setHeader('X-User-Name', 'Dev User')
            proxyReq.setHeader('X-User-Email', 'dev@example.com')
          })
        },
      },
    },
  },
})
