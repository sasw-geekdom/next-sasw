"use client";

import { ShaderCanvas } from "@/components/site/shader-canvas";

/** The lightning bolt with the "current" flowing through it. */
export function BoltShader({ color }: { color: string }) {
  return (
    <ShaderCanvas
      color={color}
      maskClassName="bolt-mask"
      fallbackSrc="/brand/sastw-bolt.svg"
      className="aspect-square w-full"
    />
  );
}
