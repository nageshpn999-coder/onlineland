import { expect, test, type Page } from '@playwright/test';
import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

/**
 * Admin dashboard against the emulators, using the test data from scripts/seed-emulator.mjs.
 * Tests run in order and build on each other (approve → dealer → badge…).
 */
test.describe.configure({ mode: 'serial' });

const PROJECT = 'demo-onlineland';
const db = () => getFirestore(getApps()[0] ?? initializeApp({ projectId: PROJECT }));
const shot = (page: Page, name: string) => page.screenshot({ path: `test-results/screens/admin-${name}.png`, fullPage: true });

async function otpFor(phone: string): Promise<string> {
  for (let i = 0; i < 40; i++) {
    const res = await fetch(`http://127.0.0.1:9099/emulator/v1/projects/${PROJECT}/verificationCodes`);
    const { verificationCodes = [] } = (await res.json()) as { verificationCodes?: { phoneNumber: string; code: string }[] };
    const mine = verificationCodes.filter((c) => c.phoneNumber === phone);
    if (mine.length) return mine[mine.length - 1]!.code;
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error(`No OTP for ${phone}`);
}

async function login(page: Page, mobile = '9000000009', english = true) {
  await page.goto('/login/');
  if (english) await page.getByRole('button', { name: 'English' }).click();
  await page.getByLabel(english ? 'Mobile number' : 'మొబైల్ నంబర్').fill(mobile);
  await page.getByRole('button', { name: english ? 'Send OTP' : 'OTP పంపండి' }).click();
  await page.getByLabel('OTP').fill(await otpFor(`+91${mobile}`));
  await page.getByRole('button', { name: english ? 'Sign in' : 'లాగిన్ అవ్వండి' }).click();
}

test('signing in with OTP shows the overview with today’s numbers (Telugu)', async ({ page }) => {
  await login(page, '9000000009', false);
  await expect(page.getByRole('heading', { name: 'సారాంశం' })).toBeVisible();
  await expect(page.getByTestId('count-pendingListings')).toContainText('2');
  await expect(page.getByTestId('count-pendingPayments')).toContainText('1');
  await expect(page.getByTestId('count-newLeads')).toContainText('2');
  await expect(page.getByTestId('count-requestedVisits')).toContainText('1');
  await expect(page.getByTestId('count-liveListings')).toContainText('10');
  await shot(page, 'overview-te');
});

test('a buyer cannot enter the dashboard', async ({ page }) => {
  await login(page, '9000000202');
  await expect(page.getByRole('alert')).toContainText('does not have admin access');
  await page.goto('/listings/');
  await expect(page).toHaveURL(/\/login\/$/);
});

test('admin approves a pending listing and it gets the next code', async ({ page }) => {
  await login(page);
  await page.getByRole('link', { name: 'Listings' }).first().click();
  await page.getByRole('button', { name: /Pending listing/ }).click();
  await expect(page.getByRole('dialog')).toContainText('Makthal');
  await shot(page, 'listing-review');
  await page.getByRole('button', { name: 'Approve' }).click();
  await expect(page.getByRole('dialog')).toContainText('approved');
  const saved = (await db().doc('properties/seed-pending').get()).data()!;
  expect(saved.status).toBe('approved');
  expect(saved.code).toBe('OL-1011');
});

test('admin rejects a listing with a reason (sees private commission terms)', async ({ page }) => {
  await login(page);
  await page.goto('/listings/');
  await page.getByRole('button', { name: /Dealer plot/ }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toContainText('2%'); // private commission terms visible to admin only
  await dialog.getByRole('button', { name: 'Reject' }).click();
  await dialog.getByLabel('Reason for rejection').fill('Survey number missing');
  await dialog.getByRole('button', { name: 'Reject' }).click();
  await expect(dialog).toContainText('Survey number missing');
  expect((await db().doc('properties/seed-pending-2').get()).data()!.status).toBe('rejected');
});

test('admin approves a UPI payment → Basic plan active, dealer gets the ✓ badge', async ({ page }) => {
  await login(page);
  await page.getByRole('link', { name: 'Payments' }).first().click();
  await page.getByRole('button', { name: 'UTR 412345678901' }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toContainText('₹499');
  await expect(dialog).toContainText('Ravi Properties');
  await shot(page, 'payment-review');
  await dialog.getByRole('button', { name: 'Approve' }).click();
  await expect(dialog).toContainText('approved');
  const dealer = (await db().doc('dealers/seed-dealer').get()).data()!;
  expect(dealer).toMatchObject({ planId: 'basic', ownContact: true, phone: '9000000101' });

  await page.keyboard.press('Escape');
  await page.getByRole('link', { name: 'Users' }).first().click();
  await page.getByRole('button', { name: /Ravi Properties/ }).click();
  await expect(page.getByRole('dialog')).toContainText('basic');
  await page.getByRole('button', { name: 'Give ✓ badge' }).click();
  await expect(page.getByRole('button', { name: 'Remove badge' })).toBeVisible();
  expect((await db().doc('dealers/seed-dealer').get()).data()!.verified).toBe(true);
  await shot(page, 'user-dealer');
});

test('CRM: dealer-link lead is tagged; admin updates stage, notes and agent', async ({ page }) => {
  await login(page);
  await page.getByRole('link', { name: 'Leads (CRM)' }).first().click();
  await expect(page.getByRole('button', { name: /Lakshmi/ })).toContainText('Via dealer link');
  await page.getByRole('combobox', { name: 'Source' }).selectOption('direct');
  await expect(page.getByRole('button', { name: /Lakshmi/ })).toHaveCount(0);
  await page.getByRole('button', { name: /Ramesh/ }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByRole('link', { name: 'WhatsApp' })).toHaveAttribute('href', /wa\.me\/919876543210/);
  await dialog.getByLabel('Stage').selectOption('contacted');
  await dialog.getByLabel('Assign agent').selectOption({ label: 'Kiran (agent)' });
  await dialog.getByLabel('Notes').fill('Called, visiting Sunday');
  await dialog.getByRole('button', { name: 'Save' }).click();
  await expect(dialog.getByRole('status')).toContainText('Saved');
  await shot(page, 'lead');
  const lead = (await db().doc('leads/seed-lead-1').get()).data()!;
  expect(lead).toMatchObject({ stage: 'contacted', notes: 'Called, visiting Sunday', assignedAgentId: 'seed-agent' });
});

test('site visit is confirmed', async ({ page }) => {
  await login(page);
  await page.getByRole('link', { name: 'Site visits' }).first().click();
  await page.getByRole('button', { name: /Ramesh/ }).click();
  await page.getByRole('dialog').getByLabel('Status').selectOption('confirmed');
  await page.getByRole('dialog').getByRole('button', { name: 'Save' }).click();
  await expect.poll(async () => (await db().doc('siteVisits/seed-visit-1').get()).data()!.status).toBe('confirmed');
});

test('agent sees only their own leads and no admin pages', async ({ page }) => {
  await login(page, '9000000303');
  await expect(page).toHaveURL(/\/leads\/$/);
  await page.getByRole('tab', { name: 'All' }).click();
  await expect(page.getByRole('button', { name: /Venkat/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /Ramesh/ })).toBeVisible(); // assigned in the CRM test
  await expect(page.getByRole('button', { name: /Lakshmi/ })).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Payments' })).toHaveCount(0);
  await page.goto('/payments/');
  await expect(page).toHaveURL(/\/leads\/$/);
});

test('prices are edited from Settings and saved to Firestore', async ({ page }) => {
  await login(page);
  await page.getByRole('link', { name: 'Prices & settings' }).first().click();
  const basic = page.getByRole('region', { name: 'Basic' });
  await basic.getByLabel('Price per month (₹)').fill('599');
  await page.getByLabel('Your UPI ID').fill('onlineland@okaxis');
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByRole('status')).toContainText('Saved');
  await shot(page, 'settings');
  expect((await db().doc('plans/basic').get()).data()!.priceInr).toBe(599);
  expect((await db().doc('settings/pricing').get()).data()!.upiId).toBe('onlineland@okaxis');
  await page.getByRole('button', { name: 'Run the daily job now' }).click();
  await expect(page.getByRole('status')).toContainText('Done');
});

test('audit log lists what admins did', async ({ page }) => {
  await login(page);
  await page.getByRole('link', { name: 'Audit log' }).first().click();
  for (const action of ['property.approve', 'property.reject', 'payment.approve.plan', 'dealer.setVerified']) {
    await expect(page.getByRole('cell', { name: action, exact: true }).first()).toBeVisible();
  }
});

test('works on a phone screen', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await login(page);
  await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
  await page.getByRole('button', { name: 'Menu' }).click();
  await page.getByRole('link', { name: 'Leads (CRM)' }).click();
  await expect(page.getByRole('heading', { name: 'Leads (CRM)' })).toBeVisible();
  await shot(page, 'mobile-leads');
});
