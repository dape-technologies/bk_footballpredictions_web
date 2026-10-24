import { test, expect } from '@playwright/test'

for (const role of ['owner', 'developer']) {
  test(`${role} mobile navigation reaches security without public navigation overlap`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.route('**/api/v1/**', async (route) => {
      const path = new URL(route.request().url()).pathname
      let result = []
      if (path.endsWith('/auth/me/')) result = { id: 1, full_name: 'BK Account', is_owner: role === 'owner', is_developer: role === 'developer' }
      else if (path.endsWith('/auth/security/')) result = { notification_emails: ['owner@example.test', 'developer@example.test'], sessions: [], recovery_codes_remaining: 0 }
      else if (path.endsWith('/analytics/')) result = { finance: { audit: {}, today: {}, by_package: {}, recent_payments: [] }, commission: {}, users: {}, packages: {}, charts: {} }
      else if (path.endsWith('/dashboard/')) result = {}
      else if (path.endsWith('/report/')) result = { summary: {} }
      else if (path.endsWith('/performance/')) result = { summary: {}, by_package: [] }
      else if (path.endsWith('/payment-gateway/')) result = { provider: { configured: true, capabilities: {} } }
      await route.fulfill({ contentType: 'application/json', body: JSON.stringify(result) })
    })
    await page.goto(`/${role}/dashboard`)
    const securityButton = page.locator('nav').getByRole('button', { name: /Security/ })
    await securityButton.scrollIntoViewIfNeeded()
    await securityButton.click()
    await expect(page.getByRole('heading', { name: 'Security and devices' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Sign out of this device' })).toBeVisible()
    await expect(page.getByRole('navigation', { name: 'App navigation' })).toHaveCount(0)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy()
    await page.screenshot({ path: `test-results/${role}-mobile-security.png`, fullPage: true })
  })
}
