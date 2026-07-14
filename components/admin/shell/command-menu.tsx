"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { Search } from "lucide-react";
import { ALL_NAV } from "@/lib/admin/nav";
import { cn } from "@/lib/utils";

interface Command {
  key: string;
  label: string;
  hint?: string;
  run: () => void;
  icon?: React.ReactNode;
}

export function CommandMenu({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [query, setQuery] = React.useState("");
  const [active, setActive] = React.useState(0);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const go = React.useCallback(
    (href: string) => {
      onClose();
      router.push(href);
    },
    [onClose, router],
  );

  const commands = React.useMemo<Command[]>(() => {
    const q = query.trim().toLowerCase();

    const nav: Command[] = ALL_NAV.filter((n) =>
      n.label.toLowerCase().includes(q),
    ).map((n) => {
      const Icon = n.icon;
      return {
        key: n.href,
        label: n.label,
        hint: n.href.startsWith("/admin/content/") ? "Content" : "Go to",
        icon: <Icon className="h-4 w-4" strokeWidth={1.5} />,
        run: () => go(n.href),
      };
    });

    const search: Command[] = q
      ? [
          {
            key: "search-reg",
            label: `Search registrations for “${query.trim()}”`,
            hint: "Check-in",
            run: () => go(`/admin/checkin?q=${encodeURIComponent(query.trim())}`),
          },
        ]
      : [];

    return [...nav, ...search];
  }, [query, go]);

  React.useEffect(() => setActive(0), [query, open]);

  React.useEffect(() => {
    if (open) {
      setQuery("");
      const t = setTimeout(() => inputRef.current?.focus(), 0);
      return () => clearTimeout(t);
    }
  }, [open]);

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, commands.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      commands[active]?.run();
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-60" role="dialog" aria-modal="true">
          <motion.div
            className="absolute inset-0 bg-black/40"
            onClick={onClose}
            aria-hidden
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
          />
          <div className="absolute left-1/2 top-24 w-full max-w-lg -translate-x-1/2 px-4">
            <motion.div
              className="overflow-hidden rounded-xl border border-border bg-white shadow-2xl"
              initial={{ opacity: 0, scale: 0.97, y: -6 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: -6 }}
              transition={{ duration: 0.16, ease: "easeOut" }}
            >
              <div className="flex items-center gap-2 border-b border-border px-4">
                <Search className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={onKeyDown}
                  placeholder="Jump to a section, or search registrations…"
                  className="h-12 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                />
              </div>

              <ul className="max-h-80 overflow-y-auto p-2">
                {commands.length === 0 ? (
                  <li className="px-3 py-6 text-center text-sm text-muted-foreground">
                    No matches.
                  </li>
                ) : (
                  commands.map((c, i) => (
                    <li key={c.key}>
                      <button
                        onMouseEnter={() => setActive(i)}
                        onClick={c.run}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm",
                          i === active && "bg-muted",
                        )}
                      >
                        <span className="text-muted-foreground">{c.icon}</span>
                        <span className="flex-1 truncate">{c.label}</span>
                        {c.hint && (
                          <span className="text-xs text-muted-foreground">{c.hint}</span>
                        )}
                      </button>
                    </li>
                  ))
                )}
              </ul>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
