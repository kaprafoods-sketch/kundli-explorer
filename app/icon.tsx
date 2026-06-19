import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          background: "#0B1026",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* Static mark — sun core + three orbit rings */}
        <svg width="28" height="28" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
          {/* Halo */}
          <circle cx="100" cy="100" r="38" fill="#E9C46A" opacity="0.18" />
          {/* Orbit 1 */}
          <g transform="rotate(-18 100 100)">
            <path d="M34,100 a66,24 0 1,0 132,0 a66,24 0 1,0 -132,0"
              fill="none" stroke="#e9c46a" strokeOpacity="0.45" strokeWidth="4" />
            <circle r="10" fill="#E9C46A" transform="translate(34,100)" />
          </g>
          {/* Orbit 2 */}
          <g transform="rotate(52 100 100)">
            <path d="M42,100 a58,30 0 1,0 116,0 a58,30 0 1,0 -116,0"
              fill="none" stroke="#e9c46a" strokeOpacity="0.35" strokeWidth="4" />
            <circle r="8" fill="#CDD8FF" transform="translate(42,100)" />
          </g>
          {/* Orbit 3 */}
          <g transform="rotate(108 100 100)">
            <path d="M50,100 a50,26 0 1,0 100,0 a50,26 0 1,0 -100,0"
              fill="none" stroke="#e9c46a" strokeOpacity="0.4" strokeWidth="4" />
            <circle r="7" fill="#E0922F" transform="translate(50,100)" />
          </g>
          {/* Sun core */}
          <circle cx="100" cy="100" r="22" fill="#E9C46A" />
          <circle cx="93" cy="93" r="7" fill="#fff7df" opacity="0.8" />
        </svg>
      </div>
    ),
    { ...size }
  );
}
