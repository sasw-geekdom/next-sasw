import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const alt = "15 Years of Geekdom";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OgImage() {
  const [oswald, logoPng] = await Promise.all([
    readFile(
      join(
        process.cwd(),
        "node_modules/@fontsource/oswald/files/oswald-latin-700-normal.woff",
      ),
    ),
    readFile(join(process.cwd(), "public/brand/og-geekdom.png")),
  ]);
  const logo = `data:image/png;base64,${logoPng.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#000000",
          padding: "0 84px",
          fontFamily: "Oswald",
        }}
      >
        <div
          style={{
            fontSize: 30,
            letterSpacing: 6,
            color: "#ff32a0",
            textTransform: "uppercase",
          }}
        >
          The throwback
        </div>

        <div
          style={{
            fontSize: 104,
            lineHeight: 0.94,
            color: "#ffffff",
            textTransform: "uppercase",
            marginTop: 18,
          }}
        >
          15 Years of
        </div>

        {/* Geekdom wordmark (white). eslint-disable-next-line @next/next/no-img-element */}
        <img src={logo} width={620} height={168} alt="" style={{ marginTop: 40 }} />
      </div>
    ),
    {
      ...size,
      fonts: [{ name: "Oswald", data: oswald, weight: 700, style: "normal" }],
    },
  );
}
