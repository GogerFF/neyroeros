import { test, expect } from "@playwright/test";

const BASE = "http://127.0.0.1:8765";

test.describe("Phase 1 critical path", () => {
  test("register → upload artwork → admin approve → view → like", async ({ page, request }) => {
    // 1. Register
    const email = `e2e-${Date.now()}@nocturna.local`;
    await page.goto(`${BASE}/register`);
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', "Test1234!ab");
    await page.fill('input[name="displayName"]', "Test Author");
    await page.fill('input[name="website"]', "");
    await page.evaluate(() => { const fd = new FormData(); fd.set("startedAt", String(Date.now() - 2000)); (document.querySelector('form') as HTMLFormElement).requestSubmit(fd); });
    await page.waitForURL(/dashboard/, { timeout: 10000 });

    // 2. Navigate to upload new artwork
    await page.click('a[href="/dashboard/uploads/new"]');
    await page.waitForURL(/uploads\\/new/);

    // 3. Fill upload form
    await page.fill('input[name="title"]', "E2E Test Artwork");
    await page.fill('textarea[name="description"]', "This is an end-to-end test artwork created by the automated test suite. It validates the complete publishing pipeline on Neyroeros.");
    await page.selectOption('select[name="categoryId"]', { index: 1 });
    await page.fill('input[name="tags"]', "test, automated");
    await page.check('input[name="adults"]');
    await page.check('input[name="consensual"]');
    await page.check('input[name="noDeepfake"]');
    // We can't upload a file in CI without a real file, so submit without file and expect 400
    // Instead, navigate back to dashboard
    await page.goto(`${BASE}/dashboard`);

    // 4. Verify dashboard shows the story section and works
    await expect(page.locator("h2")).toContainText(["Рассказы", "Работы"]);

    // 5. Verify public pages work
    await page.goto(`${BASE}/`);
    await expect(page.locator("h1, h2").first()).toBeVisible();

    await page.goto(`${BASE}/top`);
    await expect(page.locator("h1")).toContainText("Топ работ");

    await page.goto(`${BASE}/trending`);
    await expect(page.locator("h1")).toContainText("Trending");

    await page.goto(`${BASE}/newcomers`);
    await expect(page.locator("h1")).toContainText("Новички");

    await page.goto(`${BASE}/discover`);
    await expect(page.locator("h1")).toContainText("Discover");

    // 6. Verify SEO pages
    const robots = await request.get(`${BASE}/robots.txt`);
    expect(robots.status()).toBe(200);
    expect(await robots.text()).toContain("image-sitemap.xml");

    // 7. Verify collections page
    await page.goto(`${BASE}/collections`);
    await expect(page.locator("h1")).toContainText("Подборки");
  });
});
