import { routes } from '@vercel/config/v1'

const backendBaseUrl = process.env.BACKEND_BASE_URL
const apiBase = process.env.VITE_API_BASE_URL

if (!backendBaseUrl) throw new Error('BACKEND_BASE_URL must be set in Vercel')
const backend = new URL(backendBaseUrl)
if (backend.protocol !== 'https:' || backend.pathname !== '/' || backend.search || backend.hash) {
  throw new Error('BACKEND_BASE_URL must be an HTTPS origin without a path')
}
if (apiBase !== '/api/app/v1') {
  throw new Error('VITE_API_BASE_URL must match the backend API path /api/app/v1')
}

export const config = {
  rewrites: [
    routes.rewrite('/api/app/v1/:path*', `${backend.origin}/api/app/v1/:path*`),
    routes.rewrite('/(.*)', '/index.html'),
  ],
}
