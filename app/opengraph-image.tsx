import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const alt = "San Antonio Startup + Tech Week — Sept 28 – Oct 2, 2026";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OgImage() {
  const [oswald, boltSvg] = await Promise.all([
    readFile(
      join(
        process.cwd(),
        "node_modules/@fontsource/oswald/files/oswald-latin-700-normal.woff",
      ),
    ),
    readFile(join(process.cwd(), "public/brand/sastw-bolt.svg")),
  ]);
  const bolt = `data:image/svg+xml;base64,${boltSvg.toString("base64")}`;

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
        <div style={{ display: "flex", flexDirection: "column", maxWidth: 700 }}>
          <div
            style={{
              fontSize: 30,
              letterSpacing: 6,
              color: "#ff32a0",
              textTransform: "uppercase",
            }}
          >
            Sept 28 – Oct 2, 2026
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              marginTop: 22,
              color: "#ffffff",
              textTransform: "uppercase",
              fontSize: 92,
              lineHeight: 0.94,
            }}
          >
            <div>San Antonio</div>
            <div>Startup + Tech Week</div>
          </div>
          <div
            style={{
              fontSize: 34,
              letterSpacing: 3,
              color: "#ff32a0",
              textTransform: "uppercase",
              marginTop: 30,
            }}
          >
            Plug in.
          </div>
        </div>

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={bolt} width={300} height={300} alt="" />
      </div>
    ),
    {
      ...size,
      fonts: [{ name: "Oswald", data: oswald, weight: 700, style: "normal" }],
    },
  );
}
