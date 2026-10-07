import { ImageResponse } from "next/og";

// Default image when the site or a page without its own photo is shared (WhatsApp, Facebook...).
export const alt = "YM Textiles: Pakistani clothing, stocked in the UK";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "radial-gradient(circle at 30% 20%, #2c6a57, #1f4d3f 55%, #16332a)",
        color: "#fbf8f2",
        fontFamily: "serif",
      }}
    >
      <div style={{ fontSize: 96, letterSpacing: 24 }}>YM TEXTILES</div>
      <div style={{ marginTop: 24, fontSize: 36, color: "#f2eadb" }}>
        Pakistani clothing, stocked in the UK
      </div>
      <div
        style={{
          marginTop: 48,
          padding: "14px 40px",
          borderRadius: 999,
          background: "#b8862e",
          color: "#16332a",
          fontSize: 28,
        }}
      >
        Lawn · Ready to wear · Unstitched · Formal
      </div>
    </div>,
    size,
  );
}
