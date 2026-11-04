import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, fileURLToPath(new URL('.', import.meta.url)), '')
  const configuredApi = env.API || 'http://localhost:4001/api/v1'
  const apiUrl = /^https?:\/\//i.test(configuredApi) ? new URL(configuredApi) : null
  const apiPath = (apiUrl?.pathname || configuredApi).replace(/\/+$/, '') || '/api/v1'
  const apiTarget = apiUrl?.origin || env.BACKEND_PROXY_TARGET || 'http://localhost:4001'
  const secureApiTarget = new URL(apiTarget).protocol === 'https:'

  return {
    plugins: [react()],
    define: {
      'import.meta.env.API': JSON.stringify(apiPath),
      'import.meta.env.FIREBASE_API_KEY': JSON.stringify(env.FIREBASE_API_KEY ?? ''),
      'import.meta.env.FIREBASE_AUTH_DOMAIN': JSON.stringify(env.FIREBASE_AUTH_DOMAIN ?? ''),
      'import.meta.env.FIREBASE_PROJECT_ID': JSON.stringify(env.FIREBASE_PROJECT_ID ?? ''),
      'import.meta.env.FIREBASE_APP_ID': JSON.stringify(env.FIREBASE_APP_ID ?? ''),
      'import.meta.env.FIREBASE_MESSAGING_SENDER_ID': JSON.stringify(env.FIREBASE_MESSAGING_SENDER_ID ?? ''),
    },
    server: {
      proxy: {
        [apiPath]: {
          target: apiTarget,
          changeOrigin: true,
          secure: secureApiTarget,
          cookieDomainRewrite: '',
        },
      },
    },
  }
})
