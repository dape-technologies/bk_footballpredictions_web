import { test, expect } from '@playwright/test'

for (const role of ['owner', 'developer']) {
  test(`${role} login requires OTP before opening the dashboard`, async ({ page }) => {
    let loginCalls = 0
    await page.route('**/api/v1/**', async (route) => {
      const path = new URL(route.request().url()).pathname
      if (path.endsWith('/auth/csrf/')) {
        await route.fulfill({ contentType: 'application/json', body: JSON.stringify({ csrfToken: 'test' }) })
        return
      }
      if (path.endsWith('/auth/me/')) {
        await route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ detail: 'Not authenticated.' }) })
        return
      }
      if (path.endsWith('/auth/admin-login/')) {
        loginCalls += 1
        const result = loginCalls === 1
          ? { otp_required: true, challenge_token: 'secure-test-challenge', message: 'A six-digit verification code was sent to the security email account.' }
          : { id: 1, full_name: 'BK Privileged User', is_owner: role === 'owner', is_developer: role === 'developer' }
        await route.fulfill({ status: loginCalls === 1 ? 202 : 200, contentType: 'application/json', body: JSON.stringify(result) })
        return
      }
      await route.fulfill({ contentType: 'application/json', body: '{}' })
    })

    await page.goto(`/${role}/login`)
    await page.getByLabel(/phone number/i).fill('0700000000')
    await page.getByLabel('Password').fill('secure-password')
    await page.getByRole('button', { name: 'Continue securely' }).click()
    await expect(page.getByLabel('Login verification code')).toBeVisible()
    await expect(page.getByText(/six-digit verification code was sent/i)).toBeVisible()
    await page.getByLabel('Login verification code').fill('731904')
    await page.getByRole('button', { name: 'Verify and enter' }).click()
    await expect(page).toHaveURL(new RegExp(`/${role}/dashboard$`))
    expect(loginCalls).toBe(2)
  })
}
