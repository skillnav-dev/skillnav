import { cookies } from "next/headers";
import { redirect } from "next/navigation";

/**
 * Server-side auth guard for admin pages.
 * Call at the top of each protected page's server component.
 * Redirects to /admin/login if no valid session cookie.
 */
export async function requireAdmin() {
  const cookieStore = await cookies();
  const session = cookieStore.get("admin_session");
  if (!session?.value) {
    redirect("/admin/login");
  }
}
