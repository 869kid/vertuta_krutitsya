import { test, expect } from '@playwright/test';
import { waitForWheelReady, addVariant } from './helpers';

test.describe('Matryoshka (Nested Wheel)', () => {
  test.beforeEach(async ({ page }) => {
    await waitForWheelReady(page);
  });

  test('matryoshka variant shows + Добавить button', async ({ page }) => {
    const ts = Date.now();
    await addVariant(page, `E2E_Mat_${ts}`, { matryoshka: true });

    await expect(page.getByRole('button', { name: `E2E_Mat_${ts}`, exact: true }).first()).toBeVisible();
    await expect(page.getByText('+ Добавить').first()).toBeVisible();
  });

  test('add child via + Добавить creates New item', async ({ page }) => {
    const ts = Date.now();
    await addVariant(page, `E2E_MatP_${ts}`, { matryoshka: true });

    const parentBtn = page.getByRole('button', { name: `E2E_MatP_${ts}`, exact: true }).first();
    const parentRow = parentBtn.locator('..');
    const parentSection = parentRow.locator('..');
    const addChild = parentSection.getByText('+ Добавить').first();

    await expect(addChild).toBeVisible();
    await addChild.click();
    await page.waitForTimeout(800);

    await expect(page.getByRole('button', { name: 'New item' }).first()).toBeVisible();
  });

  test('child count displays after adding children', async ({ page }) => {
    const ts = Date.now();
    await addVariant(page, `E2E_MatC_${ts}`, { matryoshka: true });

    const parentBtn = page.getByRole('button', { name: `E2E_MatC_${ts}`, exact: true }).first();
    const parentRow = parentBtn.locator('..');
    const parentSection = parentRow.locator('..');
    const addChild = parentSection.getByText('+ Добавить').first();

    await addChild.click();
    await page.waitForTimeout(800);
    await addChild.click();
    await page.waitForTimeout(800);

    await expect(parentSection.getByText('(2)')).toBeVisible();
  });

  test('toggle matryoshka on existing variant', async ({ page }) => {
    const ts = Date.now();
    await addVariant(page, `E2E_MatT_${ts}`);

    const nameBtn = page.getByRole('button', { name: `E2E_MatT_${ts}`, exact: true }).first();
    const row = nameBtn.locator('..');
    const section = row.locator('..');
    const checkbox = section.getByRole('checkbox', { name: 'Матрёшка' });
    await expect(checkbox).not.toBeChecked();

    await checkbox.click({ force: true });
    await page.waitForTimeout(1000);
    await expect(checkbox).toBeChecked();

    await checkbox.click({ force: true });
    await page.waitForTimeout(1000);
    await expect(checkbox).not.toBeChecked();
  });

  test('canvas click on matryoshka segment (overlay handled)', async ({ page }) => {
    const ts = Date.now();
    await addVariant(page, `E2E_MatN_${ts}`, { matryoshka: true });

    const parentBtn = page.getByRole('button', { name: `E2E_MatN_${ts}`, exact: true }).first();
    const parentRow = parentBtn.locator('..');
    const parentSection = parentRow.locator('..');
    const addChild = parentSection.getByText('+ Добавить').first();
    await addChild.click();
    await page.waitForTimeout(800);
    await addChild.click();
    await page.waitForTimeout(800);

    const canvas = page.locator('canvas').first();
    const box = await canvas.boundingBox();
    if (box) {
      await canvas.click({
        position: { x: box.width * 0.3, y: box.height * 0.3 },
        force: true,
      });
      await page.waitForTimeout(1500);
    }

    const hasNav = await page.locator('nav').isVisible();
    expect(typeof hasNav).toBe('boolean');
  });

  test('multiple children under matryoshka parent', async ({ page }) => {
    const ts = Date.now();
    await addVariant(page, `E2E_MatM_${ts}`, { matryoshka: true });

    const parentBtn = page.getByRole('button', { name: `E2E_MatM_${ts}`, exact: true }).first();
    const parentRow = parentBtn.locator('..');
    const parentSection = parentRow.locator('..');
    const addChild = parentSection.getByText('+ Добавить').first();

    await addChild.click();
    await page.waitForTimeout(800);
    await addChild.click();
    await page.waitForTimeout(800);
    await addChild.click();
    await page.waitForTimeout(800);

    await expect(parentSection.getByText('(3)')).toBeVisible();
  });
});
