import { NextRequest } from "next/server";

const ARXIV_ID_RE = /^\d{4}\.\d{4,5}(v\d+)?$/;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  if (!ARXIV_ID_RE.test(id)) {
    return new Response("Invalid paper ID", { status: 400 });
  }

  const targetUrl = `https://arxiv.org/abs/${id}`;

  // Fire-and-forget Umami tracking (server-side)
  const websiteId = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID;
  if (websiteId) {
    fetch("https://cloud.umami.is/api/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": request.headers.get("user-agent") || "",
      },
      body: JSON.stringify({
        payload: {
          website: websiteId,
          url: `/go/paper/${id}`,
          referrer: request.headers.get("referer") || "",
          hostname: "skillnav.dev",
          language: request.headers.get("accept-language") || "",
        },
        type: "event",
      }),
    }).catch(() => {});
  }

  return new Response(null, {
    status: 302,
    headers: {
      Location: targetUrl,
      "Cache-Control": "no-store",
    },
  });
}
