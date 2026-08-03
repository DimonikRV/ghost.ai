import { test, expect } from "@playwright/test";

test.describe("Auth Pages", () => {
  test("sign-in page contains sign-in form", async ({ page }) => {
    await page.goto("/sign-in");
    const body = page.locator("body");
    await expect(body).toBeVisible();
  });

  test("sign-up page contains sign-up form", async ({ page }) => {
    await page.goto("/sign-up");
    const body = page.locator("body");
    await expect(body).toBeVisible();
  });

  test("sign-in page has Clerk components", async ({ page }) => {
    await page.goto("/sign-in");
    await page.waitForLoadState("networkidle");
    await expect(page.locator(".cl-rootBox")).toBeVisible();
  });
});
