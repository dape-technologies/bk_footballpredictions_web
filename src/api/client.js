const API_ROOT = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '')
let csrfReady = false

function cookie(name) {
  const value = document.cookie.split('; ').find((entry) => entry.startsWith(`${name}=`))
  return value ? decodeURIComponent(value.split('=').slice(1).join('=')) : ''
}

async function ensureCsrf() {
  if (csrfReady && cookie('csrftoken')) return
  const response = await fetch(`${API_ROOT}/v1/auth/csrf/`, { credentials: 'include' })
  if (!response.ok) throw new Error('Could not initialize a secure session.')
  csrfReady = true
}

function errorMessage(payload, fallback) {
  if (!payload) return fallback
  if (typeof payload.detail === 'string') return payload.detail
  if (Array.isArray(payload.non_field_errors)) return payload.non_field_errors[0]
  for (const value of Object.values(payload)) {
    if (Array.isArray(value) && value[0]) return value[0]
    if (typeof value === 'string') return value
  }
  return fallback
}

export async function api(path, options = {}) {
  const method = (options.method || 'GET').toUpperCase()
  if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) await ensureCsrf()
  const headers = new Headers(options.headers || {})
  const isForm = options.body instanceof FormData
  if (options.body && !isForm && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json')
  const csrf = cookie('csrftoken')
  if (csrf && !['GET', 'HEAD', 'OPTIONS'].includes(method)) headers.set('X-CSRFToken', csrf)
  const response = await fetch(`${API_ROOT}${path}`, { ...options, method, headers, credentials: 'include' })
  const type = response.headers.get('content-type') || ''
  const payload = response.status === 204 ? null : type.includes('application/json') ? await response.json() : await response.text()
  if (!response.ok) {
    const error = new Error(errorMessage(payload, `Request failed with status ${response.status}.`))
    error.status = response.status
    error.payload = payload
    throw error
  }
  return payload
}

export { API_ROOT }
