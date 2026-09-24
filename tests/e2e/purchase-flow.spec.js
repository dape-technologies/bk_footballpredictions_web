import { expect, test } from '@playwright/test'

const member = {
  id: 10,
  phone: '0702000001',
  first_name: 'Member',
  surname: 'One',
  full_name: 'Member One',
  is_owner: false,
  is_blocked: false,
}

const plan = {
  id: 1,
  name: 'Daily Edge',
  slug: 'daily-edge',
  package_type: 'Accumulator',
  price: '10000',
  currency: 'UGX',
  win_probability: 78,
  closes_at: '2030-09-23T18:00:00+03:00',
  image_url: '',
  is_open: true,
}

function purchase(paid = false) {
  return {
    id: 21,
    user: member,
    package: plan,
    price_snapshot: '10000',
    currency_snapshot: 'UGX',
    initiated_at: '2026-09-23T10:00:00+03:00',
    paid_at: paid ? '2026-09-23T10:01:00+03:00' : null,
    is_paid: paid,
    status: paid ? 'paid' : 'pending',
    code: paid ? 'BK-DAY-78' : '',
    betslip_link: paid ? 'https://example.com/slips/daily-edge' : '',
    latest_payment: {
      id: 31,
      reference: 'BKP-TEST123456',
      status: paid ? 'paid' : 'pending',
      provider_message: paid ? 'Payment completed successfully.' : 'Request payment in progress.',
    },
  }
}

test('guest authentication resumes checkout and verified payment reveals the package', async ({ page }) => {
  let loggedIn = false

  await page.route('**/api/v1/**', async (route) => {
    const request = route.request()
    const path = new URL(request.url()).pathname
    const json = (body, status = 200, headers = {}) => route.fulfill({ status, headers, contentType: 'application/json', body: JSON.stringify(body) })

    if (path === '/api/v1/auth/csrf/') return json({ detail: 'CSRF cookie set.' }, 200, { 'Set-Cookie': 'csrftoken=test; Path=/' })
    if (path === '/api/v1/auth/me/') return loggedIn ? json(member) : json({ detail: 'Authentication credentials were not provided.' }, 401)
    if (path === '/api/v1/auth/login/' && request.method() === 'POST') {
      loggedIn = true
      return json(member)
    }
    if (path === '/api/v1/packages/') return json([plan])
    if (path === '/api/v1/predictions/' || path === '/api/v1/recent-wins/' || path === '/api/v1/testimonials/') return json([])
    if (path === '/api/v1/me/purchases/' && request.method() === 'POST') return json(purchase(false), 201)
    if (path === '/api/v1/me/purchases/21/payment-attempts/' && request.method() === 'POST') return json(purchase(false).latest_payment, 202)
    if (path === '/api/v1/me/purchases/21/' && request.method() === 'GET') return json(purchase(true))
    return json({ detail: `Unhandled test route: ${path}` }, 404)
  })

  await page.goto('/')
  await page.getByRole('button', { name: 'Buy package' }).click()

  await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible()
  await page.getByLabel('Phone number').fill('0702000001')
  await page.getByLabel('Password').fill('member-pass-27')
  await page.getByRole('button', { name: 'Sign in and continue' }).click()

  await expect(page.getByRole('heading', { name: 'Daily Edge' })).toBeVisible()
  await expect(page.getByText('UGX 10,000', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Pay UGX 10,000' }).click()

  await expect(page.getByText('Approve the request on your phone')).toBeVisible()
  await expect(page.getByText('Payment confirmed')).toBeVisible({ timeout: 7000 })
  await expect(page.getByText('BK-DAY-78')).toBeVisible()
  await expect(page.getByRole('link', { name: 'Open betslip' })).toHaveAttribute('href', 'https://example.com/slips/daily-edge')
})
