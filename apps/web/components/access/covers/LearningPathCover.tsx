import { pickCoverIndex } from './coverSelection';

// Six original, locally-defined abstract covers — restrained blue/purple/
// teal accents matching the existing --plus/--primary/--secondary design
// tokens. Purely decorative presentation (CMS-PO-014 §5 acceptance
// criterion 6 forbids new CMS designations), so each path is mapped to one
// of these deterministically by its content_items.id, never stored, never
// authored per-path, and never a stock photo or emoji.
//
// Style: a soft blurred gradient-mesh wash (two glow orbs) underneath a
// crisp fine-line abstract motif — the same "premium SaaS cover" language
// as Linear/Stripe doc covers — rather than flat placeholder geometry.

function GlowOrbs({ a, b, colorA, colorB }: { a: [number, number]; b: [number, number]; colorA: string; colorB: string }) {
  return (
    <>
      <circle cx={a[0]} cy={a[1]} r="70" fill={colorA} fillOpacity="0.22" filter="url(#path-cover-blur)" />
      <circle cx={b[0]} cy={b[1]} r="56" fill={colorB} fillOpacity="0.18" filter="url(#path-cover-blur)" />
    </>
  );
}

function NetworkCover() {
  const nodes: Array<[number, number]> = [
    [52, 52],
    [122, 32],
    [192, 70],
    [252, 42],
    [92, 112],
    [202, 132],
    [262, 102],
  ];
  return (
    <>
      <rect width="320" height="180" fill="var(--background)" />
      <GlowOrbs a={[70, 50]} b={[250, 130]} colorA="var(--plus)" colorB="var(--primary)" />
      {nodes.map(([x, y], i) => {
        const next = nodes[(i + 1) % nodes.length]!;
        return (
          <line key={`l-${x}-${y}`} x1={x} y1={y} x2={next[0]} y2={next[1]} stroke="var(--plus)" strokeOpacity="0.5" strokeWidth="1.25" />
        );
      })}
      {nodes.map(([x, y]) => (
        <circle key={`n-${x}-${y}`} cx={x} cy={y} r="4" fill="var(--plus)" />
      ))}
    </>
  );
}

function LayersCover() {
  return (
    <>
      <rect width="320" height="180" fill="var(--background)" />
      <GlowOrbs a={[110, 60]} b={[230, 130]} colorA="var(--primary)" colorB="var(--secondary)" />
      {[0, 1, 2].map((i) => (
        <polygon
          key={i}
          points={`${160},${50 + i * 24} ${222},${71 + i * 24} ${160},${92 + i * 24} ${98},${71 + i * 24}`}
          fill="var(--primary)"
          fillOpacity={0.45 - i * 0.1}
          stroke="var(--primary)"
          strokeOpacity="0.55"
          strokeWidth="1"
        />
      ))}
    </>
  );
}

function CircuitCover() {
  return (
    <>
      <rect width="320" height="180" fill="var(--background)" />
      <GlowOrbs a={[60, 140]} b={[260, 40]} colorA="var(--secondary)" colorB="var(--plus)" />
      <path d="M30 140 H110 V100 H170 V60 H230 V30" fill="none" stroke="var(--secondary)" strokeOpacity="0.6" strokeWidth="1.75" />
      <path d="M290 150 H230 V110 H150" fill="none" stroke="var(--secondary)" strokeOpacity="0.4" strokeWidth="1.75" />
      {[
        [30, 140],
        [110, 100],
        [170, 60],
        [230, 30],
        [290, 150],
        [150, 110],
      ].map(([x, y]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r="3.5" fill="var(--secondary)" />
      ))}
    </>
  );
}

function OrbitCover() {
  return (
    <>
      <rect width="320" height="180" fill="var(--background)" />
      <GlowOrbs a={[160, 90]} b={[240, 50]} colorA="var(--plus)" colorB="var(--primary)" />
      <circle cx="160" cy="90" r="20" fill="var(--plus)" fillOpacity="0.6" />
      {[42, 64].map((r, i) => (
        <ellipse key={r} cx="160" cy="90" rx={r} ry={r * 0.45} fill="none" stroke={i === 0 ? 'var(--primary)' : 'var(--plus)'} strokeOpacity="0.55" strokeWidth="1" />
      ))}
      <circle cx="224" cy="90" r="4.5" fill="var(--primary)" />
    </>
  );
}

function PrismCover() {
  return (
    <>
      <rect width="320" height="180" fill="var(--background)" />
      <GlowOrbs a={[120, 50]} b={[230, 130]} colorA="var(--primary)" colorB="var(--secondary)" />
      <polygon points="100,140 160,45 220,140" fill="var(--primary)" fillOpacity="0.4" stroke="var(--primary)" strokeOpacity="0.5" strokeWidth="1" />
      <polygon points="160,45 220,140 258,122" fill="var(--secondary)" fillOpacity="0.35" stroke="var(--secondary)" strokeOpacity="0.45" strokeWidth="1" />
      <polygon points="100,140 160,45 62,122" fill="var(--plus)" fillOpacity="0.3" stroke="var(--plus)" strokeOpacity="0.45" strokeWidth="1" />
    </>
  );
}

function GridCover() {
  return (
    <>
      <rect width="320" height="180" fill="var(--background)" />
      <GlowOrbs a={[80, 60]} b={[250, 120]} colorA="var(--plus)" colorB="var(--primary)" />
      {[0, 1, 2].map((row) =>
        [0, 1, 2, 3].map((col) => (
          <rect
            key={`${row}-${col}`}
            x={60 + col * 50}
            y={40 + row * 40}
            width="30"
            height="20"
            rx="3"
            fill="var(--plus)"
            fillOpacity={0.14 + ((row + col) % 3) * 0.14}
            stroke="var(--plus)"
            strokeOpacity="0.25"
          />
        )),
      )}
    </>
  );
}

const COVERS = [NetworkCover, LayersCover, CircuitCover, OrbitCover, PrismCover, GridCover] as const;

export const COVER_COUNT = COVERS.length;

export function LearningPathCover({ id, className }: { id: string; className?: string | undefined }) {
  const index = pickCoverIndex(id, COVER_COUNT);
  const Cover = COVERS[index]!;

  return (
    <svg viewBox="0 0 320 180" className={className} aria-hidden="true" focusable="false">
      <defs>
        <filter id="path-cover-blur" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="22" />
        </filter>
      </defs>
      <Cover />
    </svg>
  );
}
