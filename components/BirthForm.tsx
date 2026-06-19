"use client";

import { useState, useCallback } from "react";
import { createChartAction } from "@/app/actions/createChart";

interface GeoResult {
  name: string;
  latitude: number;
  longitude: number;
  country: string;
  admin1?: string;
}

export default function BirthForm() {
  const [timeKnown, setTimeKnown] = useState(true);
  const [cityQuery, setCityQuery] = useState("");
  const [geoResults, setGeoResults] = useState<GeoResult[]>([]);
  const [selectedCity, setSelectedCity] = useState<GeoResult | null>(null);
  const [manualLatLon, setManualLatLon] = useState(false);
  const [lat, setLat] = useState("");
  const [lon, setLon] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  const searchCities = useCallback(async (q: string) => {
    if (q.length < 2) { setGeoResults([]); return; }
    try {
      const res = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=6&language=en&format=json`
      );
      const data = await res.json();
      setGeoResults(data.results ?? []);
    } catch {
      setGeoResults([]);
    }
  }, []);

  const handleCityInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value;
    setCityQuery(q);
    setSelectedCity(null);
    searchCities(q);
  };

  const selectCity = (city: GeoResult) => {
    setSelectedCity(city);
    setCityQuery(`${city.name}, ${city.admin1 ?? ""} ${city.country}`.trim());
    setLat(city.latitude.toFixed(4));
    setLon(city.longitude.toFixed(4));
    setGeoResults([]);
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    const fd = new FormData(e.currentTarget);
    if (!lat || !lon) {
      setError("Please select a city or enter coordinates.");
      return;
    }
    fd.set("lat", lat);
    fd.set("lon", lon);
    fd.set("timeKnown", String(timeKnown));

    setPending(true);
    try {
      await createChartAction(fd);
    } catch (err: unknown) {
      // redirect() throws — expected
      const msg = err instanceof Error ? err.message : String(err);
      if (!msg.includes("NEXT_REDIRECT")) {
        setError(msg);
        setPending(false);
      }
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card p-8 flex flex-col gap-6">
      <h2
        className="font-display font-semibold text-2xl"
        style={{ color: "var(--parchment)" }}
      >
        Enter Birth Details
      </h2>

      {/* Name */}
      <Field label="Name">
        <input
          name="name"
          type="text"
          placeholder="Your name"
          className="input-field"
          required
        />
      </Field>

      {/* Date */}
      <Field label="Date of Birth">
        <input
          name="date"
          type="date"
          className="input-field"
          required
        />
      </Field>

      {/* Time */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <label className="field-label">Time of Birth</label>
          <label className="flex items-center gap-2 cursor-pointer">
            <span className="text-xs" style={{ color: "var(--muted)" }}>
              {timeKnown ? "Time known" : "Using 12:00 noon (Lagna uncertain)"}
            </span>
            <button
              type="button"
              onClick={() => setTimeKnown((v) => !v)}
              className="text-xs underline"
              style={{ color: "var(--brass)" }}
            >
              {timeKnown ? "I don't know my time" : "I know my time"}
            </button>
          </label>
        </div>
        {timeKnown && (
          <input
            name="time"
            type="time"
            className="input-field"
            defaultValue="12:00"
          />
        )}
      </div>

      {/* Place */}
      <Field label="Place of Birth">
        <div className="relative">
          <input
            type="text"
            value={cityQuery}
            onChange={handleCityInput}
            placeholder="City name…"
            className="input-field"
            autoComplete="off"
          />
          {geoResults.length > 0 && (
            <ul
              className="absolute z-20 left-0 right-0 top-full mt-1 rounded-lg overflow-hidden shadow-lg"
              style={{ background: "var(--panel-2)", border: "1px solid var(--faint)" }}
            >
              {geoResults.map((city, i) => (
                <li key={i}>
                  <button
                    type="button"
                    onClick={() => selectCity(city)}
                    className="w-full text-left px-4 py-2 text-sm transition-colors hover:bg-[rgba(200,162,74,0.08)]"
                    style={{ color: "var(--parchment)" }}
                  >
                    {city.name}
                    {city.admin1 ? `, ${city.admin1}` : ""} — {city.country}
                    <span className="ml-2 text-xs" style={{ color: "var(--faint)" }}>
                      {city.latitude.toFixed(2)}°, {city.longitude.toFixed(2)}°
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <button
          type="button"
          className="text-xs mt-1"
          style={{ color: "var(--faint)" }}
          onClick={() => setManualLatLon((v) => !v)}
        >
          {manualLatLon ? "▲ hide" : "▼ enter lat/lon manually"}
        </button>

        {manualLatLon && (
          <div className="grid grid-cols-2 gap-3 mt-2">
            <div>
              <label className="field-label text-xs">Latitude</label>
              <input
                type="number"
                step="0.0001"
                placeholder="28.6139"
                value={lat}
                onChange={(e) => setLat(e.target.value)}
                className="input-field"
              />
            </div>
            <div>
              <label className="field-label text-xs">Longitude</label>
              <input
                type="number"
                step="0.0001"
                placeholder="77.2090"
                value={lon}
                onChange={(e) => setLon(e.target.value)}
                className="input-field"
              />
            </div>
          </div>
        )}
      </Field>

      {selectedCity && (
        <p className="text-xs" style={{ color: "var(--muted)" }}>
          Using: {selectedCity.name} ({lat}°, {lon}°)
        </p>
      )}

      {error && (
        <p className="text-sm" style={{ color: "var(--error, #E07070)" }}>
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="mt-2 w-full py-3 rounded-lg font-semibold text-sm tracking-wide transition-opacity disabled:opacity-50"
        style={{ background: "var(--brass)", color: "var(--bg)" }}
      >
        {pending ? "Computing chart…" : "Compute My Kundli →"}
      </button>

      <p className="text-xs text-center" style={{ color: "var(--faint)" }}>
        Computations use Swiss Ephemeris · Lahiri ayanamsha · Whole-sign houses
      </p>
    </form>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label className="field-label">{label}</label>
      {children}
    </div>
  );
}
