import Link from "next/link";
import { ThemeToggleButton } from "./theme-shell";

interface MastheadProps {
  counts: {
    all: number;
    paper: number;
    tool: number;
    news: number;
    community: number;
  };
  dateLabel: string;
  pingLabel: string;
  totalLabel: string;
  viewsLabel?: string;
}

export function Masthead({
  counts,
  dateLabel,
  pingLabel,
  totalLabel,
  viewsLabel,
}: MastheadProps) {
  return (
    <>
      <header className="v-masthead">
        <div className="v-masthead-inner">
          <div className="v-brand">
            <div className="v-brand-mark">
              脉 <span className="dot">·</span> Pulse
            </div>
            <div className="v-brand-tag">AI TRENDING · DAILY</div>
          </div>
          <nav className="v-nav">
            <Link href="/trending-v2" className="active">
              全部 <span className="count">{counts.all}</span>
            </Link>
            <Link href="/trending-v2#papers">
              论文 <span className="count">{counts.paper}</span>
            </Link>
            <Link href="/trending-v2#tools">
              工具 <span className="count">{counts.tool}</span>
            </Link>
            <Link href="/trending-v2#news">
              资讯 <span className="count">{counts.news}</span>
            </Link>
            <Link href="/trending-v2#community">
              社区 <span className="count">{counts.community}</span>
            </Link>
          </nav>
          <div className="v-masthead-right">
            <div className="v-search" aria-label="搜索">
              <svg
                width="12"
                height="12"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <circle cx="7" cy="7" r="5" />
                <path d="m11 11 3 3" />
              </svg>
              <input placeholder="搜索热点…" disabled />
              <span style={{ color: "var(--v-ink-4)" }}>⌘K</span>
            </div>
            <span>{dateLabel}</span>
            <ThemeToggleButton />
          </div>
        </div>
      </header>

      <div className="v-dateline">
        <div className="left">
          <span>{dateLabel}</span>
          <span className="v-ping">{pingLabel}</span>
          <span>{totalLabel}</span>
        </div>
        {viewsLabel && <div>{viewsLabel}</div>}
      </div>
    </>
  );
}
