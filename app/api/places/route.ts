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
    // Use Places Autocomplete so results are more generic / global.
    const url = new URL(
      "https://maps.googleapis.com/maps/api/place/autocomplete/json",
    );
    url.searchParams.set("input", query);
    url.searchParams.set("key", GMAPS_API_KEY);
    // Only address / geocode-style results
    url.searchParams.set("types", "geocode");
    // Keep UI predictable regardless of device locale
    url.searchParams.set("language", "en");
    // Hint that results can come from anywhere (full-world rectangle)
    url.searchParams.set("locationbias", "rect:-90,-180|90,180");

    const res = await fetch(url.toString());
    if (!res.ok) {
      console.error("[places] Google API error", res.status, await res.text());
      return NextResponse.json(
        { error: "Upstream places API failed" },
        { status: 502 },
      );
    }

    const data = await res.json();

    if (data.status && data.status !== "OK") {
      console.error("[places] Google Autocomplete status", data.status, data.error_message);
    }

    const predictions = Array.isArray(data.predictions) ? data.predictions : [];
    const results: PlaceResult[] = predictions.slice(0, 6).map((p: any) => {
      const label: string = p.description ?? "";
      const placeId: string = p.place_id ?? label;
      const mapsUrl = `https://www.google.com/maps/search/?api=1&query=place_id:${encodeURIComponent(
        placeId,
      )}`;

      return {
        id: placeId,
        label,
        lat: null,
        lng: null,
        mapsUrl,
      };
    });

    return NextResponse.json(results);
  } catch (error) {
    console.error("[GET /api/places] error", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

