import { expect, test } from "@playwright/test";

const availableCheckIn = getFutureIso(180);
const availableCheckOut = getFutureIso(183);

test("new guest can discover a stay and reach the reservation sign-in handoff", async ({
  page,
}) => {
  await page.goto("/");

  await page.getByPlaceholder("Search any city worldwide").fill("Dallas");
  await page.getByRole("button", { name: "Search stays" }).click();

  await expect(page).toHaveURL(/\/search\?destination=Dallas/);
  await expect(page.getByRole("heading", { name: "Recommended stays" })).toBeVisible();

  await page.goto(
    `/search?destination=Dallas&guests=2&checkIn=${availableCheckIn}&checkOut=${availableCheckOut}`,
  );
  await expect(page.getByRole("heading", { name: "Recommended stays" })).toBeVisible();

  await page.getByRole("link", { name: /Reserve / }).first().click();

  await expect(page.getByRole("link", { name: "Back to stays" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Booking" })).toBeVisible();

  await page.getByRole("link", { name: "Sign in to reserve" }).click();

  await expect(page).toHaveURL(/\/auth\?mode=signin/);
  await expect(page).toHaveURL(/next=/);
  await expect(page.getByRole("heading", { name: "Continue to StayWise." })).toBeVisible();
});

test("host entry flow sends unauthenticated hosts to the sign-in gate", async ({
  page,
}) => {
  await page.goto("/host/onboarding");

  await expect(page).toHaveURL(/\/auth\?mode=signin/);
  await expect(page).toHaveURL(/role=host/);
  await expect(page).toHaveURL(/next=%2Fhost%2Fonboarding/);
  await expect(page.getByRole("heading", { name: "Continue to StayWise." })).toBeVisible();
});

test("near-me flow applies browser geolocation and preserves coordinates in search", async ({
  baseURL,
  context,
  page,
}) => {
  const origin = new URL(baseURL ?? "http://127.0.0.1:3014").origin;

  await context.grantPermissions(["geolocation"], { origin });
  await context.setGeolocation({ latitude: 32.7767, longitude: -96.797 });
  await page.route("**/api/locations/reverse?*", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      json: {
        attribution: "Data © OpenStreetMap contributors, ODbL 1.0",
        location: {
          attribution: "Data © OpenStreetMap contributors, ODbL 1.0",
          bounds: {
            east: -96.46,
            north: 33.02,
            south: 32.61,
            west: -97.0,
          },
          city: "Dallas",
          country: "United States",
          countryCode: "US",
          formattedAddress: "Dallas, Texas, United States",
          lat: 32.7767,
          lng: -96.797,
          name: "Dallas",
          provider: "nominatim",
          providerId: "test:dallas",
          query: "32.7767,-96.797",
          region: "Texas",
        },
      },
      status: 200,
    });
  });

  await page.goto("/search");
  await page.getByRole("button", { name: "Use current location" }).click();

  await expect(page.getByText(/Showing stays near Dallas, Texas/)).toBeVisible();
  await expect(page.getByText("Verified place: Dallas, Texas, United States")).toBeVisible();

  await page.getByRole("button", { name: "Search StayWise" }).click();

  await expect(page).toHaveURL(/nearLat=32\.7767/);
  await expect(page).toHaveURL(/nearLng=-96\.797/);
});

test("mobile guest flow can filter, open a stay, and reach the sticky reserve path", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  await page.getByPlaceholder("Search any city worldwide").fill("Dallas");
  await page.getByRole("button", { name: "Search stays" }).click();

  await expect(page).toHaveURL(/\/search\?destination=Dallas/);
  await expect(page.getByRole("button", { name: /Filters/ })).toBeVisible();

  await page.getByRole("button", { name: /Filters/ }).click();
  await expect(page.getByRole("button", { name: "Search StayWise" })).toBeVisible();

  await page.getByRole("link", { name: /Reserve / }).first().click();

  await expect(page.getByRole("link", { name: "Back to stays" })).toBeVisible();
  const stickyReserveLink = page.getByRole("link", { exact: true, name: "Reserve" });

  await expect(stickyReserveLink).toBeVisible();

  await stickyReserveLink.click();
  await expect(page).toHaveURL(/#reserve$/);
  await expect(page.getByRole("heading", { name: "Booking" })).toBeVisible();
});

test("external hotel result opens a StayWise reservation handoff", async ({ page }) => {
  const params = new URLSearchParams({
    actionUrl: "https://hotel.example/availability",
    address: "1 Harbor Road, Limassol, Cyprus",
    destination: "Cyprus",
    guests: "2",
    id: "way:cyprus-demo-hotel",
    imageUrl:
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=900&q=80",
    kind: "hotel",
    lat: "34.7071",
    lng: "33.0226",
    mapUrl: "https://www.openstreetmap.org/way/123",
    name: "Cyprus Harbor Hotel",
    source: "openstreetmap",
    typeLabel: "Hotel",
  });

  await page.goto(`/external-stays?${params.toString()}`);

  await expect(
    page.getByRole("heading", { name: "Reserve Cyprus Harbor Hotel" }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Sign in to reserve" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Provider availability" })).toHaveAttribute(
    "href",
    "https://hotel.example/availability",
  );

  await page.getByRole("link", { name: "Sign in to reserve" }).click();

  await expect(page).toHaveURL(/\/auth\?mode=signin/);
  await expect(page).toHaveURL(/next=/);
});

function getFutureIso(daysFromNow: number) {
  const date = new Date();

  date.setUTCDate(date.getUTCDate() + daysFromNow);

  return date.toISOString().slice(0, 10);
}
