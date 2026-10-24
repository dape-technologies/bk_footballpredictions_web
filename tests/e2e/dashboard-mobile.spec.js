import { test, expect } from '@playwright/test'

for (const role of ['owner', 'developer']) {
  test(`${role} mobile navigation reaches security without public navigation overlap`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.route('**/api/v1/**', async (route) => {
      const path = new URL(route.request().url()).pathname
      let result = []
      if (path.endsWith('/auth/me/')) result = { id: 1, full_name: 'BK Account', is_owner: role === 'owner', is_developer: role === 'developer' }
      else if (path.endsWith('/auth/security/')) result = { notification_emails: ['owner@example.test', 'developer@example.test'], sessions: [], current_owner_otps: role === 'developer' ? [{ id: 7, code: '731904', purpose: 'payout', created_at: new Date().toISOString(), expires_at: new Date(Date.now() + 300000).toISOString() }] : undefined }
      else if (path.endsWith('/analytics/')) result = { finance: { audit: {}, today: {}, by_package: {}, recent_payments: [] }, commission: {}, users: {}, packages: {}, charts: {} }
      else if (path.endsWith('/dashboard/')) result = {}
      else if (path.endsWith('/report/')) result = { summary: {} }
      else if (path.endsWith('/performance/')) result = { summary: {}, by_package: [] }
      else if (path.endsWith('/payment-gateway/')) result = { provider: { configured: true, capabilities: {} } }
      else if (path.endsWith('/wallet/')) result = { provider_balance: 30000, minimum_operating_balance: 1500, minimum_payout: 500, maximum_payout: 5000000, destination: '***1777', destination_configured: true, payouts_enabled: true, payouts_frozen: false, execution_mode: 'immediate', wallet: { available: 10000, reserved: 0, credited: 10000, today_credited: 0 }, requests: [], ledger: [] }
      await route.fulfill({ contentType: 'application/json', body: JSON.stringify(result) })
    })
    await page.goto(`/${role}/dashboard`)
    const securityButton = page.locator('nav').getByRole('button', { name: /Security/ })
    await securityButton.scrollIntoViewIfNeeded()
    await securityButton.click()
    await expect(page.getByRole('heading', { name: 'Security and devices' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Sign out of this device' })).toBeVisible()
    if (role === 'developer') {
      await expect(page.getByRole('button', { name: 'Open Security' })).toBeVisible()
      await expect(page.getByRole('button', { name: 'Sign out', exact: true })).toBeVisible()
      await expect(page.getByRole('heading', { name: 'Current owner OTPs' })).toBeVisible()
      await expect(page.getByText('731904')).toBeVisible()
    } else {
      await expect(page.getByRole('heading', { name: 'Current owner OTPs' })).toHaveCount(0)
      const walletButton = page.locator('nav').getByRole('button', { name: /Wallet/ })
      await walletButton.scrollIntoViewIfNeeded()
      await walletButton.click()
      await expect(page.getByText(/Each withdrawal keeps the required/)).toBeVisible()
      await expect(page.getByText(/Relworx balance:/)).toHaveCount(0)
      const packagesButton = page.locator('nav').getByRole('button', { name: /Packages/ })
      await packagesButton.scrollIntoViewIfNeeded()
      await packagesButton.click()
      await expect(page.getByText('Cover photo', { exact: true })).toBeVisible()
      await expect(page.getByText('Paid package image', { exact: true })).toBeVisible()
    }
    await expect(page.getByRole('navigation', { name: 'App navigation' })).toHaveCount(0)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy()
    await page.screenshot({ path: `test-results/${role}-mobile-security.png`, fullPage: true })
  })
}
