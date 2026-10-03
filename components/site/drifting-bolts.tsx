/**
 * The week's mini bolts drifting up a box — the texture of the Startup Bash
 * TV and social screens (MiniBolts in components/tv/tv-kit.tsx), sized for a
 * page rather than a 1920×1080 stage.
 *
 * Pure CSS and server-rendered: each bolt is one element with its own speed
 * and a negative delay, so the field is already full on the first frame. The
 * box is a size container and the drift runs in `cqh`, so the bolts cross
 * whatever height they are given. See `.bolt-drift` in app/globals.css.
 */
function field(count: number) {
  let seed = 11;
  const r = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  // Rounded: the server and the browser print long floats differently in
  // inline styles, and the difference is a hydration mismatch.
  const q = (n: number) => Math.round(n * 100) / 100;
  return Array.from({ length: count }, () => {
    const near = Math.pow(r(), 1.6);
    return {
      x: q(r() * 96),
      s: q(14 + near * 64),
      o: q(0.12 + near * 0.5),
      dur: q(46 - near * 30),
      delay: q(-r() * 46),
      rot: q(r() * 50 - 25),
      blur: q((1 - near) * 1.4),
    };
  });
}

const BOLTS = field(40);

export function DriftingBolts() {
  return (
    <div className="absolute inset-0 overflow-hidden" style={{ containerType: "size" }}>
      {BOLTS.map((b, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={i}
          src="/brand/sastw-bolt.svg"
          alt=""
          className="bolt-drift absolute top-0"
          style={{
            left: `${b.x}%`,
            width: b.s,
            height: b.s,
            opacity: b.o,
            filter: `blur(${b.blur}px)`,
            animationDuration: `${b.dur}s`,
            animationDelay: `${b.delay}s`,
            ["--rot" as string]: `${b.rot}deg`,
          }}
        />
      ))}
    </div>
  );
}
