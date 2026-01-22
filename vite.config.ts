import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  server: {
    host: '0.0.0.0', // Allows external access
    allowedHosts: ["workable-nonsimilar-jessi.ngrok-free.dev"],
  },
  plugins: [react()],
})