import { expect, test } from "@playwright/test";

test("home page exposes the premium marketplace shell", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveTitle(/Smart Stays, Better Days/);
  await expect(page.getByRole("link", { name: "StayWise home" })).toBeVisible();
  await expect(page.getByText("Real stays, smarter matching, zero guesswork.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Search stays" })).toBeVisible();
});

test("search page renders Dallas results with preserved listing context", async ({ page }) => {
  await page.goto(
    "/search?destination=Dallas&guests=2&budget=300&purpose=remote-work",
  );

  await expect(page).toHaveTitle(/Dallas stays/);
  await expect(page.getByRole("heading", { name: /Recommended stays|Live stays need attention/ })).toBeVisible();
  await expect(page.getByText("Smart sort weighs budget")).toBeVisible();

  const firstReserveLink = page.getByRole("link", { name: /Reserve / }).first();
  await expect(firstReserveLink).toHaveAttribute("href", /destination=Dallas/);
  await expect(firstReserveLink).toHaveAttribute("href", /budget=300/);
});

test("listing detail loads booking surface and keeps back-to-search context", async ({ page }) => {
  await page.goto(
    "/listings/33333333-3333-4333-8333-333333333333?destination=Dallas&guests=2&budget=300&purpose=remote-work&page=2",
  );

  await expect(page).toHaveTitle(/StayWise/);
  await expect(page.getByRole("link", { name: "Back to stays" })).toHaveAttribute("href", /page=2/);
  await expect(page.getByRole("heading", { name: "Booking" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Sign in to reserve" })).toHaveAttribute("href", /page%3D2/);
});

test("protected guest and host routes redirect unauthenticated users to sign in", async ({
  page,
}) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/auth\?mode=signin/);
  await expect(page.getByRole("heading", { name: "Continue to StayWise." })).toBeVisible();

  await page.goto("/host");
  await expect(page).toHaveURL(/\/auth\?mode=signin/);
  await expect(page.getByRole("heading", { name: "Continue to StayWise." })).toBeVisible();
});

test("unknown routes use the branded not-found page", async ({ page }) => {
  const response = await page.goto("/definitely-not-a-staywise-route");

  expect(response?.status()).toBe(404);
  await expect(page).toHaveTitle(/Page not found/);
  await expect(page.getByRole("heading", { name: "This StayWise path got lost." })).toBeVisible();
});
