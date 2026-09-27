import { afterEach, describe, expect, it, vi } from "vitest";
import { getNearbyPlacesForLocation } from "@/lib/nearby-places";
import type { LocationLookupResult } from "@/lib/location-service";

const newOrleansLocation: LocationLookupResult = {
  attribution: "Data © OpenStreetMap contributors, ODbL 1.0",
  bounds: null,
  city: "New Orleans",
  country: "United States",
  countryCode: "US",
  formattedAddress: "New Orleans, Orleans Parish, Louisiana, United States",
  lat: 29.9511,
  lng: -90.0715,
  name: "New Orleans",
  provider: "nominatim",
  providerId: "relation:123",
  query: "New Orleans",
  region: "Louisiana",
};

describe("nearby places", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("maps real provider rows into nearby external places", async () => {
    const fetchMock = vi.fn(async () =>
      Response.json([
        {
          address: {
            city: "New Orleans",
            country: "United States",
            house_number: "1300",
            road: "Canal Street",
            state: "Louisiana",
            tourism: "Hotel Vinache",
          },
          display_name:
            "Hotel Vinache, 1300, Canal Street, New Orleans, Louisiana, United States",
          lat: "29.9562708",
          lon: "-90.0744216",
          name: "Hotel Vinache",
          osm_id: 328669269,
          osm_type: "way",
          place_id: 304208241,
          type: "hotel",
        },
        {
          address: {
            city: "New Orleans",
            country: "United States",
            state: "Louisiana",
            tourism: "Far Away Hotel",
          },
          lat: "31.5000000",
          lon: "-91.5000000",
          name: "Far Away Hotel",
          osm_id: 1,
          osm_type: "node",
          place_id: 1,
          type: "hotel",
        },
      ]),
    );

    vi.stubGlobal("fetch", fetchMock);

    const places = await getNearbyPlacesForLocation(newOrleansLocation);

    const calls = fetchMock.mock.calls as unknown as Array<[unknown]>;

    expect(String(calls[0]?.[0])).toContain("hotel+in+New+Orleans");
    expect(places).toHaveLength(1);
    expect(places[0]).toMatchObject({
      address: "1300 Canal Street, New Orleans, Louisiana, United States",
      id: "way:328669269",
      kind: "hotel",
      mapUrl: "https://www.openstreetmap.org/way/328669269",
      name: "Hotel Vinache",
      source: "openstreetmap",
      typeLabel: "Hotel",
    });
    expect(places[0]?.distanceMiles).toBeGreaterThan(0);
    expect(places[0]?.distanceMiles).toBeLessThan(1);
  });

  it("returns an empty fallback instead of breaking search when the provider fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("Unavailable", { status: 503 })),
    );

    const places = await getNearbyPlacesForLocation({
      ...newOrleansLocation,
      providerId: "relation:provider-failure",
    });

    expect(places).toEqual([]);
  });
});
