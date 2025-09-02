import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
<<<<<<< HEAD
  plugins: [react()],
  server : {
    port: 5173,
    proxy: {
      'api': {
        target: 'http://localhost:8081',
        changeOrigin: true,
      },
    },
  },
=======
  plugins: [react(), tailwindcss(),],
>>>>>>> main
})
