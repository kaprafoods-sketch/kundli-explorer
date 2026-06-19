"use client";

import { useState, useCallback, useRef } from "react";

interface GeoResult {
  name: string;
  latitude: number;
  longitude: number;
  country: string;
  country_code?: string;
  admin1?: string;
}

export interface PlaceValue {
  display: string;
  lat: number;
  lon: number;
}

interface Props {
  value: PlaceValue | null;
  onChange: (v: PlaceValue) => void;
}

export default function PlaceSearch({ value, onChange }: Props) {
  const [query, setQuery] = useState(value?.display ?? "");
  const [results, setResults] = useState<GeoResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [manualLat, setManualLat] = useState(value ? String(value.lat) : "");
  const [manualLon, setManualLon] = useState(value ? String(value.lon) : "");
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const search = useCallback(async (q: string) => {
    if (q.length < 2) { setResults([]); return; }
    setLoading(true);
    try {
      const res = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=7&language=en&format=json`
      );
      const data = await res.json();
      setResults(data.results ?? []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  function handleInput(e: React.ChangeEvent<HTMLInputElement>) {
    const q = e.target.value;
    setQuery(q);
    if (value) onChange({ ...value, display: q });
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(q), 220);
  }

  function selectCity(city: GeoResult) {
    const display = [city.name, city.admin1, city.country].filter(Boolean).join(", ");
    setQuery(display);
    setResults([]);
    setManualLat(city.latitude.toFixed(4));
    setManualLon(city.longitude.toFixed(4));
    onChange({ display, lat: city.latitude, lon: city.longitude });
  }

  function applyManual() {
    const lat = parseFloat(manualLat);
    const lon = parseFloat(manualLon);
    if (!isNaN(lat) && !isNaN(lon)) {
      onChange({ display: query || `${lat.toFixed(4)}, ${lon.toFixed(4)}`, lat, lon });
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* Search input */}
      <div style={{ position: "relative" }}>
        <div
          style={{
            position: "absolute",
            left: 16,
            top: "50%",
            transform: "translateY(-50%)",
            fontSize: 18,
            pointerEvents: "none",
          }}
        >
          🔍
        </div>
        <input
          type="text"
          value={query}
          onChange={handleInput}
          placeholder="Search city… e.g. Delhi, Mumbai, Jaipur"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          style={{
            width: "100%",
            padding: "14px 16px 14px 48px",
            borderRadius: 14,
            border: "1.5px solid rgba(200,162,74,0.22)",
            background: "rgba(255,255,255,0.04)",
            color: "var(--parchment)",
            fontSize: 15,
            fontFamily: "var(--font-ui, system-ui)",
            outline: "none",
            boxSizing: "border-box",
            transition: "border-color 0.18s ease",
          }}
          onFocus={(e) => { e.target.style.borderColor = "rgba(200,162,74,0.5)"; }}
          onBlur={(e) => { e.target.style.borderColor = "rgba(200,162,74,0.22)"; setTimeout(() => setResults([]), 200); }}
        />
        {loading && (
          <div
            style={{
              position: "absolute",
              right: 16,
              top: "50%",
              transform: "translateY(-50%)",
              width: 16,
              height: 16,
              border: "2px solid rgba(200,162,74,0.2)",
              borderTopColor: "var(--brass)",
              borderRadius: "50%",
              animation: "spin 0.7s linear infinite",
            }}
          />
        )}
      </div>

      {/* Autocomplete dropdown */}
      {results.length > 0 && (
        <ul
          style={{
            margin: 0,
            padding: 0,
            listStyle: "none",
            background: "rgba(11,16,38,0.97)",
            border: "1px solid rgba(200,162,74,0.2)",
            borderRadius: 14,
            overflow: "hidden",
            boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
          }}
        >
          {results.map((city, i) => (
            <li key={i}>
              <button
                type="button"
                onMouseDown={() => selectCity(city)}
                style={{
                  width: "100%",
                  minHeight: 48,
                  padding: "12px 16px",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  background: "none",
                  border: "none",
                  borderBottom: i < results.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "background 0.1s ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(200,162,74,0.07)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
                onTouchStart={(e) => (e.currentTarget.style.background = "rgba(200,162,74,0.12)")}
                onTouchEnd={(e) => (e.currentTarget.style.background = "none")}
              >
                <span style={{ fontSize: 18, flexShrink: 0 }}>📍</span>
                <div>
                  <p style={{ margin: 0, fontSize: 14, color: "var(--parchment)", fontFamily: "var(--font-ui, system-ui)", fontWeight: 500 }}>
                    {city.name}{city.admin1 ? `, ${city.admin1}` : ""}
                  </p>
                  <p style={{ margin: "2px 0 0", fontSize: 11.5, color: "rgba(142,151,184,0.6)", fontFamily: "var(--font-ui, system-ui)" }}>
                    {city.country} · {city.latitude.toFixed(2)}°N, {city.longitude.toFixed(2)}°E
                  </p>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Selected city pill */}
      {value && !results.length && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 14px",
            background: "rgba(200,162,74,0.07)",
            border: "1px solid rgba(200,162,74,0.22)",
            borderRadius: 10,
          }}
        >
          <span style={{ color: "var(--brass)", fontSize: 14 }}>✓</span>
          <span style={{ fontSize: 12.5, color: "var(--parchment)", fontFamily: "var(--font-ui, system-ui)", flex: 1 }}>
            {value.display}
          </span>
          <span style={{ fontSize: 10.5, color: "rgba(142,151,184,0.5)", fontFamily: "var(--font-ui, system-ui)" }}>
            {value.lat.toFixed(2)}°, {value.lon.toFixed(2)}°
          </span>
        </div>
      )}

      {/* Advanced section */}
      <button
        type="button"
        onClick={() => setShowAdvanced((v) => !v)}
        style={{
          background: "none",
          border: "none",
          padding: "4px 0",
          cursor: "pointer",
          fontSize: 12,
          color: "rgba(142,151,184,0.5)",
          fontFamily: "var(--font-ui, system-ui)",
          display: "flex",
          alignItems: "center",
          gap: 6,
          alignSelf: "flex-start",
          transition: "color 0.15s ease",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "var(--brass)")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(142,151,184,0.5)")}
      >
        <span style={{ fontSize: 10 }}>{showAdvanced ? "▲" : "▼"}</span>
        Advanced Location Settings
      </button>

      {showAdvanced && (
        <div
          style={{
            animation: "fadeSlideUp 0.22s ease both",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 10,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(142,151,184,0.5)", fontFamily: "var(--font-ui, system-ui)" }}>
              Latitude
            </label>
            <input
              type="number"
              step="0.0001"
              placeholder="28.6139"
              value={manualLat}
              onChange={(e) => setManualLat(e.target.value)}
              onBlur={applyManual}
              className="input-field"
              style={{ fontSize: 13 }}
            />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(142,151,184,0.5)", fontFamily: "var(--font-ui, system-ui)" }}>
              Longitude
            </label>
            <input
              type="number"
              step="0.0001"
              placeholder="77.2090"
              value={manualLon}
              onChange={(e) => setManualLon(e.target.value)}
              onBlur={applyManual}
              className="input-field"
              style={{ fontSize: 13 }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
