import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: ['.ngrok-free.dev', '.ngrok-free.app', '.ngrok.io'],
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        // Dev only: present ngrok/LAN requests as localhost so the API's CORS
        // allow-list (http://localhost:5173) accepts them without edits.
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            if (proxyReq.getHeader('origin')) {
              proxyReq.setHeader('origin', 'http://localhost:5173');
            }
          });
        },
      },
    },
  },
})
