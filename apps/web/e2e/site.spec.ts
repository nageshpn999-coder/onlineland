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

test.describe('share links and dealers (D7)', () => {
  test('share button opens WhatsApp with the listing link', async ({ page, context }) => {
    await page.goto('/te/properties/OL-1001');
    const popup = context.waitForEvent('page');
    await page.getByTestId('share-button').click();
    const wa = await popup;
    const url = decodeURIComponent(wa.url());
    expect(url).toContain('OL-1001');
    expect(url).toMatch(/\/te\/properties\/OL-1001/);
    await wa.close();
  });

  test('a Pro dealer’s own link shows the dealer’s number and credits the enquiry', async ({ page }) => {
    await page.goto('/te/properties/OL-1010?ref=seed-pro');
    await expect(page.getByTestId('dealer-note').first()).toContainText('Sai Estates');
    await expect(page.getByTestId('whatsapp-link').first()).toHaveAttribute('href', /wa\.me\/919000000404/);
    await expect(page.getByTestId('call-link').first()).toHaveAttribute('href', 'tel:+919000000404');
    await expect(page.getByTestId('enquiry-privacy')).toContainText('Sai Estates');
    await expect(page.getByText('మీ enquiry Sai Estates కు మరియు OnlineLand team కు వెళ్తుంది.')).toBeVisible();
    // Contact buttons keep their full height in the side panel (they were squashed before).
    const box = await page.getByTestId('whatsapp-link').first().boundingBox();
    expect(box!.height).toBeGreaterThanOrEqual(44);
    await page.screenshot({ path: `${SHOTS}/property-dealer-link.png`, fullPage: true });

    const form = page.locator('form').filter({ has: page.getByTestId('enquiry-privacy') });
    await form.getByLabel(/పేరు/).fill('Dealer Lead Test');
    await form.getByLabel(/మొబైల్|ఫోన్/).fill('9876501234');
    await form.getByRole('button').click();
    await expect(page.getByTestId('enquiry-sent')).toBeVisible();
    const lead = await waitFor(async () => {
      const q = await db.collection('leads').where('name', '==', 'Dealer Lead Test').get();
      return q.docs[0]?.data();
    });
    expect(lead.refId).toBe('seed-pro');
  });

  test('without a ref (or a wrong ref) everything goes to OnlineLand; the ✓ badge still shows', async ({ page }) => {
    for (const url of ['/te/properties/OL-1010', '/te/properties/OL-1010?ref=someone-else', '/te/properties/OL-1001?ref=seed-pro']) {
      await page.goto(url);
      await expect(page.getByTestId('whatsapp-link').first()).toHaveAttribute('href', /wa\.me\/919959731120/);
      await expect(page.getByTestId('dealer-note')).toHaveCount(0);
    }
    await page.goto('/en/properties/OL-1010');
    await expect(page.getByText('Sai Estates ✓ Verified dealer')).toBeVisible();
  });

  test('Pro dealer page lists their properties with their contact', async ({ page }) => {
    await page.goto('/te/dealer/seed-pro');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Sai Estates');
    await expect(page.locator('a[href="tel:+919000000404"]')).toBeVisible();
    const card = page.locator('article').filter({ hasText: 'OL-1010' });
    await expect(card.getByRole('link').first()).toHaveAttribute('href', /OL-1010\?ref=seed-pro/);
    await page.screenshot({ path: `${SHOTS}/dealer-page.png`, fullPage: true });
    const res = await page.goto('/te/dealer/seed-dealer');
    expect(res?.status()).toBe(404);
  });
});

test.describe('launch readiness (Phase 8)', () => {
  test('privacy, terms, refund and account-deletion pages exist in both languages and are in the footer', async ({ page }) => {
    for (const [locale, title] of [
      ['te', 'గోప్యతా విధానం'],
      ['en', 'Privacy Policy'],
    ] as const) {
      await page.goto(`/${locale}/legal/privacy`);
      await expect(page.getByRole('heading', { level: 1 })).toContainText(title);
    }
    for (const doc of ['terms', 'refund', 'delete-account']) {
      expect((await page.goto(`/en/legal/${doc}`))?.status()).toBe(200);
    }
    await page.goto('/te');
    await page.getByRole('contentinfo').getByRole('link', { name: 'గోప్యతా విధానం' }).click();
    await expect(page).toHaveURL(/\/te\/legal\/privacy$/);
  });

  test('old onlineland.in pages keep working (cards, demos, poster, blog)', async ({ page, request }) => {
    for (const url of ['/c/siri/', '/c/onlineland/', '/demo/dental/', '/demo/dental/dental2/', '/poster/', '/blog.html']) {
      const res = await request.get(url);
      expect(res.status(), url).toBe(200);
      expect(await res.text(), url).toContain('<html');
    }
    const noSlash = await request.get('/c/siri', { maxRedirects: 0 });
    expect(noSlash.status()).toBe(308);
    expect(noSlash.headers()['location']).toMatch(/\/c\/siri\/$/);
    expect((await request.get('/c/siri/photo.jpg')).headers()['content-type']).toContain('image');
    const sw = await request.get('/sw.js');
    expect(await sw.text()).toContain('unregister');
    await page.goto('/index.html');
    await expect(page).toHaveURL(/\/te$/);
  });

  test('sitemap lists listings in both languages; robots points to it', async ({ request }) => {
    const xml = await (await request.get('/sitemap.xml')).text();
    expect(xml).toContain('/te/properties/OL-1001');
    expect(xml).toContain('/en/properties/OL-1001');
    expect(xml).not.toContain('OL-0999'); // sold
    expect(xml).toContain('/te/legal/privacy');
    const robots = await (await request.get('/robots.txt')).text();
    expect(robots).toContain('Sitemap:');
    expect(robots).toContain('Disallow: /api/');
  });

  test('a bot filling the hidden field gets "sent" but nothing is saved', async ({ page }) => {
    await page.goto('/en/properties/OL-1002');
    const form = page.locator('form').filter({ has: page.getByTestId('enquiry-privacy') });
    await form.getByLabel(/name/i).first().fill('Spam Bot');
    await form.getByLabel(/mobile/i).fill('9876509999');
    await form.locator('input[name="company"]').fill('spam inc', { force: true });
    await form.getByRole('button').click();
    await expect(page.getByTestId('enquiry-sent')).toBeVisible();
    await page.waitForTimeout(1500);
    expect((await db.collection('leads').where('name', '==', 'Spam Bot').get()).size).toBe(0);
  });

  test('no serious accessibility problems on the main pages', async ({ page }) => {
    const { default: AxeBuilder } = await import('@axe-core/playwright');
    for (const url of ['/te', '/te/properties', '/te/properties/OL-1001', '/en/legal/privacy', '/te/favorites']) {
      await page.goto(url);
      const { violations } = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
      const bad = violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
      expect(bad.map((v) => `${url}: ${v.id} — ${v.nodes.slice(0, 3).map((n) => n.target.join(' ')).join(' | ')}`)).toEqual([]);
    }
  });
});
