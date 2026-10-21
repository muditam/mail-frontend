import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiBase = env.VITE_API_BASE_URL
  if (!apiBase?.startsWith('/') || apiBase.startsWith('//')) throw new Error('VITE_API_BASE_URL must be a same-origin path')
  if (command === 'build') return { plugins: [react()] }
  const proxyTarget = env.DEV_API_PROXY_TARGET
  const port = Number(env.DEV_SERVER_PORT)
  if (!proxyTarget || !/^https?:\/\//.test(proxyTarget)) throw new Error('DEV_API_PROXY_TARGET must be an HTTP URL')
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('DEV_SERVER_PORT must be a valid port')
  const proxyPrefix = '/' + apiBase.split('/').filter(Boolean)[0]
  return {
    plugins: [react()],
    server: { port, proxy: { [proxyPrefix]: { target: proxyTarget, changeOrigin: true } } },
  }
})
