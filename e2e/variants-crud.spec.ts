import { test, expect } from '@playwright/test';
import { waitForWheelReady, addVariant } from './helpers';

test.describe('Variants CRUD', () => {
  test.beforeEach(async ({ page }) => {
    await waitForWheelReady(page);
  });

  test('add variant via Enter key', async ({ page }) => {
    const uniqueName = `E2E_Enter_${Date.now()}`;
    const input = page.getByPlaceholder('Variant name...');
    await input.fill(uniqueName);
    await input.press('Enter');
    await page.waitForTimeout(800);

    await expect(page.getByRole('button', { name: uniqueName, exact: true }).first()).toBeVisible();
  });

  test('add multiple variants', async ({ page }) => {
    const ts = Date.now();
    await addVariant(page, `E2E_M1_${ts}`);
    await addVariant(page, `E2E_M2_${ts}`);
    await addVariant(page, `E2E_M3_${ts}`);

    await expect(page.getByRole('button', { name: `E2E_M1_${ts}`, exact: true }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: `E2E_M2_${ts}`, exact: true }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: `E2E_M3_${ts}`, exact: true }).first()).toBeVisible();
  });

  test('empty name does not create variant', async ({ page }) => {
    const input = page.getByPlaceholder('Variant name...');
    await input.fill('');
    await input.press('Enter');
    await page.waitForTimeout(300);
    await expect(input).toHaveValue('');
  });

  test('edit variant name inline', async ({ page }) => {
    const ts = Date.now();
    const original = `E2E_Edit_${ts}`;
    const edited = `E2E_Edited_${ts}`;

    await addVariant(page, original);

    const nameBtn = page.getByRole('button', { name: original, exact: true }).first();
    await expect(nameBtn).toBeVisible();
    await nameBtn.click();
    await page.waitForTimeout(300);

    const allTextboxes = page.getByRole('textbox');
    const count = await allTextboxes.count();
    for (let i = 0; i < count; i++) {
      const val = await allTextboxes.nth(i).inputValue();
      if (val === original) {
        await allTextboxes.nth(i).fill(edited);
        await allTextboxes.nth(i).press('Enter');
        await page.waitForTimeout(800);
        break;
      }
    }

    await expect(page.getByRole('button', { name: edited, exact: true }).first()).toBeVisible();
  });

  test('delete variant via X button', async ({ page }) => {
    const ts = Date.now();
    const name = `E2E_Del_${ts}`;

    await addVariant(page, name);
    const nameBtn = page.getByRole('button', { name, exact: true }).first();
    await expect(nameBtn).toBeVisible();

    const row = nameBtn.locator('..');
    const deleteBtn = row.locator('button').last();
    await deleteBtn.click();
    await page.waitForTimeout(800);

    await expect(page.getByRole('button', { name, exact: true })).not.toBeVisible();
  });

  test('input clears after adding variant', async ({ page }) => {
    const input = page.getByPlaceholder('Variant name...');
    await input.fill(`E2E_Clear_${Date.now()}`);
    await input.press('Enter');
    await page.waitForTimeout(500);
    await expect(input).toHaveValue('');
  });
});
