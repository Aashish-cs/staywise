import { afterEach, describe, expect, it, vi } from "vitest";
import { getNearbyPlacesForLocation } from "@/lib/nearby-places";
import type { LocationLookupResult } from "@/lib/location-service";

const originalAmadeusClientId = process.env.AMADEUS_CLIENT_ID;
const originalAmadeusClientSecret = process.env.AMADEUS_CLIENT_SECRET;
const originalAmadeusBaseUrl = process.env.AMADEUS_BASE_URL;

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
    restoreEnv("AMADEUS_CLIENT_ID", originalAmadeusClientId);
    restoreEnv("AMADEUS_CLIENT_SECRET", originalAmadeusClientSecret);
    restoreEnv("AMADEUS_BASE_URL", originalAmadeusBaseUrl);
    vi.unstubAllGlobals();
  });

  it("uses Amadeus hotel offers when travel provider credentials are configured", async () => {
    process.env.AMADEUS_CLIENT_ID = "staywise-test-client";
    process.env.AMADEUS_CLIENT_SECRET = "staywise-test-secret";

    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);

      if (url.includes("/v1/security/oauth2/token")) {
        return Response.json({
          access_token: "amadeus-token",
          expires_in: 1800,
        });
      }

      if (url.includes("/v1/reference-data/locations/hotels/by-geocode")) {
        return Response.json({
          data: [
            {
              address: {
                cityName: "New Orleans",
                countryCode: "US",
                lines: ["1300 Canal Street"],
                stateCode: "LA",
              },
              chainCode: "SW",
              geoCode: {
                latitude: 29.9562708,
                longitude: -90.0744216,
              },
              hotelId: "SWNOLA1",
              name: "Royal Canal Hotel",
              rating: "4",
            },
          ],
        });
      }

      if (url.includes("/v3/shopping/hotel-offers")) {
        return Response.json({
          data: [
            {
              hotel: {
                address: {
                  cityName: "New Orleans",
                  countryCode: "US",
                  lines: ["1300 Canal Street"],
                  stateCode: "LA",
                },
                chainCode: "SW",
                geoCode: {
                  latitude: 29.9562708,
                  longitude: -90.0744216,
                },
                hotelId: "SWNOLA1",
                name: "Royal Canal Hotel",
                rating: "4",
              },
              offers: [
                {
                  id: "OFFER-123",
                  price: {
                    currency: "USD",
                    total: "243",
                  },
                  room: {
                    description: {
                      text: "King room\nFree Wi-Fi",
                    },
                  },
                },
              ],
            },
          ],
        });
      }

      return new Response("Unexpected provider request", { status: 500 });
    });

    vi.stubGlobal("fetch", fetchMock);

    const places = await getNearbyPlacesForLocation(
      {
        ...newOrleansLocation,
        providerId: "relation:amadeus-new-orleans",
      },
      {
        checkIn: "2027-01-10",
        checkOut: "2027-01-13",
        guests: 2,
      },
    );

    const offerUrl = String((fetchMock.mock.calls as Array<[RequestInfo | URL]>)[2]?.[0]);

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(offerUrl).toContain("hotelIds=SWNOLA1");
    expect(offerUrl).toContain("adults=2");
    expect(offerUrl).toContain("checkInDate=2027-01-10");
    expect(places).toHaveLength(1);
    expect(places[0]).toMatchObject({
      actionLabel: "View availability",
      address: "1300 Canal Street, New Orleans, LA, US",
      description: "King room Free Wi-Fi",
      id: "amadeus:SWNOLA1",
      name: "Royal Canal Hotel",
      priceLabel: "$243",
      source: "amadeus",
      typeLabel: "4-star hotel",
    });
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
          extratags: {
            image: "https://example.com/hotel-vinache.jpg",
            website: "https://hotel-vinache.example",
          },
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
      actionLabel: "Check availability",
      actionUrl: "https://hotel-vinache.example/",
      address: "1300 Canal Street, New Orleans, Louisiana, United States",
      id: "way:328669269",
      imageUrl: "https://example.com/hotel-vinache.jpg",
      kind: "hotel",
      mapUrl: "https://www.openstreetmap.org/way/328669269",
      name: "Hotel Vinache",
      source: "openstreetmap",
      typeLabel: "Hotel",
    });
    expect(places[0]?.distanceMiles).toBeGreaterThan(0);
    expect(places[0]?.distanceMiles).toBeLessThan(1);
  });

  it("uses a representative image and booking search when provider media and website are missing", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json([
          {
            address: {
              city: "New Orleans",
              country: "United States",
              road: "Canal Street",
              state: "Louisiana",
              tourism: "Map Only Hotel",
            },
            category: "tourism",
            lat: "29.9562708",
            lon: "-90.0744216",
            name: "Map Only Hotel",
            osm_id: 328669270,
            osm_type: "way",
            place_id: 304208242,
            type: "hotel",
          },
        ]),
      ),
    );

    const places = await getNearbyPlacesForLocation({
      ...newOrleansLocation,
      providerId: "relation:map-only",
    });

    expect(places[0]).toMatchObject({
      actionLabel: "Find booking options",
    });
    expect(places[0]?.actionUrl).toContain("duckduckgo.com");
    expect(places[0]?.actionUrl).toContain("Map%20Only%20Hotel");
    expect(places[0]?.imageUrl).toContain("images.unsplash.com");
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

  it("tries another accommodation query when the first provider response has no usable stays", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        Response.json([
          {
            address: {
              road: "North Hotel Street",
              state: "North Carolina",
            },
            category: "highway",
            lat: "34.9994837",
            lon: "-78.6394474",
            name: "North Hotel Street",
            osm_id: 3,
            osm_type: "way",
            place_id: 3,
            type: "residential",
          },
        ]),
      )
      .mockImplementation(async () =>
        Response.json([
          {
            address: {
              city: "Asheville",
              country: "United States",
              road: "Haywood Street",
              state: "North Carolina",
              tourism: "Downtown Guest House",
            },
            category: "tourism",
            lat: "35.5950581",
            lon: "-82.5561481",
            name: "Downtown Guest House",
            osm_id: 4,
            osm_type: "node",
            place_id: 4,
            type: "guest_house",
          },
        ]),
      );

    vi.stubGlobal("fetch", fetchMock);

    const places = await getNearbyPlacesForLocation({
      ...northCarolinaLocation,
      providerId: "relation:state-nc-fallback",
    });

    expect(fetchMock).toHaveBeenCalledTimes(4);
    expect(places).toHaveLength(1);
    expect(places[0]).toMatchObject({
      id: "node:4",
      kind: "guest_house",
      name: "Downtown Guest House",
      typeLabel: "Guest house",
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

function restoreEnv(key: string, value: string | undefined) {
  if (typeof value === "undefined") {
    delete process.env[key];
    return;
  }

  process.env[key] = value;
}
