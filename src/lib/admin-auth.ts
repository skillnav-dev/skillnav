import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/admin-session";

export { isAdmin };

/**
 * Server-side auth guard for admin pages and server actions.
 * Call at the top of each protected page's server component and each
 * admin server action (outside any try/catch, redirect() throws).
 * Redirects to /admin/login unless the session cookie carries a valid signature.
 */
export async function requireAdmin() {
  if (!(await isAdmin())) {
    redirect("/admin/login");
  }
}
