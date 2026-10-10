import { test, expect } from "@playwright/test";

test("discovery controls, metadata and layout at 390 / 1280", async ({ page, context, baseURL }) => {
  await context.addCookies([{ name: "age_confirmed", value: "1", url: baseURL! }, { name: "locale", value: "ru", url: baseURL! }]);
  const noOverflow = async () => expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy();
  for (const width of [390, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    const response = await page.goto("/universe");
    expect(response?.status()).toBe(200);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", "https://neyroeros.com/universe");
    await noOverflow();
    await expect(page.locator(".universe-tag").first()).toBeVisible();
    expect(await page.locator('script[type="application/ld+json"]').evaluateAll(nodes => nodes.every(n => { JSON.parse(n.textContent || ""); return true; }))).toBeTruthy();
    if (width === 390) {
      await page.getByRole("button", { name: "Меню", exact: true }).click();
      await expect(page.locator("#mobile-drawer").getByRole("link", { name: "Universe", exact: true })).toBeVisible();
      await expect(page.locator("#mobile-drawer").getByRole("link", { name: "Flow", exact: true })).toBeVisible();
      await page.keyboard.press("Escape");
    } else {
      await expect(page.locator("body>header>nav").getByRole("link", { name: "Universe", exact: true })).toBeVisible();
      await expect(page.locator("body>header>nav").getByRole("link", { name: "Flow", exact: true })).toBeVisible();
    }
    await page.goto("/flow?seed=browser&step=0");
    await expect(page.getByTestId("flow-next")).toBeVisible();
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "noindex, follow");
    await noOverflow();
    const original = await page.locator(".flow-info>.button").getAttribute("href");
    await page.getByTestId("flow-next").click();
    await expect(page).toHaveURL(/seed=browser&step=1/);
    await noOverflow();
    await page.getByTestId("flow-back").click();
    await expect(page).toHaveURL(/seed=browser&step=0/);
    await expect(page.locator(".flow-info>.button")).toHaveAttribute("href", original!);
    await page.reload();
    await expect(page.locator(".flow-info>.button")).toHaveAttribute("href", original!);
    await expect(page.locator(".flow-tags a").first()).toHaveAttribute("href", /^\/tags\//);
    await page.goto("/");
    await page.getByTestId("density-comfortable").click();
    const before = await page.locator(".masonry").evaluate(n => getComputedStyle(n).columnCount);
    await page.getByTestId("density-compact").click();
    await expect(page.locator(".gallery-density")).toHaveAttribute("data-density", "compact");
    const after = await page.locator(".masonry").evaluate(n => getComputedStyle(n).columnCount);
    expect(after).not.toBe(before);
    await noOverflow();
    await page.reload();
    await expect(page.locator(".gallery-density")).toHaveAttribute("data-density", "compact");
    await expect(page.getByTestId("density-compact")).toHaveAttribute("aria-pressed", "true");
  }
  const sitemap = await page.request.get("/sitemap.xml");
  expect(await sitemap.text()).toContain("https://neyroeros.com/universe");
});
