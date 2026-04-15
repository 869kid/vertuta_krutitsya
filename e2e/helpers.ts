import { type Page, expect } from '@playwright/test';

/**
 * Waits for the wheel page to be fully loaded and SignalR connected.
 */
export const waitForWheelReady = async (page: Page) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await expect(page.getByText('Варианты')).toBeVisible({ timeout: 15_000 });
};

/**
 * Returns the first author button on the page (the one in the add-card area).
 * Uses aria-haspopup="listbox" which Mantine Combobox sets.
 */
export const getFirstAuthorButton = (page: Page) => {
  return page.locator('button[aria-haspopup="listbox"]').first();
};

/** Adds a top-level variant via the ghost add-card input. */
export const addVariant = async (page: Page, name: string, opts?: { matryoshka?: boolean }) => {
  if (opts?.matryoshka) {
    const checkbox = page.getByRole('checkbox', { name: 'Матрёшка' }).first();
    if (!(await checkbox.isChecked())) {
      await checkbox.check();
    }
  }

  const input = page.getByPlaceholder('Variant name...');
  await input.fill(name);
  await input.press('Enter');
  await page.waitForTimeout(800);

  if (opts?.matryoshka) {
    const checkbox = page.getByRole('checkbox', { name: 'Матрёшка' }).first();
    if (await checkbox.isChecked()) {
      await checkbox.uncheck();
    }
  }
};

/** Clicks the spin button. */
export const clickSpin = async (page: Page) => {
  await page.getByRole('button', { name: 'Крутить' }).click();
};
