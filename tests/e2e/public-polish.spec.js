import { expect, test } from '@playwright/test'

test('public shell exposes WhatsApp, footer credit and readable recent wins on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.route('**/api/v1/**', async (route) => {
    const path = new URL(route.request().url()).pathname
    const json = (body, status = 200) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) })
    if (path.endsWith('/auth/csrf/')) return json({ detail: 'CSRF cookie set.' })
    if (path.endsWith('/auth/me/')) return json({ detail: 'Not authenticated.' }, 401)
    if (path.endsWith('/recent-wins/')) return json([{
      id: 1,
      caption: 'Weekend accumulator https://www.betpawa.ug/share-betslip?id=BK-WIN-01',
      settled_at: '2026-10-25T09:00:00+03:00',
      image_url: '',
    }])
    if (path.endsWith('/packages/') || path.endsWith('/predictions/') || path.endsWith('/testimonials/')) return json([])
    return json([])
  })

  await page.goto('/')
  const firstWordmarkLetter = page.locator('.morph-letter').first()
  const initialWordmarkPath = await firstWordmarkLetter.getAttribute('d')
  await expect.poll(() => firstWordmarkLetter.getAttribute('d'), {
    message: 'The BK Football Predictions wordmark should morph on mobile',
    timeout: 5000,
  }).not.toBe(initialWordmarkPath)
  await expect(page.getByRole('link', { name: 'Follow BK Football Predictions on WhatsApp' })).toHaveAttribute('href', 'https://whatsapp.com/channel/0029VbCaG0RAYlUKBhmbmV0O')
  await expect(page.getByText('Powered by')).toBeVisible()
  await expect(page.getByText('Dape Technologies')).toBeVisible()
  await page.locator('#results').scrollIntoViewIfNeeded()
  await expect(page.getByRole('heading', { name: 'Recent wins, clearly documented.' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Weekend accumulator' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'View shared ticket' })).toHaveAttribute('href', 'https://www.betpawa.ug/share-betslip?id=BK-WIN-01')
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy()
  await page.screenshot({ path: 'test-results/public-mobile-recent-wins.png', fullPage: true })
})
