import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: '/ari-student-needs-tracker/',
  plugins: [react()],
  server: {
    watch: {
      usePolling: true,
      interval: 100
    }
  }
})

