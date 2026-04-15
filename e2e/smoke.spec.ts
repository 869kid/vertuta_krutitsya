import { test, expect } from '@playwright/test';

test.describe('Smoke Tests', () => {
  test('page loads and renders wheel UI', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveTitle(/Колесо|Wheel|Pointauc/i);
    await expect(page.getByText('Варианты')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole('heading', { name: 'Колесо' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Крутить' })).toBeVisible();
    await expect(page.getByPlaceholder('Variant name...')).toBeVisible();
  });

  test('backend health endpoint responds', async ({ page }) => {
    const res = await page.request.get('http://localhost:8080/health');
    expect(res.status()).toBe(200);
  });

  test('no critical console errors on load', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    const critical = errors.filter(
      (e) => !e.includes('ResizeObserver') && !e.includes('Non-Error promise rejection'),
    );
    expect(critical).toHaveLength(0);
  });

  test('SignalR WebSocket connects', async ({ page }) => {
    const wsConnected = page.waitForEvent('websocket', {
      predicate: (ws) => ws.url().includes('/hubs/wheel'),
      timeout: 15_000,
    });

    await page.goto('/');
    const ws = await wsConnected;
    expect(ws.url()).toContain('/hubs/wheel');
  });
});
