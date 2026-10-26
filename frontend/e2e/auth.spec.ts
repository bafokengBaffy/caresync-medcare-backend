import { test, expect } from '@playwright/test';
test('login page renders', async ({ page }) => {
  await page.goto('/auth/login');
  await expect(page.getByText('Welcome back')).toBeVisible();
  await expect(page.getByLabel('Email')).toBeVisible();
});
