import { NextResponse } from "next/server";

const GMAPS_API_KEY = process.env.NEXT_PUBLIC_GMAPSAPI;

type PlaceResult = {
  id: string;
  label: string;
  lat: number | null;
  lng: number | null;
  mapsUrl: string;
};

// GET /api/places?q=...
export async function GET(request: Request) {
  if (!GMAPS_API_KEY) {
    return NextResponse.json(
      { error: "Google Maps API key not configured" },
      { status: 500 },
    );
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");

  if (!query || query.trim().length < 3) {
    return NextResponse.json<PlaceResult[]>([]);
  }

  try {
    const url = new URL(
      "https://maps.googleapis.com/maps/api/place/textsearch/json",
    );
    url.searchParams.set("query", query);
    url.searchParams.set("key", GMAPS_API_KEY);

    const res = await fetch(url.toString());
    if (!res.ok) {
      console.error("[places] Google API error", res.status, await res.text());
      return NextResponse.json(
        { error: "Upstream places API failed" },
        { status: 502 },
      );
    }

    const data = await res.json();
    const results: PlaceResult[] = Array.isArray(data.results)
      ? data.results.slice(0, 6).map((r: any) => {
          const name: string = r.name ?? "";
          const address: string = r.formatted_address ?? "";
          const label =
            address && !address.toLowerCase().includes(name.toLowerCase())
              ? `${name}, ${address}`
              : name || address;
          const lat = r.geometry?.location?.lat ?? null;
          const lng = r.geometry?.location?.lng ?? null;
          const placeId: string = r.place_id ?? "";
          const mapsUrl = placeId
            ? `https://www.google.com/maps/place/?q=place_id:${placeId}`
            : lat != null && lng != null
              ? `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
              : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                  label,
                )}`;

          return {
            id: placeId || label,
            label,
            lat,
            lng,
            mapsUrl,
          };
        })
      : [];

    return NextResponse.json(results);
  } catch (error) {
    console.error("[GET /api/places] error", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

