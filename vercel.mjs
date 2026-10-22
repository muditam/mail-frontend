const backendBaseUrl = process.env.BACKEND_BASE_URL
const apiBase = process.env.VITE_API_BASE_URL

if (!backendBaseUrl) throw new Error('BACKEND_BASE_URL must be set in Vercel')
const backend = new URL(backendBaseUrl)
if (backend.protocol !== 'https:' || backend.pathname !== '/' || backend.search || backend.hash) {
  throw new Error('BACKEND_BASE_URL must be an HTTPS origin without a path')
}
if (!apiBase || !/^\/(?!\/)[a-zA-Z0-9/_-]+$/.test(apiBase) || apiBase.endsWith('/')) {
  throw new Error('VITE_API_BASE_URL must be a same-origin path without a trailing slash')
}

export const config = {
  rewrites: [
    { source: `${apiBase}/:path*`, destination: `${backend.origin}${apiBase}/:path*` },
    { source: '/(.*)', destination: '/index.html' },
  ],
}
