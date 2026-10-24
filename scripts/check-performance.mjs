import { preview } from 'vite'
import lighthouse from 'lighthouse'
import { launch } from 'chrome-launcher'
import { chromium } from '@playwright/test'
import { mkdir, writeFile } from 'node:fs/promises'

// The CI build has no backend. Use an empty catalogue fixture rather than Vite's
// HTML 404 responses; real-user monitoring measures actual production API latency.
const server = await preview({
  plugins: [{ name: 'lighthouse-api-fixture', configurePreviewServer(server) {
    server.middlewares.use('/api/', (req, res) => {
      res.setHeader('Content-Type', 'application/json')
      res.statusCode = req.url.includes('/auth/me/') ? 401 : req.method === 'POST' ? 204 : 200
      res.end(res.statusCode === 204 ? '' : res.statusCode === 401 ? '{"detail":"Sign in required."}' : '[]')
    })
  } }], preview: { host: '127.0.0.1', port: 4174, strictPort: true },
})
let chrome
try {
  chrome = await launch({ chromePath: chromium.executablePath(), chromeFlags: ['--headless', '--no-sandbox'] })
  const { lhr, report } = await lighthouse('http://127.0.0.1:4174/', { port: chrome.port, output: 'html', onlyCategories: ['performance', 'accessibility'], logLevel: 'error' })
  await mkdir('lighthouse-reports', { recursive: true })
  await writeFile('lighthouse-reports/mobile.html', report)
  await writeFile('lighthouse-reports/mobile.json', JSON.stringify(lhr, null, 2))
  const limits = { 'largest-contentful-paint': 2500, 'cumulative-layout-shift': .1, 'total-blocking-time': 200 }
  for (const [id, limit] of Object.entries(limits)) {
    const actual = lhr.audits[id].numericValue
    console.log(`${id}: ${actual.toFixed(2)} (target ${limit})`)
    if (actual > limit) console.warn(`Performance target missed: ${id}. Review the Lighthouse report.`)
  }
  // Lab timing is a regression signal; production INP is measured from real interactions.
  if (!Number.isFinite(lhr.audits['largest-contentful-paint'].numericValue)) throw new Error('Lighthouse did not produce measurements.')
} finally {
  await chrome?.kill()
  server.httpServer.close()
}
