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

const northCarolinaLocation: LocationLookupResult = {
  attribution: "Data © OpenStreetMap contributors, ODbL 1.0",
  bounds: {
    east: -75.400119,
    north: 36.588157,
    south: 33.752878,
    west: -84.3218293,
  },
  city: null,
  country: "United States",
  countryCode: "US",
  formattedAddress: "North Carolina, United States",
  lat: 35.6729639,
  lng: -79.0392919,
  name: "North Carolina",
  provider: "nominatim",
  providerId: "relation:state-nc",
  query: "North Carolina",
  region: "North Carolina",
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
          category: "tourism",
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
          category: "tourism",
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

  it("keeps real hotels inside a broad state search even when they are far from the state center", async () => {
    const fetchMock = vi.fn(async () =>
      Response.json([
        {
          address: {
            city: "Charlotte",
            country: "United States",
            house_number: "100",
            road: "West Trade Street",
            state: "North Carolina",
            tourism: "Charlotte Marriott City Center",
          },
          category: "tourism",
          lat: "35.2280306",
          lon: "-80.8434695",
          name: "Charlotte Marriott City Center",
          osm_id: 485370001,
          osm_type: "way",
          place_id: 1,
          type: "hotel",
        },
        {
          address: {
            city: "North Charleston",
            country: "United States",
            road: "International Boulevard",
            state: "South Carolina",
            tourism: "South Carolina Hotel",
          },
          category: "tourism",
          lat: "32.8663887",
          lon: "-80.019412",
          name: "South Carolina Hotel",
          osm_id: 485370002,
          osm_type: "way",
          place_id: 2,
          type: "hotel",
        },
      ]),
    );

    vi.stubGlobal("fetch", fetchMock);

    const places = await getNearbyPlacesForLocation(northCarolinaLocation);

    expect(places).toHaveLength(1);
    expect(places[0]).toMatchObject({
      address: "100 West Trade Street, Charlotte, North Carolina, United States",
      distanceMiles: null,
      id: "way:485370001",
      name: "Charlotte Marriott City Center",
      typeLabel: "Hotel",
    });
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
