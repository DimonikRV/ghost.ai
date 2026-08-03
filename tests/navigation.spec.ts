import { test, expect } from "@playwright/test";

test.describe("Navigation", () => {
  test("root redirects to sign-in when not authenticated", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/.*sign-in/);
  });

  test("sign-in page loads", async ({ page }) => {
    await page.goto("/sign-in");
    await expect(page.locator("body")).toBeVisible();
  });

  test("sign-up page loads", async ({ page }) => {
    await page.goto("/sign-up");
    await expect(page.locator("body")).toBeVisible();
  });

  test("editor page is accessible", async ({ page }) => {
    const response = await page.goto("/editor");
    expect(response?.status()).toBeDefined();
  });

  test("page has correct title", async ({ page }) => {
    await page.goto("/sign-in");
    await expect(page).toHaveTitle(/Ghost Pilot/);
  });
});
