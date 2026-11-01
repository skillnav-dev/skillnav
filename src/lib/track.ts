/**
 * Client-side Umami event tracking. No-op when the Umami script is absent
 * (e.g. NEXT_PUBLIC_UMAMI_WEBSITE_ID unset in local dev).
 */
type UmamiData = Record<string, string | number | boolean>;

declare global {
  interface Window {
    umami?: { track: (event: string, data?: UmamiData) => void };
  }
}

export function trackEvent(event: string, data?: UmamiData): void {
  if (typeof window === "undefined") return;
  try {
    window.umami?.track(event, data);
  } catch {
    // Analytics must never break the UI
  }
}
