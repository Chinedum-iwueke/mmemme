import { ImageResponse } from "next/og";
export const alt = "MMEMME — Lagos weddings, brought together";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export default function Image() {
  return new ImageResponse(
    <div
      style={{
        alignItems: "flex-start",
        background: "#294A41",
        color: "white",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        justifyContent: "space-between",
        padding: "72px",
        width: "100%",
      }}
    >
      <div style={{ color: "#97C354", fontSize: 34, fontWeight: 700, letterSpacing: 4 }}>
        MMEMME
      </div>
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            fontSize: 82,
            fontWeight: 800,
            lineHeight: 1,
          }}
        >
          <span>Find the place.</span>
          <span>Book with clarity.</span>
        </div>
        <div style={{ color: "#d2ddd5", fontSize: 28, marginTop: 28 }}>
          Curated Lagos wedding venues and caterers.
        </div>
      </div>
    </div>,
    size,
  );
}
