"use client";

import { Button } from "@/components/ui/button";
import { Link2, Twitter } from "lucide-react";
import { toast } from "sonner";

interface ShareButtonsProps {
  url: string;
  title: string;
}

export function ShareButtons({ url, title }: ShareButtonsProps) {
  const fullUrl = `https://skillnav.dev${url}`;

  function shareToTwitter() {
    const text = encodeURIComponent(title);
    const link = encodeURIComponent(fullUrl);
    window.open(
      `https://twitter.com/intent/tweet?text=${text}&url=${link}`,
      "_blank",
      "noopener,noreferrer",
    );
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(fullUrl);
      toast.success("链接已复制");
    } catch {
      toast.error("复制失败，请手动复制");
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        className="h-8 gap-1.5 text-xs"
        onClick={shareToTwitter}
      >
        <Twitter className="size-3.5" />
        分享
      </Button>
      <Button
        variant="outline"
        size="sm"
        className="h-8 gap-1.5 text-xs"
        onClick={copyLink}
      >
        <Link2 className="size-3.5" />
        复制链接
      </Button>
    </div>
  );
}
