import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

// Shared Open Graph card: brand copy on the left, the shader-current bolt on
// the right (a still of the live WebGL hero, so share cards match the site).
// Each route's opengraph-image.tsx supplies its own copy.

export const OG_SIZE = { width: 1200, height: 630 };

export interface OgLine {
  text: string;
  /** Trailing word rendered in magenta, e.g. "list." in "Get on the list." */
  magenta?: string;
}

export async function boltOgImage(opts: {
  eyebrow: string;
  lines: OgLine[];
  /** Small magenta line under the title (the sign-off). */
  tagline?: string;
  titleSize?: number;
}) {
  const [oswald, bolt] = await Promise.all([
    readFile(
      join(
        process.cwd(),
        "node_modules/@fontsource/oswald/files/oswald-latin-700-normal.woff",
      ),
    ),
    readFile(join(process.cwd(), "public/brand/bolt-current-og.png")),
  ]);
  const boltSrc = `data:image/png;base64,${bolt.toString("base64")}`;
  const titleSize = opts.titleSize ?? 96;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "#000000",
          padding: "0 84px",
          fontFamily: "Oswald",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", maxWidth: 720 }}>
          <div
            style={{
              fontSize: 30,
              letterSpacing: 6,
              color: "#ff32a0",
              textTransform: "uppercase",
            }}
          >
            {opts.eyebrow}
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              marginTop: 22,
              textTransform: "uppercase",
              fontSize: titleSize,
              lineHeight: 0.98,
              color: "#ffffff",
            }}
          >
            {opts.lines.map((line, i) => (
              // Satori requires explicit flex on multi-child rows; no-shrink
              // spans keep long lines from collapsing onto each other.
              <div key={i} style={{ display: "flex" }}>
                <span style={{ flexShrink: 0 }}>{line.text}</span>
                {line.magenta && (
                  <span
                    style={{
                      color: "#ff32a0",
                      flexShrink: 0,
                      marginLeft: titleSize * 0.2,
                    }}
                  >
                    {line.magenta}
                  </span>
                )}
              </div>
            ))}
          </div>

          {opts.tagline && (
            <div
              style={{
                fontSize: 27,
                letterSpacing: 2,
                color: "#ff32a0",
                textTransform: "uppercase",
                marginTop: 30,
              }}
            >
              {opts.tagline}
            </div>
          )}
        </div>

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={boltSrc} width={340} height={340} alt="" />
      </div>
    ),
    {
      ...OG_SIZE,
      fonts: [{ name: "Oswald", data: oswald, weight: 700, style: "normal" }],
    },
  );
}
