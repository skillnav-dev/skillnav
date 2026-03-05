"use client";

import { useState } from "react";
import { ImageOff } from "lucide-react";

interface FallbackImageProps {
  src: string;
  alt: string;
  className?: string;
  loading?: "lazy" | "eager";
}

// Image component with branded placeholder fallback for broken external CDN images
export function FallbackImage({
  src,
  alt,
  className,
  loading,
}: FallbackImageProps) {
  const [errored, setErrored] = useState(false);

  if (errored) {
    return (
      <div
        className={`flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-primary/10 via-accent/10 to-primary/5 ${className ?? ""}`}
        role="img"
        aria-label={alt}
      >
        <ImageOff className="size-8 text-muted-foreground/30" />
        <span className="text-lg font-semibold text-muted-foreground/40">
          SkillNav
        </span>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className={className}
      loading={loading}
      onError={() => setErrored(true)}
    />
  );
}
