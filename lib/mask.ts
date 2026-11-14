import type { CSSProperties } from "react";

/** A mark's artwork as a CSS mask, fitted whole and centred in its box. */
export function maskOf(src: string): CSSProperties {
  const image = `url("${src}")`;
  return {
    maskImage: image,
    WebkitMaskImage: image,
    maskSize: "contain",
    WebkitMaskSize: "contain",
    maskRepeat: "no-repeat",
    WebkitMaskRepeat: "no-repeat",
    maskPosition: "center",
    WebkitMaskPosition: "center",
  };
}
