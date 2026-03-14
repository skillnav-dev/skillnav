import type { Metadata } from "next";
import Link from "next/link";
import { Toaster } from "@/components/ui/sonner";
import { AdminLogoutButton } from "@/components/admin/logout-button";

export const metadata: Metadata = {
  title: {
    default: "Admin",
    template: "%s | SkillNav Admin",
  },
  robots: { index: false, follow: false },
};

const adminNavItems = [
  { title: "Dashboard", href: "/admin" },
  { title: "文章管理", href: "/admin/articles" },
  { title: "Skill 管理", href: "/admin/skills" },
  { title: "MCP 管理", href: "/admin/mcp" },
] as const;

// Auth is checked at page level via requireAdmin() helper,
// not in layout (login page nests under this layout too).
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-svh bg-muted/40">
      <header className="sticky top-0 z-40 border-b bg-background">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
          <div className="flex items-center gap-6">
            <Link href="/admin" className="text-base font-semibold">
              SkillNav Admin
            </Link>
            <nav className="flex items-center gap-4">
              {adminNavItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  {item.title}
                </Link>
              ))}
            </nav>
          </div>
          <AdminLogoutButton />
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8">{children}</main>
      <Toaster richColors position="top-right" />
    </div>
  );
}
