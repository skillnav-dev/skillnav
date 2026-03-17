import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "SkillNav - 中文开发者的 AI 智能体工具站";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background:
          "linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)",
        fontFamily: "sans-serif",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "16px",
          marginBottom: "24px",
        }}
      >
        <div
          style={{
            width: "64px",
            height: "64px",
            borderRadius: "16px",
            background: "rgba(255,255,255,0.15)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "36px",
          }}
        >
          ⚡
        </div>
        <div
          style={{
            fontSize: "56px",
            fontWeight: 800,
            color: "white",
            letterSpacing: "-1px",
          }}
        >
          SkillNav
        </div>
      </div>
      <div
        style={{
          fontSize: "28px",
          color: "rgba(255,255,255,0.85)",
          maxWidth: "700px",
          textAlign: "center",
          lineHeight: 1.4,
        }}
      >
        中文开发者的 AI 智能体工具站
      </div>
      <div
        style={{
          display: "flex",
          gap: "32px",
          marginTop: "40px",
          fontSize: "20px",
          color: "rgba(255,255,255,0.6)",
        }}
      >
        <span>Skills</span>
        <span>·</span>
        <span>MCP</span>
        <span>·</span>
        <span>实战资讯</span>
      </div>
    </div>,
    { ...size },
  );
}
