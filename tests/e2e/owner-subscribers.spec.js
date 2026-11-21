import { expect, test } from '@playwright/test'

test('owner sees a paid weekly subscriber waiting with a live countdown', async ({ page }) => {
  await page.route('**/api/v1/**', async (route) => {
    const path = new URL(route.request().url()).pathname
    const json = (body) => route.fulfill({ contentType: 'application/json', body: JSON.stringify(body) })
    if (path.endsWith('/auth/me/')) return json({ id: 1, full_name: 'BK Owner', is_owner: true, is_developer: false })
    if (path.endsWith('/dashboard/')) return json({ customers: 1, active_subscribers: 1, reconciliation: { overall: 'healthy', jobs: { payments: { due_count: 0, needs_review_count: 0 } } } })
    if (path.endsWith('/weekly-subscribers/')) return json({
      summary: { active: 1, waiting: 1, available: 0, expiring: 0 },
      results: [{
        id: 44,
        customer: { id: 7, full_name: 'Amina N.', phone: '0702000001', is_blocked: false },
        plan_name: 'Weekly Plan',
        price_snapshot: '12000',
        currency_snapshot: 'UGX',
        access_starts_at: '2029-11-21T10:00:00+03:00',
        access_ends_at: '2030-11-28T10:00:00+03:00',
        remaining_seconds: 604800,
        access_status: 'active',
        content_status: 'waiting',
        is_expiring_soon: false,
        available_content_count: 0,
        payment: { reference: 'BKP-WAITING123', amount: '12000', currency: 'UGX', confirmed_at: '2029-11-21T10:00:00+03:00' },
      }],
    })
    if (path.endsWith('/report/')) return json({ summary: {} })
    if (path.endsWith('/performance/')) return json({ summary: {}, by_package: [] })
    if (path.endsWith('/subscription-plan/')) return json({ name: 'Weekly Plan', price: '12000', currency: 'UGX', duration_days: 7, is_active: true })
    return json([])
  })

  await page.goto('/owner/dashboard')
  await page.getByRole('button', { name: /Subscribers/ }).click()

  await expect(page.getByRole('heading', { name: /Know who is paid/ })).toBeVisible()
  await expect(page.getByText('Amina N.')).toBeVisible()
  await expect(page.getByText('BKP-WAITING123')).toBeVisible()
  await expect(page.getByText('Waiting for package')).toBeVisible()
  await expect(page.locator('.subscriber-countdown')).toContainText(/left|Expired/)
})

test('checkout blocks a second prompt and offers the existing payment status', async ({ page }) => {
  const member = { id: 10, phone: '0702000001', first_name: 'Member', surname: 'One', full_name: 'Member One', is_owner: false, is_developer: false }
  const plan = { id: 4, key: 'weekly', name: 'Weekly Plan', description: 'Seven days.', price: '12000', payment_total: '12360', payment_fee: '360', currency: 'UGX', duration_days: 7, is_active: true }
  const order = { id: 44, plan, price_snapshot: '12000', currency_snapshot: 'UGX', duration_days_snapshot: 7, is_paid: false, is_active: false, status: 'pending', latest_payment: null }
  await page.route('**/api/v1/**', async (route) => {
    const request = route.request()
    const path = new URL(request.url()).pathname
    const json = (body, status = 200, headers = {}) => route.fulfill({ status, headers, contentType: 'application/json', body: JSON.stringify(body) })
    if (path.endsWith('/auth/me/')) return json(member)
    if (path.endsWith('/auth/csrf/')) return json({}, 200, { 'Set-Cookie': 'csrftoken=test; Path=/' })
    if (path === '/api/v1/packages/') return json([])
    if (path === '/api/v1/weekly-plan/') return json(plan)
    if (path === '/api/v1/me/subscriptions/' && request.method() === 'POST') return json(order, 201)
    if (path === '/api/v1/me/subscriptions/44/payment-attempts/') return json({
      detail: 'A Weekly Plan payment is already in progress. Check its status before trying again.',
      code: 'payment_in_progress',
      payment: { id: 55, reference: 'BKP-EXISTING55', status: 'pending' },
    }, 409)
    if (path.includes('/predictions') || path.includes('/recent-wins') || path.includes('/testimonials')) return json([])
    return json([])
  })

  await page.goto('/packages')
  await page.getByRole('tab', { name: 'Weekly Plan' }).click()
  await page.getByRole('button', { name: 'Join Weekly Plan' }).click()
  await page.getByRole('button', { name: 'Pay with mobile money' }).click()

  await expect(page.getByText('Do not pay twice')).toBeVisible()
  await expect(page.getByText('BKP-EXISTING55')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Check existing payment' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Pay with mobile money' })).toBeDisabled()
})
