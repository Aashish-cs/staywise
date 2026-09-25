import { expect, test } from "@playwright/test";

test("account menu and home search controls are clickable", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: "Open account menu" }).click();
  const accountMenu = page.getByRole("region", { name: "Account menu" });
  await expect(accountMenu).toBeVisible();
  await expect(accountMenu.getByRole("link", { name: "Sign in" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("region", { name: "Account menu" })).toBeHidden();

  await page.getByPlaceholder(/Search .* or any city|Search destinations/).fill("Dallas");
  await page.getByRole("button", { name: "Search stays" }).click();
  await expect(page).toHaveURL(/\/search\?destination=Dallas/);
});

test("auth tabs, role choices, password toggle, and validation feedback work", async ({
  page,
}) => {
  await page.goto("/auth?mode=signup&role=host");

  await expect(page.getByRole("heading", { name: "Start with a verified account." })).toBeVisible();
  await page.getByRole("radio", { name: "Host" }).click();
  await expect(page.getByRole("radio", { name: "Host" })).toHaveAttribute("aria-checked", "true");

  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByRole("heading", { name: "Continue to StayWise." })).toBeVisible();
  await page.getByLabel("Email").fill("qa@example.com");
  const passwordInput = page.getByPlaceholder("At least 8 characters");
  await passwordInput.fill("short");
  await page.getByRole("button", { name: "Show password" }).click();
  await expect(passwordInput).toHaveAttribute("type", "text");
  await page.getByRole("button", { name: /^Sign in$/ }).last().click();
  await expect(page.getByText("Password must be at least 8 characters.")).toBeVisible();
});

test("search filters, guest picker, sort, and map toggle respond", async ({ page }) => {
  await page.goto("/search?destination=Dallas&guests=2&budget=300&purpose=remote-work");

  await page.getByRole("button", { name: /2 guests 16 max/ }).click();
  await expect(page.getByRole("dialog", { name: "Choose guests" })).toBeVisible();
  await page.getByRole("button", { name: "Increase Adults" }).click();
  await expect(page.getByRole("button", { name: /3 guests 16 max/ })).toBeVisible();
  await page.keyboard.press("Escape");

  await page.getByRole("button", { name: "Apartment" }).click();
  await expect(page.getByRole("button", { name: "Apartment" })).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Fast Wi-Fi" }).click();
  await expect(page.getByRole("button", { name: "Fast Wi-Fi" })).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("spinbutton", { name: /Budget/ }).fill("320");
  await page.getByRole("button", { name: "Search StayWise" }).click();
  await expect(page).toHaveURL(/budget=320/);

  await page.getByRole("combobox", { name: "Sort results" }).selectOption("price-low");
  await expect(page.getByRole("combobox", { name: "Sort results" })).toHaveValue("price-low");
  await page.getByRole("button", { name: "Map view" }).click();
  await expect(page.getByRole("button", { name: "Map view" })).toHaveAttribute("aria-pressed", "true");
});

test("listing action buttons and gallery modal behave", async ({ page }) => {
  await page.goto(
    "/listings/33333333-3333-4333-8333-333333333333?destination=Dallas&guests=2&budget=300&purpose=remote-work&page=2",
  );

  await page.getByRole("button", { name: "Show all photos" }).click();
  await expect(page.getByRole("dialog", { name: /photo gallery/ })).toBeVisible();
  await expect(page).toHaveURL(/#photos$/);
  await page.getByRole("button", { name: "Close photo gallery" }).click();
  await expect(page.getByRole("dialog", { name: /photo gallery/ })).toBeHidden();

  await page.getByRole("button", { name: "Share" }).click();
  await expect(
    page.getByText(/Listing link copied|Copy this page URL from your browser/),
  ).toBeVisible();

  await page.getByRole("button", { name: "Save" }).click();
  await expect(page).toHaveURL(/\/auth\?mode=signin/);
});
