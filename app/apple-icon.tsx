import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 180,
          height: 180,
          borderRadius: 40,
          background: "linear-gradient(145deg, #16204A 0%, #0B1026 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <svg width="140" height="140" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
          <circle cx="100" cy="100" r="38" fill="#E9C46A" opacity="0.2" />
          <g transform="rotate(-18 100 100)">
            <path d="M34,100 a66,24 0 1,0 132,0 a66,24 0 1,0 -132,0"
              fill="none" stroke="#e9c46a" strokeOpacity="0.5" strokeWidth="3" />
            <circle r="9" fill="#E9C46A" transform="translate(34,100)" />
          </g>
          <g transform="rotate(52 100 100)">
            <path d="M42,100 a58,30 0 1,0 116,0 a58,30 0 1,0 -116,0"
              fill="none" stroke="#e9c46a" strokeOpacity="0.35" strokeWidth="3" />
            <circle r="7" fill="#CDD8FF" transform="translate(42,100)" />
          </g>
          <g transform="rotate(108 100 100)">
            <path d="M50,100 a50,26 0 1,0 100,0 a50,26 0 1,0 -100,0"
              fill="none" stroke="#e9c46a" strokeOpacity="0.42" strokeWidth="3" />
            <circle r="6" fill="#E0922F" transform="translate(50,100)" />
          </g>
          <circle cx="100" cy="100" r="20" fill="none" stroke="#ffe9a8" strokeOpacity="0.3" strokeWidth="2" />
          <circle cx="100" cy="100" r="18" fill="#E9C46A" />
          <circle cx="93" cy="93" r="6" fill="#fff7df" opacity="0.85" />
        </svg>
      </div>
    ),
    { ...size }
  );
}
