import { test, expect } from "@playwright/test";

test.describe("public smoke", () => {
  test("landing page loads", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText(/review instantly/i)).toBeVisible();
  });

  test("docs page loads", async ({ page }) => {
    await page.goto("/docs");
    await expect(page.getByRole("heading", { name: /how shipflow works/i })).toBeVisible();
  });

  test("sign-in page loads", async ({ page }) => {
    await page.goto("/sign-in");
    await expect(page.getByText(/welcome back/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();
  });
});
