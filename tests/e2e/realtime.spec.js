/**
 * @module realtime.spec
 * @description Hardcore E2E assertion validating dual-browser WebSockets natively synchronize
 *              React Query mutations across separate isolated sessions instantly.
 */

const { test, expect } = require('@playwright/test');

test.describe('WebSocket Synchronization Engine', () => {

  test('Expense added by User A perfectly appears for User B without any screen-reload', async ({ browser }) => {
    // Launch Chrome Context A
    const contextA = await browser.newContext();
    const pageA = await contextA.newPage();
    
    // Launch Chrome Context B
    const contextB = await browser.newContext();
    const pageB = await contextB.newPage();

    // Simulated Authentication natively overriding headers/localstorage
    await pageA.goto('/mock-login?user=u1&group=g1'); 
    await pageB.goto('/mock-login?user=u2&group=g1'); 

    // Point both browsers strictly into the Group Dashboard simultaneously
    await pageA.goto('/group/g1');
    await pageB.goto('/group/g1');

    // Validate Baseline
    await expect(pageA.locator('text=Secret Agent Dinner')).toBeHidden();
    await expect(pageB.locator('text=Secret Agent Dinner')).toBeHidden();

    // User A inputs new data
    await pageA.click('button:has-text("Add Expense")');
    await pageA.fill('input[name="title"]', 'Secret Agent Dinner');
    await pageA.fill('input[name="amount"]', '200');
    // Ensure both users selected implicitly
    await pageA.click('button:has-text("Confirm Expense")');

    // As soon as User A hits save, the UI for User B should mutate natively receiving the socket push
    await expect(pageB.locator('text=Secret Agent Dinner')).toBeVisible({ timeout: 2000 });
    
    // Assert math was injected flawlessly without UI action
    await pageB.click('text=Balances');
    await expect(pageB.locator('text=You owe $100.00')).toBeVisible({ timeout: 1000 });
    
    await contextA.close();
    await contextB.close();
  });

});
