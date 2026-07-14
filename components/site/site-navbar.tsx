"use client";

import * as React from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { ButtonLink } from "@/components/ui/button";

const LINKS = [{ label: "Call for Speakers", href: "/call-for-speakers" }];
const EASE = [0.32, 0.72, 0, 1] as const;

export function SiteNavbar() {
  const [open, setOpen] = React.useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-6">
        <Link href="/" aria-label="San Antonio Startup + Tech Week — home">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/sastw-horizontal-black.svg"
            alt="San Antonio Startup + Tech Week"
            className="h-9 w-auto sm:h-11"
          />
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {l.label}
            </Link>
          ))}
          <ButtonLink href="/register" size="sm">
            Register
          </ButtonLink>
        </nav>

        <button
          onClick={() => setOpen((o) => !o)}
          aria-label={open ? "Close menu" : "Open menu"}
          className="-mr-1 rounded-md p-1.5 text-foreground hover:bg-muted md:hidden"
        >
          <span className="relative inline-flex h-6 w-6 items-center justify-center">
            <Menu
              className="absolute h-6 w-6 transition-opacity duration-200"
              style={{ opacity: open ? 0 : 1 }}
            />
            <X
              className="absolute h-6 w-6 transition-opacity duration-200"
              style={{ opacity: open ? 1 : 0 }}
            />
          </span>
        </button>
      </div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            className="overflow-hidden border-t border-border md:hidden"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: EASE }}
          >
            <div className="mx-auto flex w-full max-w-7xl flex-col gap-1 px-6 py-4">
              {LINKS.map((l, i) => (
                <motion.div
                  key={l.href}
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.08 + i * 0.05, duration: 0.2 }}
                >
                  <Link
                    href={l.href}
                    onClick={() => setOpen(false)}
                    className="block rounded-md px-2 py-2 text-base font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    {l.label}
                  </Link>
                </motion.div>
              ))}
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 + LINKS.length * 0.05, duration: 0.2 }}
              >
                <ButtonLink
                  href="/register"
                  onClick={() => setOpen(false)}
                  className="mt-2 w-full"
                >
                  Register
                </ButtonLink>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
