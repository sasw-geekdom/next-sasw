"use client";

import * as React from "react";

/**
 * Native HTML drag-and-drop list reordering. The list live-reorders while
 * dragging and commits the final id order once on drop.
 */
export function useDragReorder<T extends { id: string }>(
  rows: T[],
  commit: (ids: string[]) => void,
) {
  const [items, setItems] = React.useState(rows);
  const [prevRows, setPrevRows] = React.useState(rows);
  const [draggingId, setDraggingId] = React.useState<string | null>(null);
  const itemsRef = React.useRef(items);
  const from = React.useRef<number | null>(null);
  const moved = React.useRef(false);

  // Adopt fresh server rows (derived state during render — no effect).
  if (rows !== prevRows) {
    setPrevRows(rows);
    setItems(rows);
  }

  React.useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  function dragProps(index: number) {
    return {
      draggable: true,
      onDragStart: (e: React.DragEvent) => {
        from.current = index;
        moved.current = false;
        setDraggingId(itemsRef.current[index]?.id ?? null);
        e.dataTransfer.effectAllowed = "move";
      },
      onDragEnter: (e: React.DragEvent) => {
        e.preventDefault();
        const f = from.current;
        if (f === null || f === index) return;
        setItems((cur) => {
          const next = [...cur];
          const [it] = next.splice(f, 1);
          next.splice(index, 0, it);
          return next;
        });
        from.current = index;
        moved.current = true;
      },
      onDragOver: (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
      },
      onDrop: (e: React.DragEvent) => e.preventDefault(),
      onDragEnd: () => {
        if (moved.current) commit(itemsRef.current.map((r) => r.id));
        from.current = null;
        moved.current = false;
        setDraggingId(null);
      },
    };
  }

  return { items, draggingId, dragProps };
}
