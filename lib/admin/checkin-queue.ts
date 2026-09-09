"use client";

import * as React from "react";
import type { AttendeeType } from "@/lib/admin/types";

/**
 * Check-ins that have not reached the server yet.
 *
 * Venue wifi drops. When it did, every tap failed, the row snapped back to
 * "Check in", and the person on the door had no way to tell whether it had
 * saved — so the honest options were to guess or to fall back to paper. This
 * holds the failed writes instead and replays them when the network returns.
 *
 * Deliberately not a service worker. That would also survive a reload, but it
 * is a build-time concern with its own cache-invalidation failure modes, and it
 * is the wrong risk to take on in the fortnight before an event. What this does
 * cover is the actual failure — wifi flaking for seconds or minutes while the
 * door device sits on one page all day. What it does not cover is a reload
 * while offline: the queue survives in `localStorage`, but Next cannot serve
 * the page itself without a connection, so nothing will be there to replay it
 * until the network is back.
 *
 * Every operation it stores is safe to send twice. `checkIn` and `undo` are
 * keyed on a day and use `arrayUnion`/filter, and a walk-in carries a
 * `clientId` the server matches on — so a retry that actually did land the
 * first time is a no-op rather than a duplicate person.
 */
const KEY = "sastw.checkin.queue.v1";

export type QueuedOp =
  | { kind: "checkIn"; clientId: string; id: string; day: string; name: string }
  | { kind: "undo"; clientId: string; id: string; day: string; name: string }
  | {
      kind: "walkIn";
      clientId: string;
      day: string;
      name: string;
      email: string;
      attendeeType: AttendeeType;
    };

/**
 * `localStorage` and `navigator.onLine` are external stores, so they are read
 * through `useSyncExternalStore` rather than copied into state on mount. The
 * snapshot has to be referentially stable or React re-renders forever, hence
 * the cache: the serialised string is the identity, and the parsed array is
 * only rebuilt when that string changes.
 */
let cachedRaw: string | null = null;
let cachedOps: QueuedOp[] = [];
const EMPTY: QueuedOp[] = [];
const EVENT = "sastw:checkin-queue";

function rawQueue(): string | null {
  try {
    return localStorage.getItem(KEY);
  } catch {
    // Private mode, cleared storage, quota — a door that cannot persist its
    // queue should still take check-ins, it just loses them on reload.
    return null;
  }
}

function read(): QueuedOp[] {
  const raw = rawQueue();
  if (raw === cachedRaw) return cachedOps;
  cachedRaw = raw;
  try {
    cachedOps = raw ? (JSON.parse(raw) as QueuedOp[]) : EMPTY;
  } catch {
    cachedOps = EMPTY;
  }
  return cachedOps;
}

function write(ops: QueuedOp[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(ops));
  } catch {
    /* see `rawQueue` */
  }
  window.dispatchEvent(new Event(EVENT));
}

function subscribeQueue(onChange: () => void) {
  window.addEventListener(EVENT, onChange);
  // `storage` fires for other tabs — a second door device in the same browser.
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

function subscribeOnline(onChange: () => void) {
  window.addEventListener("online", onChange);
  window.addEventListener("offline", onChange);
  return () => {
    window.removeEventListener("online", onChange);
    window.removeEventListener("offline", onChange);
  };
}

export function newClientId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * The queue, plus a drain loop.
 *
 * `send` is called for every operation whether online or not: it tries once,
 * and on a network failure the operation is kept rather than reverted. Retries
 * happen when the browser reports it is back online and on a slow timer, since
 * `online` fires for a connected-but-useless network more often than anyone
 * would like.
 */
export function useCheckinQueue(
  send: (op: QueuedOp) => Promise<{ ok: boolean; error?: string }>,
) {
  const queue = React.useSyncExternalStore(
    subscribeQueue,
    read,
    () => EMPTY, // nothing is queued during SSR
  );
  const online = React.useSyncExternalStore(
    subscribeOnline,
    () => navigator.onLine,
    () => true,
  );

  const draining = React.useRef(false);
  // The sender closes over component state, so keep the latest without making
  // it a dependency of the drain loop.
  const sendRef = React.useRef(send);
  React.useEffect(() => {
    sendRef.current = send;
  });

  const drain = React.useCallback(async () => {
    if (draining.current) return;
    draining.current = true;
    try {
      let ops = read();
      while (ops.length > 0) {
        const [head, ...rest] = ops;
        try {
          await sendRef.current(head);
        } catch {
          break; // still offline — stop, keep everything, try again later
        }
        // Anything the server actually answered is done with, refusal included:
        // a rejection that is not a network failure (a deleted registration,
        // say) would otherwise block every operation behind it forever.
        ops = rest;
        write(ops);
      }
    } finally {
      draining.current = false;
    }
  }, []);

  React.useEffect(() => {
    const up = () => void drain();
    window.addEventListener("online", up);
    const timer = setInterval(() => void drain(), 15000);
    return () => {
      window.removeEventListener("online", up);
      clearInterval(timer);
    };
  }, [drain]);

  /** Try it now; keep it for later if the network is what refused. */
  const run = React.useCallback(
    async (
      op: QueuedOp,
    ): Promise<{ ok: boolean; queued: boolean; error?: string }> => {
      try {
        const res = await sendRef.current(op);
        return { ok: res.ok, queued: false, error: res.error };
      } catch {
        write([...read(), op]);
        return { ok: false, queued: true };
      }
    },
    [],
  );

  return { queue, online, run, retry: drain };
}
