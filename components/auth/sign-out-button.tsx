"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase/client";
import { Button } from "@/components/ui/button";

export function SignOutButton() {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);

  async function onSignOut() {
    setPending(true);
    await auth.signOut().catch(() => {});
    await fetch("/api/auth/session", { method: "DELETE" });
    router.replace("/admin/login");
    router.refresh();
  }

  return (
    <Button
      onClick={onSignOut}
      disabled={pending}
      variant="ghost"
      size="sm"
    >
      {pending ? "Signing out…" : "Sign out"}
    </Button>
  );
}
