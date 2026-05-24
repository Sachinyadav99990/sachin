const { test, expect } = require('@playwright/test');

test.describe('DecisionMirror browser smoke tests', () => {
  test('loads the dashboard and toggles theme', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Decision workspace')).toBeVisible();
    const themeButton = page.getByRole('button', { name: /toggle light and dark theme/i });
    await expect(themeButton).toBeVisible();
    const initialGlyph = await page.locator('.theme-glyph').textContent();
    await themeButton.click();
    await expect(page.locator('.theme-glyph')).not.toHaveText(initialGlyph);
  });

  test('runs simulator flow and updates result', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /simulator/i }).click();
    await expect(page.locator('form#simulatorForm')).toBeVisible();

    await page.fill('#decisionTitle', 'Test launch timing decision');
    await page.fill('#decisionContext', 'We need to decide whether to launch a new feature now while the product still needs more feedback, and the team feels pressure to move fast.');
    await page.getByRole('button', { name: 'Options' }).click();
    await expect(page.getByText('Options and outcomes')).toBeVisible();
    await page.fill('#primaryGoal', 'Balance speed with reliable customer experience');
    await page.click('button:has-text("Run analysis")');

    await expect(page.locator('#riskScore')).not.toHaveText('0%');
    await expect(page.locator('#simulatorResult')).toContainText('Strategic vector');
  });

  test('comparator renders a decision recommendation', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /comparator/i }).click();

    await page.fill('#optionA', 'Keep the current partner');
    await page.fill('#optionADesc', 'Stable support, slower growth, lower cost.');
    await page.fill('#optionB', 'Switch to new vendor');
    await page.fill('#optionBDesc', 'Faster innovation, higher risk, more integration effort.');
    await page.click('button:has-text("Compare options")');

    await expect(page.locator('#compareResult')).toContainText('Optimal Pathway');
  });

  test('coach returns a guidance summary', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /coach/i }).click();

    await page.fill('#coachPrompt', 'I am deciding whether to expand into a new market before we finish validating the pilot.');
    await page.click('button:has-text("Generate coaching prompts")');

    await expect(page.locator('#coachResult')).toContainText('Contextual Reframe');
    await expect(page.locator('#coachResult')).toContainText('Counter-Evidence Checklist');
  });
});
