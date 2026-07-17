import { test, expect } from '@playwright/test'

test('app loads and canvas area is present', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('#canvas')).toBeVisible()
  await expect(page.locator('#canvas [role="application"]')).toBeVisible()
})

test('add widget button opens the widget picker', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('widgetboard-onboarded', '1')
  })
  await page.goto('/')
  await page.waitForSelector('#canvas', { state: 'visible' })

  await page.getByRole('button', { name: 'Add Widget' }).click()

  await expect(page.getByPlaceholder('Search widgets...')).toBeVisible()
  await expect(page.getByText('Note').first()).toBeVisible()
})

test('toolbar has undo/redo buttons and keyboard shortcuts modal opens', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('widgetboard-onboarded', '1')
  })
  await page.goto('/')
  await page.waitForSelector('#canvas', { state: 'visible' })

  await expect(page.locator('[role="toolbar"]')).toBeVisible()

  await page.keyboard.press('?')

  await expect(page.getByText('Keyboard Shortcuts')).toBeVisible()
  await expect(page.getByText('Show this help')).toBeVisible()

  await page.keyboard.press('Escape')
  await expect(page.getByText('Keyboard Shortcuts')).not.toBeVisible()
})
