import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          background: "radial-gradient(ellipse at 30% 40%, #16204A 0%, #0B1026 55%, #05060F 100%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 32,
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Star field — decorative dots */}
        {[
          [60,80],[180,140],[320,60],[500,100],[700,50],[900,120],[1100,80],[1050,200],
          [150,300],[400,280],[600,320],[800,260],[1000,340],[200,500],[500,480],[850,510],
          [1100,450],[80,400],[350,400],[650,430],[950,400],
        ].map(([x, y], i) => (
          <div key={i} style={{
            position: "absolute",
            left: x,
            top: y,
            width: i % 3 === 0 ? 3 : 2,
            height: i % 3 === 0 ? 3 : 2,
            borderRadius: "50%",
            background: i % 4 === 0 ? "#E9C46A" : "#CDD8FF",
            opacity: 0.3 + (i % 5) * 0.12,
          }} />
        ))}

        {/* Mark */}
        <svg width="160" height="160" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
          <circle cx="100" cy="100" r="38" fill="#E9C46A" opacity="0.22" />
          <g transform="rotate(-18 100 100)">
            <path d="M34,100 a66,24 0 1,0 132,0 a66,24 0 1,0 -132,0"
              fill="none" stroke="#e9c46a" strokeOpacity="0.45" strokeWidth="2.5" />
            <circle r="9" fill="#E9C46A" transform="translate(34,100)" />
          </g>
          <g transform="rotate(52 100 100)">
            <path d="M42,100 a58,30 0 1,0 116,0 a58,30 0 1,0 -116,0"
              fill="none" stroke="#e9c46a" strokeOpacity="0.35" strokeWidth="2.5" />
            <circle r="7" fill="#CDD8FF" transform="translate(42,100)" />
          </g>
          <g transform="rotate(108 100 100)">
            <path d="M50,100 a50,26 0 1,0 100,0 a50,26 0 1,0 -100,0"
              fill="none" stroke="#e9c46a" strokeOpacity="0.4" strokeWidth="2.5" />
            <circle r="6" fill="#E0922F" transform="translate(50,100)" />
          </g>
          <circle cx="100" cy="100" r="20" fill="none" stroke="#ffe9a8" strokeOpacity="0.3" strokeWidth="2" />
          <circle cx="100" cy="100" r="16" fill="#E9C46A" />
          <circle cx="93" cy="93" r="5.5" fill="#fff7df" opacity="0.85" />
        </svg>

        {/* Wordmark */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
          <span style={{
            fontFamily: "Georgia, serif",
            fontSize: 96,
            letterSpacing: "0.05em",
            color: "#E2E8F4",
            lineHeight: 1,
            fontWeight: 400,
          }}>
            Graha
          </span>
          {/* Tagline with rules */}
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <div style={{ width: 80, height: 1, background: "#E9C46A", opacity: 0.35 }} />
            <span style={{
              fontFamily: "system-ui, sans-serif",
              fontSize: 18,
              letterSpacing: "0.34em",
              textTransform: "uppercase",
              color: "#E9C46A",
              opacity: 0.8,
            }}>
              Read Your Universe
            </span>
            <div style={{ width: 80, height: 1, background: "#E9C46A", opacity: 0.35 }} />
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
