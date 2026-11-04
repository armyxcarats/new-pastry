import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react()],
    define: {
      'import.meta.env.API': JSON.stringify(env.API ?? ''),
      'import.meta.env.FIREBASE_API_KEY': JSON.stringify(env.FIREBASE_API_KEY ?? ''),
      'import.meta.env.FIREBASE_AUTH_DOMAIN': JSON.stringify(env.FIREBASE_AUTH_DOMAIN ?? ''),
      'import.meta.env.FIREBASE_PROJECT_ID': JSON.stringify(env.FIREBASE_PROJECT_ID ?? ''),
      'import.meta.env.FIREBASE_APP_ID': JSON.stringify(env.FIREBASE_APP_ID ?? ''),
      'import.meta.env.FIREBASE_MESSAGING_SENDER_ID': JSON.stringify(env.FIREBASE_MESSAGING_SENDER_ID ?? ''),
    },
  }
})
