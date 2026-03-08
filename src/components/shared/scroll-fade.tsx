"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";

interface ScrollFadeProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Horizontal scroll container with gradient fade indicators.
 * Shows left/right gradients based on scroll position.
 * On desktop (sm+), children wrap normally and gradients are hidden.
 */
export function ScrollFade({ children, className }: ScrollFadeProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 2);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 2);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    updateScrollState();
    el.addEventListener("scroll", updateScrollState, { passive: true });
    // Recheck on resize (e.g. orientation change)
    window.addEventListener("resize", updateScrollState);

    return () => {
      el.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", updateScrollState);
    };
  }, [updateScrollState]);

  return (
    <div className={cn("relative sm:contents", className)}>
      {/* Left fade */}
      <div
        className={cn(
          "pointer-events-none absolute inset-y-0 left-0 z-10 w-6 bg-gradient-to-r from-background to-transparent transition-opacity sm:hidden",
          canScrollLeft ? "opacity-100" : "opacity-0",
        )}
        aria-hidden
      />
      {/* Right fade */}
      <div
        className={cn(
          "pointer-events-none absolute inset-y-0 right-0 z-10 w-6 bg-gradient-to-l from-background to-transparent transition-opacity sm:hidden",
          canScrollRight ? "opacity-100" : "opacity-0",
        )}
        aria-hidden
      />
      <div
        ref={scrollRef}
        className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0"
      >
        {children}
      </div>
    </div>
  );
}
