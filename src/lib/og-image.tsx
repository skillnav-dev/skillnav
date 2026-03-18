import { ImageResponse } from "next/og";

export const ogSize = { width: 1200, height: 630 };
export const ogContentType = "image/png";

interface OgImageProps {
  title: string;
  label?: string;
  description?: string;
}

/**
 * Shared OG image generator with brand styling.
 * Used by per-route opengraph-image.tsx files.
 */
export function generateOgImage({ title, label, description }: OgImageProps) {
  // Truncate long titles
  const displayTitle = title.length > 60 ? title.slice(0, 57) + "..." : title;
  const displayDesc =
    description && description.length > 80
      ? description.slice(0, 77) + "..."
      : description;

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "80px",
        background:
          "linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)",
        fontFamily: "sans-serif",
      }}
    >
      {label && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginBottom: "24px",
          }}
        >
          <div
            style={{
              padding: "6px 16px",
              borderRadius: "9999px",
              background: "rgba(255,255,255,0.15)",
              fontSize: "18px",
              color: "rgba(255,255,255,0.8)",
              fontWeight: 600,
            }}
          >
            {label}
          </div>
        </div>
      )}
      <div
        style={{
          fontSize: title.length > 30 ? "42px" : "52px",
          fontWeight: 800,
          color: "white",
          lineHeight: 1.2,
          letterSpacing: "-0.5px",
        }}
      >
        {displayTitle}
      </div>
      {displayDesc && (
        <div
          style={{
            fontSize: "22px",
            color: "rgba(255,255,255,0.7)",
            marginTop: "20px",
            lineHeight: 1.4,
          }}
        >
          {displayDesc}
        </div>
      )}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          marginTop: "auto",
          paddingTop: "40px",
        }}
      >
        <div
          style={{
            width: "40px",
            height: "40px",
            borderRadius: "10px",
            background: "rgba(255,255,255,0.15)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "22px",
          }}
        >
          ⚡
        </div>
        <div
          style={{
            fontSize: "24px",
            fontWeight: 700,
            color: "rgba(255,255,255,0.8)",
          }}
        >
          SkillNav
        </div>
        <div
          style={{
            fontSize: "18px",
            color: "rgba(255,255,255,0.4)",
            marginLeft: "8px",
          }}
        >
          skillnav.dev
        </div>
      </div>
    </div>,
    { ...ogSize },
  );
}
