import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const nvidiaApiKey = env.NVIDIA_API_KEY;

  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api/nvidia': {
          target: 'https://integrate.api.nvidia.com',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/nvidia/, '/v1'),
          headers: nvidiaApiKey ? { Authorization: `Bearer ${nvidiaApiKey}` } : {}
        },
        '/api': {
          target: 'http://localhost:3001',
          changeOrigin: true
        }
      }
    },
    optimizeDeps: {
      include: ['jspdf', 'canvas-confetti']
    }
  };
})
