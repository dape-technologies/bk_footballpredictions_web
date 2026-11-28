import { expect, test } from '@playwright/test'

const member = {
  id: 10,
  phone: '0702000001',
  first_name: 'Member',
  surname: 'One',
  full_name: 'Member One',
  is_owner: false,
  is_developer: false,
  is_blocked: false,
}

const plan = {
  id: 4,
  key: 'weekly',
  name: 'Weekly Plan',
  description: 'Every weekly package for seven days.',
  price: '12000',
  payment_total: '12360',
  payment_fee: '360',
  currency: 'UGX',
  duration_days: 7,
  is_active: true,
}

const pendingOrder = {
  id: 44,
  plan,
  price_snapshot: '12000',
  currency_snapshot: 'UGX',
  duration_days_snapshot: 7,
  initiated_at: '2026-11-21T10:00:00+03:00',
  paid_at: null,
  access_starts_at: null,
  access_ends_at: null,
  is_paid: false,
  is_active: false,
  status: 'unpaid',
  latest_payment: null,
}

const paidOrder = {
  ...pendingOrder,
  paid_at: '2026-11-21T10:01:00+03:00',
  access_starts_at: '2026-11-21T10:01:00+03:00',
  access_ends_at: '2030-11-28T10:01:00+03:00',
  is_paid: true,
  is_active: true,
  status: 'active',
}

const payment = (paid = false) => ({
  id: 55,
  reference: 'BKP-WEEKLY1234',
  product_name: 'Weekly Plan',
  checkout_type: 'subscription',
  status: paid ? 'paid' : 'pending',
  payer_msisdn: '+256702000001',
  receipt_url: paid ? '/api/v1/me/payments/55/receipt/' : '',
})

const oneOffPlan = {
  id: 12,
  name: 'Daily Edge',
  slug: 'daily-edge',
  package_type: 'Accumulator',
  price: '10000',
  currency: 'UGX',
  win_probability: 78,
  closes_at: '2030-11-23T18:00:00+03:00',
  image_url: '',
  is_open: true,
}

const oneOffPurchase = {
  id: 72,
  user: member,
  package: oneOffPlan,
  price_snapshot: '10000',
  currency_snapshot: 'UGX',
  initiated_at: '2026-11-22T10:00:00+03:00',
  paid_at: null,
  is_paid: false,
  status: 'pending',
  latest_payment: null,
}

test('weekly checkout unlocks the subscriber feed', async ({ page }) => {
  let subscriptionActive = false
  await page.route('**/api/v1/**', async (route) => {
    const request = route.request()
    const path = new URL(request.url()).pathname
    const json = (body, status = 200, headers = {}) => route.fulfill({ status, headers, contentType: 'application/json', body: JSON.stringify(body) })

    if (path === '/api/v1/auth/me/') return json(member)
    if (path === '/api/v1/auth/csrf/') return json({ detail: 'CSRF cookie set.' }, 200, { 'Set-Cookie': 'csrftoken=test; Path=/' })
    if (path === '/api/v1/packages/') return json([])
    if (path === '/api/v1/weekly-plan/') return json(plan)
    if (path === '/api/v1/me/subscriptions/' && request.method() === 'POST') return json(pendingOrder, 201)
    if (path === '/api/v1/me/subscriptions/' && request.method() === 'GET') return json(subscriptionActive ? [paidOrder] : [])
    if (path === '/api/v1/me/subscriptions/44/payment-attempts/') return json(payment(false), 202)
    if (path === '/api/v1/me/payments/55/refresh/') {
      subscriptionActive = true
      return json(payment(true))
    }
    if (path === '/api/v1/me/subscriptions/44/') return json(paidOrder)
    if (path === '/api/v1/me/purchases/') return json([])
    if (path === '/api/v1/me/preferences/') return json({ preferences: {}, notices: [] })
    if (path === '/api/v1/me/weekly-content/') return json([{
      id: 91,
      name: 'Saturday Accumulator',
      package_type: 'Accumulator',
      closes_at: '2030-11-22T18:00:00+03:00',
      is_open: true,
      code: 'BK-WEEK-91',
      paid_image_url: '',
    }])
    if (path === '/api/v1/predictions/' || path === '/api/v1/recent-wins/' || path === '/api/v1/testimonials/') return json([])
    return json({ detail: `Unhandled test route: ${path}` }, 404)
  })

  await page.goto('/packages')
  await page.getByRole('tab', { name: 'Weekly Plan' }).click()
  await page.getByRole('button', { name: 'Join Weekly Plan' }).click()
  await expect(page.getByRole('heading', { name: 'Pay UGX 12,360' })).toBeVisible()
  await page.getByRole('button', { name: 'Pay with mobile money' }).click()
  await expect(page.getByText('Approve the prompt on your phone')).toBeVisible()
  await expect(page.getByText('Payment confirmed')).toBeVisible({ timeout: 7000 })
  await page.getByRole('button', { name: 'View weekly packages' }).click()

  await expect(page.getByRole('dialog', { name: 'Member access' }).getByText('Weekly Plan active', { exact: true })).toBeVisible()
  await expect(page.getByText('Saturday Accumulator')).toBeVisible()
  await expect(page.getByText('BK-WEEK-91')).toBeVisible()
  await expect(page.getByText('Renewal opens after expiry.')).toBeVisible()
})

test('weekly membership banner deep-links to the weekly offer', async ({ page }) => {
  await page.route('**/api/v1/**', async (route) => {
    const path = new URL(route.request().url()).pathname
    const json = (body, status = 200) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) })

    if (path === '/api/v1/auth/me/') return json({ detail: 'Authentication credentials were not provided.' }, 401)
    if (path === '/api/v1/packages/') return json([oneOffPlan])
    if (path === '/api/v1/weekly-plan/') return json(plan)
    if (path === '/api/v1/free-pick/') return json({ detail: 'No free pick.' }, 404)
    if (path === '/api/v1/predictions/' || path === '/api/v1/recent-wins/' || path === '/api/v1/testimonials/') return json([])
    return json({ detail: `Unhandled test route: ${path}` }, 404)
  })

  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Stay covered for the full week.' })).toBeVisible()
  await page.getByRole('button', { name: 'View Weekly Plan' }).click()

  await expect(page).toHaveURL(/offer=weekly.*#packages/)
  await expect(page.getByRole('tab', { name: 'Weekly Plan' })).toHaveAttribute('aria-selected', 'true')
  await expect(page.getByRole('button', { name: 'Join Weekly Plan' })).toBeVisible()

  await page.goto('/packages?offer=weekly')
  await expect(page).toHaveURL(/offer=weekly.*#packages/)
  await expect(page.getByRole('tab', { name: 'Weekly Plan' })).toHaveAttribute('aria-selected', 'true')
})

test('active weekly member can view weekly picks and still buy a one-off ticket', async ({ page }) => {
  await page.route('**/api/v1/**', async (route) => {
    const request = route.request()
    const path = new URL(request.url()).pathname
    const json = (body, status = 200, headers = {}) => route.fulfill({ status, headers, contentType: 'application/json', body: JSON.stringify(body) })

    if (path === '/api/v1/auth/me/') return json(member)
    if (path === '/api/v1/auth/csrf/') return json({ detail: 'CSRF cookie set.' }, 200, { 'Set-Cookie': 'csrftoken=test; Path=/' })
    if (path === '/api/v1/packages/') return json([oneOffPlan])
    if (path === '/api/v1/weekly-plan/') return json(plan)
    if (path === '/api/v1/me/subscriptions/') return json([paidOrder])
    if (path === '/api/v1/me/weekly-content/') return json([])
    if (path === '/api/v1/me/purchases/' && request.method() === 'GET') return json([])
    if (path === '/api/v1/me/purchases/' && request.method() === 'POST') return json(oneOffPurchase, 201)
    if (path === '/api/v1/me/preferences/') return json({ preferences: {}, notices: [] })
    if (path === '/api/v1/free-pick/') return json({ detail: 'No free pick.' }, 404)
    if (path === '/api/v1/predictions/' || path === '/api/v1/recent-wins/' || path === '/api/v1/testimonials/') return json([])
    return json({ detail: `Unhandled test route: ${path}` }, 404)
  })

  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Your Weekly Plan is active.' })).toBeVisible()
  await page.getByRole('button', { name: 'View weekly picks' }).first().click()
  await expect(page.getByText('Weekly Plan active')).toBeVisible()
  await page.getByRole('button', { name: 'Close' }).click()

  await page.getByRole('button', { name: 'Buy slip' }).click()
  await expect(page.getByRole('heading', { name: 'Pay UGX 10,000' })).toBeVisible()
})
