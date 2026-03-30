/**
 * @module core-journey.spec
 * @description Happy path execution modeling exactly how a normal user handles group creation, 
 *              expense splitting, and payment resolution over the React DOM natively.
 */

const { test, expect } = require('@playwright/test');

test.describe('SplitSmart Primary User Journey', () => {
    
  test('User can register, create group, add expense, and settle up', async ({ browser }) => {
    // We instantiate two separate contexts mapping two users isolated without leaking cookies
    const contextUserA = await browser.newContext();
    const contextUserB = await browser.newContext();

    const pageA = await contextUserA.newPage();
    const pageB = await contextUserB.newPage();

    // 1. Register User B (so they exist in DB)
    await pageB.goto('/auth?tab=register');
    await pageB.fill('input[name="name"]', 'Bob Smith');
    await pageB.fill('input[name="email"]', 'bob.smith@corejourney.com');
    await pageB.fill('input[name="password"]', 'Password123');
    await pageB.click('button[type="submit"]');
    await expect(pageB).toHaveURL('/dashboard');

    // 2. Register User A
    await pageA.goto('/auth?tab=register');
    await pageA.fill('input[name="name"]', 'Alice Jones');
    await pageA.fill('input[name="email"]', 'alice.jones@corejourney.com');
    await pageA.fill('input[name="password"]', 'Password123');
    await pageA.click('button[type="submit"]');
    
    // 3. User A creates a Group
    await pageA.click('button:has-text("Create Group")');
    await pageA.fill('input[name="groupName"]', 'Mountain Trip');
    await pageA.click('button:has-text("Save")');
    await expect(pageA.locator('text=Mountain Trip')).toBeVisible();

    // 4. Invite User B into Group (Assumption: Search by email/name works in UI)
    await pageA.click('text=Mountain Trip');
    await pageA.click('button:has-text("Add Member")');
    await pageA.fill('input[name="searchMember"]', 'bob.smith@corejourney.com');
    await pageA.click('text=Bob Smith');
    
    // Verify Bob is rendered
    await expect(pageA.locator('.avatar:has-text("BS")')).toBeVisible();

    // 5. User A adds a $100 "Lunch" Expense equally split natively
    await pageA.click('button:has-text("Add Expense")');
    await pageA.fill('input[name="title"]', 'Ski Hub Lunch');
    await pageA.fill('input[name="amount"]', '100'); // Triggers mask converting to 100.00
    // Select Bob and Alice explicitly
    await pageA.click('text=Alice Jones');
    await pageA.click('text=Bob Smith');
    // Save
    await pageA.click('button:has-text("Confirm Expense")');

    // Verify Expense shows up and Balances map natively on user A
    await expect(pageA.locator('text=Ski Hub Lunch')).toBeVisible();
    await pageA.click('text=Balances');
    await expect(pageA.locator('text=Bob Smith owes you $50.00')).toBeVisible();

    // 6. User B verifies state and clicks Settle Up
    await pageB.goto('/dashboard');
    await pageB.click('text=Mountain Trip');
    await pageB.click('text=Balances');
    await expect(pageB.locator('text=You owe Alice Jones $50.00')).toBeVisible();
    
    await pageB.click('button:has-text("Settle Up")');
    await pageB.fill('input[name="amount"]', '50');
    await pageB.click('button:has-text("Record Payment")');

    // 7. Verify perfectly resolved state
    await expect(pageB.locator('text=You owe Alice Jones $50.00')).toBeHidden();
    await expect(pageB.locator('text=Settled Up')).toBeVisible();
    
    await contextUserA.close();
    await contextUserB.close();
  });
});
