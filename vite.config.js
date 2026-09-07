import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(() => {
  const isDevSubfolder = process.env.DEPLOY_ENV === 'dev' || process.env.VITE_BASE_PATH === 'dev';
  const base = isDevSubfolder ? '/ari-student-needs-tracker/dev/' : '/ari-student-needs-tracker/';

  return {
    base,
    plugins: [react()],
    server: {
      watch: {
        usePolling: true,
        interval: 100
      }
    }
  }
})

