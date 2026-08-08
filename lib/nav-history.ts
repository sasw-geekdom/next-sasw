// Did this visitor reach the current page from somewhere else on this site?
//
// Module state on purpose. A client module is evaluated once per document and
// survives every client-side navigation after it, so this flag is false on a
// hard load and true once the router has moved at least once — which is
// exactly the question a back control needs to answer.
//
// The alternatives don't work here:
//
//   `document.referrer`  is frozen at document load. After a client-side
//                        transition it still names whatever loaded the first
//                        page, so it reports "external" for someone who has
//                        been clicking around the site for ten minutes.
//   `history.length`     counts entries from other origins too, so arriving
//                        from a search result reads the same as arriving from
//                        /sessions.
//   `history.state`      does carry a Next router key, but its shape is an
//                        internal detail and this repo is pinned to a Next
//                        whose internals differ from the documented ones.
//
// sessionStorage would also work, but it persists across hard reloads within a
// tab — so reloading a shared link would wrongly claim an in-app history that
// the back stack no longer has.

let internal = false;

/** Called by NavWatcher on every client-side route change after the first. */
export function markInternalNav(): void {
  internal = true;
}

/**
 * True once the router has navigated at least once in this document.
 *
 * Read at click time rather than on mount: effects run child-first, so a back
 * control mounted inside the layout would read this before the layout's own
 * watcher had set it, and would get a stale false on the very first
 * navigation — the one case that matters most.
 */
export function cameFromInsideTheApp(): boolean {
  return internal;
}
