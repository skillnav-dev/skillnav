import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/admin-session";

/**
 * Server-side auth guard for admin pages.
 * Call at the top of each protected page's server component.
 * Redirects to /admin/login unless the request carries a valid signed session.
 */
export async function requireAdmin() {
  if (!(await isAdmin())) {
    redirect("/admin/login");
  }
}
