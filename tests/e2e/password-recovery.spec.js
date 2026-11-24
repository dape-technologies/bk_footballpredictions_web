import { expect, test } from '@playwright/test'

function json(route, body, status = 200, headers = {}) {
  return route.fulfill({ status, contentType: 'application/json', headers, body: JSON.stringify(body) })
}

const customer = {
  id: 21,
  phone: '0705444001',
  first_name: 'Amina',
  surname: 'Nabirye',
  full_name: 'Amina Nabirye',
  is_owner: false,
  is_developer: false,
  recovery_configured: false,
}

test.beforeEach(async ({ page }) => {
  page.on('pageerror', (error) => { throw error })
})

test('customer resets a forgotten password with both recovery answers', async ({ page }) => {
  await page.route('**/api/v1/**', async (route) => {
    const path = new URL(route.request().url()).pathname
    if (path.endsWith('/auth/csrf/')) return json(route, { csrfToken: 'test' }, 200, { 'Set-Cookie': 'csrftoken=test; Path=/' })
    if (path.endsWith('/auth/me/')) return json(route, { detail: 'Not authenticated.' }, 401)
    if (path.endsWith('/auth/password-recovery/start/')) {
      return json(route, { recovery_id: 'recovery-123', expires_in: 600, prompts: [] }, 202)
    }
    if (path.endsWith('/auth/password-recovery/complete/')) {
      return json(route, { detail: 'Your password was reset. Sign in and set new recovery answers.' })
    }
    return json(route, {})
  })

  await page.goto('/forgot-password')
  await page.getByLabel('Phone number').fill(customer.phone)
  await page.getByRole('button', { name: 'Continue', exact: true }).click()
  await page.getByLabel('What private word or phrase will you always remember?').fill('Lake breeze memory')
  await page.getByLabel('What nickname or special phrase reminds you of someone important in your life?').fill('Senga called me Sunshine')
  await page.getByLabel('New password', { exact: true }).fill('new-pass')
  await page.getByLabel('Confirm new password').fill('new-pass')
  await page.getByRole('button', { name: 'Reset password' }).click()

  await expect(page.getByRole('heading', { name: 'Password reset.' })).toBeVisible()
  await expect(page.getByText('Sign in and set new recovery answers')).toBeVisible()
})

test('existing customer must configure recovery answers after login', async ({ page }) => {
  let loggedIn = false
  await page.route('**/api/v1/**', async (route) => {
    const path = new URL(route.request().url()).pathname
    if (path.endsWith('/auth/csrf/')) return json(route, { csrfToken: 'test' }, 200, { 'Set-Cookie': 'csrftoken=test; Path=/' })
    if (path.endsWith('/auth/me/')) return loggedIn ? json(route, customer) : json(route, { detail: 'Not authenticated.' }, 401)
    if (path.endsWith('/auth/login/')) {
      loggedIn = true
      return json(route, customer)
    }
    if (path.endsWith('/auth/recovery-profile/')) {
      return json(route, { ...customer, recovery_configured: true })
    }
    return json(route, [])
  })

  await page.goto('/login')
  await page.getByLabel('Phone number').fill(customer.phone)
  await page.getByLabel('Password').fill('old-pass')
  await page.getByRole('button', { name: 'Continue securely' }).click()

  await expect(page.getByRole('heading', { name: 'Set answers you can remember.' })).toBeVisible()
  await page.getByLabel('Current password').fill('old-pass')
  await page.getByLabel('What private word or phrase will you always remember?').fill('Lake breeze memory')
  await page.getByLabel('What nickname or special phrase reminds you of someone important in your life?').fill('Senga called me Sunshine')
  await page.getByRole('button', { name: 'Save recovery answers' }).click()

  await expect(page.getByRole('heading', { name: 'Set answers you can remember.' })).toHaveCount(0)
})
