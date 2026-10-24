import { api } from './api/client'

export function trackPackageView(packageId) {
  if (navigator.doNotTrack === '1') return
  api('/v1/telemetry/', { method: 'POST', body: JSON.stringify({ kind: 'package_view', package_id: packageId, event_id: crypto.randomUUID() }) }).catch(() => {})
}

export async function startPerformanceMonitoring() {
  if (navigator.doNotTrack === '1' || localStorage.getItem('bk-performance-measurement') === 'false') return
  const { onLCP, onINP, onCLS } = await import('web-vitals')
  const send = (metric) => {
    if (localStorage.getItem('bk-performance-measurement') === 'false') return
    api('/v1/telemetry/', { method: 'POST', keepalive: true, body: JSON.stringify({ kind: 'web_vital', metric: metric.name, value: metric.value, sample_id: metric.id, page: location.pathname }) }).catch(() => {})
  }
  onLCP(send); onINP(send); onCLS(send)
}
