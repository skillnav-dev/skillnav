"use client";

import { logoutAction } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";

export function AdminLogoutButton() {
  return (
    <form action={logoutAction}>
      <Button variant="ghost" size="sm" type="submit">
        退出
      </Button>
    </form>
  );
}
