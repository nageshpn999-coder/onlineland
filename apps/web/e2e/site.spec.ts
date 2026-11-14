import { expect, test, type Page } from '@playwright/test';
import { getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Admin SDK talks to the Firestore emulator (FIRESTORE_EMULATOR_HOST is set by emulators:exec).
const app = getApps()[0] ?? initializeApp({ projectId: 'demo-onlineland' });
const db = getFirestore(app);

const SHOTS = 'test-results/screens';
const results = (page: Page) => page.getByTestId('results').locator('article');

async function waitFor<T>(fn: () => Promise<T | null | undefined>, ms = 15_000): Promise<T> {
  const until = Date.now() + ms;
  for (;;) {
    const v = await fn();
    if (v) return v;
    if (Date.now() > until) throw new Error('Timed out');
    await new Promise((r) => setTimeout(r, 300));
  }
}

test.describe('listings page', () => {
  test('shows only approved sale listings, featured first', async ({ page }) => {
    await page.goto('/te/properties');
    await expect(page.locator('#results-count')).toHaveText('9 ఆస్తులు');
    await expect(results(page).first()).toContainText('OL-1001');
    await expect(page.getByText('Pending listing (hidden)')).toHaveCount(0);
    await expect(page.getByText('అమ్ముడైన ప్లాట్')).toHaveCount(0);
    await page.screenshot({ path: `${SHOTS}/listings-desktop-te.png`, fullPage: true });
  });

  test('filters by type, district, mandal and budget', async ({ page }) => {
    await page.goto('/te/properties?type=agricultural&district=narayanpet');
    await expect(page.locator('#results-count')).toHaveText('3 ఆస్తులు');
    await page.goto('/te/properties?type=agricultural&district=narayanpet&mandal=makthal');
    await expect(page.locator('#results-count')).toHaveText('1 ఆస్తి');
    await page.goto('/te/properties?type=agricultural&district=narayanpet&budget=1000000-2500000');
    await expect(page.locator('#results-count')).toHaveText('1 ఆస్తి');
    await expect(results(page).first()).toContainText('OL-1004');
    await page.goto('/en/properties?purpose=rent');
    await expect(page.locator('#results-count')).toHaveText('1 property');
  });

  test('changing a filter in the form updates results immediately', async ({ page }) => {
    await page.goto('/te/properties');
    const desktopFilters = page.locator('aside > div').last();
    await desktopFilters.getByLabel('జిల్లా').selectOption('narayanpet');
    await page.waitForURL(/district=narayanpet/);
    await expect(page.locator('#results-count')).toHaveText('5 ఆస్తులు');
    await page.getByLabel('క్రమం').selectOption('price-asc');
    await page.waitForURL(/sort=price-asc/);
    await expect(results(page).first()).toContainText('OL-1010');
  });

  test('no results offers WhatsApp with the search', async ({ page }) => {
    await page.goto('/te/properties?type=villa&district=narayanpet');
    await expect(page.getByText('మీ వెతుకులాటకు సరిపోయే ఆస్తులు ఇప్పుడు లేవు')).toBeVisible();
    const href = await page.getByRole('link', { name: 'WhatsApp లో అడగండి' }).getAttribute('href');
    expect(decodeURIComponent(href!)).toContain('విల్లాలు');
  });

  test('mobile layout', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/te/properties');
    await page.getByText('ఫిల్టర్లు').first().click();
    await page.screenshot({ path: `${SHOTS}/listings-mobile-te.png`, fullPage: false });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });
});

test.describe('property page', () => {
  test('shows details, gallery, price and WhatsApp with the code', async ({ page }) => {
    await page.goto('/te/properties/OL-1001');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('బోర్‌వెల్ ఉన్న వ్యవసాయ భూమి');
    await expect(page.getByText('₹70 లక్షలు').first()).toBeVisible();
    await expect(page.getByText('₹14 లక్షలు ఎకరానికి').first()).toBeVisible();
    await expect(page.getByText('ఫోటో 1 / 3')).toBeVisible();
    await page.getByRole('button', { name: 'తర్వాత ఫోటో' }).click();
    await expect(page.getByText('ఫోటో 2 / 3')).toBeVisible();
    const wa = await page.getByTestId('whatsapp-link').first().getAttribute('href');
    expect(decodeURIComponent(wa!)).toContain('OL-1001');
    await expect(page.locator('script[type="application/ld+json"]')).toHaveCount(1);
    await page.screenshot({ path: `${SHOTS}/property-desktop-te.png`, fullPage: true });
  });

  test('English version', async ({ page }) => {
    await page.goto('/en/properties/OL-1001');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Farmland with borewell');
    await expect(page.getByText('₹70 lakh').first()).toBeVisible();
  });

  test('pending, sold and unknown listings are not shown', async ({ page }) => {
    for (const code of ['OL-0999', 'OL-9999', 'not-a-code']) {
      const res = await page.goto(`/te/properties/${code}`);
      expect(res?.status()).toBe(404);
      await expect(page.getByText('ఈ పేజీ దొరకలేదు')).toBeVisible();
    }
  });

  test('enquiry form validates the number and saves a lead', async ({ page }) => {
    await page.goto('/te/properties/OL-1002');
    const form = page.locator('aside form');
    await form.getByLabel('మీ పేరు').fill('E2E Tester');
    await form.getByLabel('మొబైల్ నంబర్').fill('12345');
    await form.getByRole('button', { name: 'Enquiry పంపండి' }).click();
    await expect(form.getByText('సరైన 10 అంకెల మొబైల్ నంబర్ ఇవ్వండి', { exact: false })).toBeVisible();
    await form.getByLabel('మొబైల్ నంబర్').fill('+91 98765 43210');
    await form.getByLabel('సందేశం (ఐచ్ఛికం)').fill('Price negotiable?');
    await form.getByRole('button', { name: 'Enquiry పంపండి' }).click();
    await expect(page.getByTestId('enquiry-sent')).toBeVisible();

    const lead = await waitFor(async () => {
      const snap = await db.collection('leads').where('propertyId', '==', 'seed-1002').where('channel', '==', 'form').get();
      return snap.docs.map((d) => d.data()).find((d) => d.name === 'E2E Tester');
    });
    expect(lead).toMatchObject({ phone: '9876543210', stage: 'new', assignedAgentId: null, locale: 'te', message: 'Price negotiable?' });
  });

  test('site visit booking saves a visit and a lead', async ({ page }) => {
    await page.goto('/te/properties/OL-1003');
    const form = page.locator('section[aria-labelledby="visit"] form');
    await form.getByLabel('మీ పేరు').fill('Visit Tester');
    await form.getByLabel('మొబైల్ నంబర్').fill('9123456780');
    await form.getByText('సాయంత్రం (3–6)').click();
    await form.getByRole('button', { name: 'విజిట్ బుక్ చేయండి' }).click();
    await expect(page.getByTestId('visit-sent')).toBeVisible();

    const visit = await waitFor(async () => {
      const snap = await db.collection('siteVisits').where('propertyId', '==', 'seed-1003').get();
      return snap.docs.map((d) => d.data()).find((d) => d.name === 'Visit Tester');
    });
    expect(visit).toMatchObject({ phone: '9123456780', slot: 'evening', status: 'requested', agentId: null });
    const lead = await db.doc(`leads/${visit.leadId}`).get();
    expect(lead.data()).toMatchObject({ channel: 'site-visit', propertyId: 'seed-1003' });
  });

  test('mobile layout with bottom contact bar', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/te/properties/OL-1001');
    await expect(page.locator('.fixed.bottom-0').getByText('WhatsApp', { exact: true })).toBeVisible();
    await page.screenshot({ path: `${SHOTS}/property-mobile-te.png`, fullPage: false });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });
});

test.describe('favorites and homepage', () => {
  test('save, list and remove a favorite', async ({ page }) => {
    await page.goto('/te/properties/OL-1005');
    await page.getByRole('button', { name: 'సేవ్ చేయండి' }).click();
    await expect(page.getByRole('button', { name: 'సేవ్ అయ్యింది' })).toHaveAttribute('aria-pressed', 'true');
    await page.goto('/te/favorites');
    await expect(page.getByTestId('favorites')).toContainText('OL-1005');
    await page.screenshot({ path: `${SHOTS}/favorites-desktop-te.png` });
    await page.getByRole('button', { name: 'తీసేయండి' }).click();
    await expect(page.getByText('ఇంకా ఏ ఆస్తీ సేవ్ చేయలేదు')).toBeVisible();
  });

  test('homepage shows real listings with the featured one first', async ({ page }) => {
    await page.goto('/te');
    const featured = page.locator('#featured article');
    await expect(featured).toHaveCount(6);
    await expect(featured.first()).toContainText('OL-1001');
    await page.setViewportSize({ width: 390, height: 844 });
    await page.locator('#featured').scrollIntoViewIfNeeded();
    await page.screenshot({ path: `${SHOTS}/home-featured-mobile-te.png` });
  });

  test('homepage search goes to filtered listings', async ({ page }) => {
    await page.goto('/te');
    const search = page.getByRole('search');
    await search.getByLabel('ఆస్తి రకం').selectOption('agricultural');
    await search.getByLabel('ప్రాంతం').selectOption('narayanpet');
    await search.getByRole('button', { name: 'వెతకండి' }).click();
    await page.waitForURL(/\/te\/properties\?.*district=narayanpet/);
    await expect(page.locator('#results-count')).toHaveText('3 ఆస్తులు');
  });
});
