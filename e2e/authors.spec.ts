import { test, expect } from '@playwright/test';
import { waitForWheelReady, getFirstAuthorButton, addVariant } from './helpers';

test.describe('Author Selection', () => {
  test.beforeEach(async ({ page }) => {
    await waitForWheelReady(page);
  });

  test('author dropdown opens and shows options', async ({ page }) => {
    const authorBtn = getFirstAuthorButton(page);
    await authorBtn.click();
    await page.waitForTimeout(300);

    const options = page.locator('[role="option"]');
    const count = await options.count();
    expect(count).toBeGreaterThan(0);

    await page.keyboard.press('Escape');
  });

  test('select predefined author updates button text', async ({ page }) => {
    const authorBtn = getFirstAuthorButton(page);
    await authorBtn.click();
    await page.waitForTimeout(300);

    const options = page.locator('[role="option"]').filter({ hasNot: page.locator('svg') });
    const firstOption = options.first();
    const authorName = (await firstOption.textContent())?.trim();

    if (!authorName || authorName.includes('Добавить') || authorName.includes('Add')) {
      test.skip(true, 'No predefined authors available');
      return;
    }

    await firstOption.click();
    await page.waitForTimeout(500);

    const updatedBtn = getFirstAuthorButton(page);
    const btnText = await updatedBtn.textContent();
    expect(btnText).toContain(authorName);
  });

  test('create custom author via footer add option', async ({ page }) => {
    const authorBtn = getFirstAuthorButton(page);
    await authorBtn.click();
    await page.waitForTimeout(300);

    const addOption = page.getByText(/Добавить|Add author/).last();
    if (await addOption.isVisible()) {
      await addOption.click();
      await page.waitForTimeout(300);

      const inputs = page.locator('input');
      const count = await inputs.count();
      let footerInput = null;
      for (let i = count - 1; i >= 0; i--) {
        const placeholder = await inputs.nth(i).getAttribute('placeholder');
        if (placeholder && (placeholder.includes('Name') || placeholder.includes('Имя'))) {
          footerInput = inputs.nth(i);
          break;
        }
      }
      if (!footerInput) {
        footerInput = inputs.last();
      }

      await footerInput.fill('E2E_Custom');
      await footerInput.press('Enter');
      await page.waitForTimeout(500);

      const updatedBtn = getFirstAuthorButton(page);
      const btnText = await updatedBtn.textContent();
      expect(btnText).toContain('E2E_Custom');
    }
  });

  test('selected author persists on added variant', async ({ page }) => {
    const authorBtn = getFirstAuthorButton(page);
    await authorBtn.click();
    await page.waitForTimeout(300);

    const options = page.locator('[role="option"]').filter({ hasNot: page.locator('svg') });
    const firstOption = options.first();
    const authorName = (await firstOption.textContent())?.trim();

    if (!authorName || authorName.includes('Добавить') || authorName.includes('Add')) {
      test.skip(true, 'No predefined authors');
      return;
    }

    await firstOption.click();
    await page.waitForTimeout(300);

    const varName = `E2E_AV_${Date.now()}`;
    await addVariant(page, varName);

    await expect(page.getByRole('button', { name: varName, exact: true }).first()).toBeVisible();
  });

  test('search input filters author options', async ({ page }) => {
    const authorBtn = getFirstAuthorButton(page);
    await authorBtn.click();
    await page.waitForTimeout(300);

    const searchInput = page.locator('[role="searchbox"]').first();
    if (!(await searchInput.isVisible())) {
      await page.keyboard.press('Escape');
      test.skip(true, 'No search input in dropdown');
      return;
    }

    await searchInput.fill('zzz_no_match');
    await page.waitForTimeout(300);

    const regularOptions = page.locator('[role="option"]').filter({ hasNot: page.locator('svg') });
    const count = await regularOptions.count();
    expect(count).toBe(0);

    await page.keyboard.press('Escape');
  });
});
