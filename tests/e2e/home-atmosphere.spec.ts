import { test, expect } from "@playwright/test";

test("homepage atmospheres, real routes, keyboard and responsive frames", async ({ page, context, baseURL }) => {
  await context.addCookies([{ name: "age_confirmed", value: "1", url: baseURL! }, { name: "locale", value: "ru", url: baseURL! }]);
  for (const width of [390, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    expect((await page.goto("/"))?.status()).toBe(200);
    const panel = page.locator(".atmosphere");
    await panel.scrollIntoViewIfNeeded();
    const first = await panel.evaluate(n => getComputedStyle(n).backgroundImage);
    await panel.getByRole("button", { name: "Электрический сад" }).click();
    await expect(panel).toHaveClass(/atmosphere-electric/);
    await expect(panel.getByRole("button", { name: "Электрический сад" })).toHaveAttribute("aria-pressed", "true");
    expect(await panel.evaluate(n => getComputedStyle(n).backgroundImage)).not.toBe(first);
    await expect(panel.locator(".atmosphere-note")).toContainText("другой маршрут Flow");
    await expect(panel.getByRole("link", { name: /Запустить Flow/ })).toHaveAttribute("href", "/flow?seed=atmosphere-electric&step=0");
    await panel.getByRole("button", { name: "Хромированный свет" }).focus();
    await page.keyboard.press("Enter");
    await expect(panel).toHaveClass(/atmosphere-silver/);
    await expect(panel.getByRole("button", { name: "Хромированный свет" })).toBeFocused();
    expect(await panel.getByRole("button", { name: "Хромированный свет" }).evaluate(n => getComputedStyle(n).outlineStyle)).toBe("solid");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect(await page.locator(".home-gallery .card").first().evaluate(n => getComputedStyle(n).borderRadius)).toBe("3px");
    await panel.getByRole("button", { name: "Бархатная ночь" }).click();
    await panel.screenshot({ path: `C:/Users/sklya/AppData/Local/Temp/neyro-home-${width}.png` });
    await panel.getByRole("link", { name: /Запустить Flow/ }).click();
    await expect(page).toHaveURL(/seed=atmosphere-velvet&step=0/);
    await expect(page.locator(".flow-info h1")).toBeVisible();
    for (const route of ["/universe", "/trending", "/about"]) expect((await page.request.get(route)).status()).toBe(200);
  }
  for (const [locale, heading] of [["en", "Art has more than one temperature."], ["zh", "艺术不止一种温度。"]]) {
    await context.addCookies([{ name: "locale", value: locale, url: baseURL! }]);
    await page.goto("/");
    await expect(page.locator("#atmosphere-title")).toHaveText(heading);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
  await page.emulateMedia({ reducedMotion: "reduce" });
  expect(await page.locator(".atmosphere-portal").first().evaluate(n => getComputedStyle(n).transitionDuration)).toBe("0s");
});
