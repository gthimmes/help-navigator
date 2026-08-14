import { expect, test } from '@playwright/test';

// E2E over the built widget mounted in demo/index.html. Playwright locators
// pierce the shadow root, so these exercise the real user-facing behavior.

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Open help' })).toBeVisible();
});

test('launcher opens the panel on the home view and Esc closes it', async ({ page }) => {
  await page.getByRole('button', { name: 'Open help' }).click();
  const panel = page.getByRole('dialog', { name: 'Help' });
  await expect(panel).toBeVisible();
  await expect(panel.getByText('Suggested for this page')).toBeVisible();
  await expect(panel.getByText('Browse by topic')).toBeVisible();
  await expect(panel.getByText('Billing & plans')).toBeVisible();

  await page.keyboard.press('Escape');
  await expect(panel.getByText('Browse by topic')).not.toBeVisible();
});

test('F1 hotkey toggles the panel', async ({ page }) => {
  await page.keyboard.press('F1');
  await expect(page.getByRole('dialog', { name: 'Help' }).getByText('Browse by topic')).toBeVisible();
  await page.keyboard.press('F1');
  await expect(page.getByRole('dialog', { name: 'Help' }).getByText('Browse by topic')).not.toBeVisible();
});

test('search-as-you-type shows highlighted results and opens an article', async ({ page }) => {
  await page.getByRole('button', { name: 'Open help' }).click();
  const panel = page.getByRole('dialog', { name: 'Help' });
  await panel.getByPlaceholder('Search help articles…').fill('invoice');
  await expect(panel.locator('mark').first()).toBeVisible();

  await panel.getByRole('button', { name: /Understanding your invoice/ }).first().click();
  await expect(panel.getByRole('heading', { name: 'Understanding your invoice' })).toBeVisible();
  await expect(panel.getByText('Was this article helpful?')).toBeVisible();
});

test('category drill-down, article, breadcrumb back navigation', async ({ page }) => {
  await page.getByRole('button', { name: 'Open help' }).click();
  const panel = page.getByRole('dialog', { name: 'Help' });
  await panel.getByRole('button', { name: /Billing & plans/ }).click();
  await expect(panel.getByText('Invoices, payment methods, and upgrades.')).toBeVisible();

  await panel.getByRole('button', { name: /Understanding your invoice/ }).click();
  await expect(panel.getByRole('heading', { name: 'Understanding your invoice' })).toBeVisible();

  await panel.getByRole('button', { name: 'Back' }).click();
  await panel.getByRole('button', { name: 'Back' }).click();
  await expect(panel.getByText('Browse by topic')).toBeVisible();
});

test('data-help-open attribute trigger deep-links into an article', async ({ page }) => {
  await page.getByRole('button', { name: 'data-help-open="two-factor"' }).click();
  const panel = page.getByRole('dialog', { name: 'Help' });
  await expect(
    panel.getByRole('heading', { name: 'Enabling two-factor authentication' }),
  ).toBeVisible();
});

test('feedback buttons emit an event visible in the demo log', async ({ page }) => {
  await page.getByRole('button', { name: "help.openArticle('export-data')" }).click();
  const panel = page.getByRole('dialog', { name: 'Help' });
  await panel.getByRole('button', { name: 'Yes', exact: true }).click();
  await expect(panel.getByText('Thanks for the feedback!')).toBeVisible();
  await expect(page.locator('#event-log')).toContainText(
    'feedback {"articleId":"export-data","helpful":true}',
  );
});

test('setContext swaps the suggested articles', async ({ page }) => {
  await page.getByRole('button', { name: /Simulate route change/ }).click();
  await page.getByRole('button', { name: 'Open help' }).click();
  const panel = page.getByRole('dialog', { name: 'Help' });
  const suggested = panel.locator('.hn-body');
  await expect(suggested.getByText('Understanding your invoice')).toBeVisible();
  await expect(suggested.getByText('Managing payment methods')).toBeVisible();
});
