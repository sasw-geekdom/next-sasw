"use client";

import * as React from "react";
import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";
import {
  Brand,
  NavSections,
  AccountBadge,
} from "@/components/admin/shell/nav-sections";
import { SignOutButton } from "@/components/auth/sign-out-button";
import type { AdminUser } from "@/lib/auth/roles";

const EASE = [0.32, 0.72, 0, 1] as const;

/** Off-canvas nav for < lg. Opens from a hamburger in the top bar. */
export function MobileNav({
  open,
  onClose,
  user,
}: {
  open: boolean;
  onClose: () => void;
  user: AdminUser;
}) {
  React.useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
          <motion.div
            className="absolute inset-0 bg-black/40"
            onClick={onClose}
            aria-hidden
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          />
          <motion.aside
            className="absolute left-0 top-0 flex h-full w-72 max-w-[82%] flex-col bg-white shadow-xl"
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ duration: 0.3, ease: EASE }}
          >
            <div className="flex h-14 items-center justify-between border-b border-border px-4">
              <Brand />
              <button
                onClick={onClose}
                aria-label="Close menu"
                className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="h-5 w-5" strokeWidth={1.6} />
              </button>
            </div>

            <NavSections onNavigate={onClose} />

            <div className="border-t border-border p-2">
              <AccountBadge user={user} />
              <div className="px-1 pt-1">
                <SignOutButton />
              </div>
            </div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}
